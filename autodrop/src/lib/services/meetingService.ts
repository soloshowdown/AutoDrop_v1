"use client";

import { supabase } from "@/lib/supabase";
import { ExtractedTask, Meeting, TranscriptSnippet } from "@/lib/types";
import { createTask, createTaskIfUnique } from "@/lib/services/taskService";

function toTranscriptSegments(segments: Array<{ speaker?: string; text?: string }>): TranscriptSnippet[] {
  return segments.map((segment, index) => ({
    time: `${String(index).padStart(2, "0")}:00`,
    speaker: segment.speaker || "Speaker",
    text: segment.text || "",
  }));
}

import { logActivity } from "./activityService";


export async function listMeetings(workspaceId: string): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching meetings:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    date: row.date ?? row.created_at,
    status: row.status,
    duration: row.duration,
    workspaceId: row.workspace_id,
  }));
}

export async function fetchLiveMeetings(workspaceId: string): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("status", "live")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching live meetings:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    date: row.date ?? row.created_at,
    status: row.status,
    duration: row.duration,
    workspaceId: row.workspace_id,
  }));
}

export async function getMeetingById(id: string): Promise<Meeting | null> {
  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .select("*, transcripts (*)")
    .eq("id", id)
    .single();

  if (meetingError) {
    console.error("Error fetching meeting:", meetingError.message);
    return null;
  }

  return {
    ...meeting,
    date: meeting.date ?? meeting.created_at,
    transcript: (meeting.transcripts ?? []).map((t: any) => ({
      time: t.time,
      speaker: t.speaker,
      text: t.text,
      isActionable: t.is_actionable,
      taskId: t.task_id,
    })),
  };
}

export async function createLiveMeeting(workspaceId: string, roomId: string, title?: string): Promise<Meeting | null> {
  try {
    const response = await fetch("/api/meetings/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, roomId, title }),
    });

    if (!response.ok) {
      console.error("Failed to create live meeting", await response.text());
      return null;
    }

    const meeting = await response.json();
    return {
      ...meeting,
      date: meeting.date ?? meeting.created_at,
    };
  } catch (error) {
    console.error("Error creating live meeting:", error);
    return null;
  }
}

export async function fetchMeetingByRoomId(roomId: string): Promise<Meeting | null> {
  try {
    const response = await fetch(`/api/meetings/room/${encodeURIComponent(roomId)}`);
    if (!response.ok) {
      return null;
    }
    const meeting = await response.json();
    return {
      ...meeting,
      date: meeting.date ?? meeting.created_at,
    };
  } catch (error) {
    console.error("Error fetching meeting by room id:", error);
    return null;
  }
}

export async function setMeetingStatus(meetingId: string, status: "processing" | "live" | "completed" | "failed", duration?: string): Promise<Meeting | null> {
  try {
    const response = await fetch(`/api/meetings/${meetingId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, duration }),
    });

    if (!response.ok) {
      console.error("Failed to update meeting status", await response.text());
      return null;
    }

    const meeting = await response.json();
    return {
      ...meeting,
      date: meeting.date ?? meeting.created_at,
    };
  } catch (error) {
    console.error("Error setting meeting status:", error);
    return null;
  }
}

export async function uploadAndProcessMeeting(file: File, workspaceId: string): Promise<Meeting> {
  // 1. Create meeting with "processing" status
  const title = file.name.replace(/\.[^/.]+$/, "");
  const { data: initialMeeting, error: initError } = await supabase
    .from("meetings")
    .insert({
      workspace_id: workspaceId,
      title: title,
      status: "processing",
      duration: "N/A",
    })
    .select()
    .single();

  if (initError) throw new Error(initError.message);

  // Log upload activity
  await logActivity({
    workspaceId,
    action: "uploaded meeting",
    target: title,
  });

  try {
    const formData = new FormData();
    formData.append("audio", file);

    const response = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
        throw new Error("Transcription failed");
    }

    const payload = (await response.json()) as {
      transcript?: string;
      result?: { 
        segments?: Array<{ speaker?: string; text?: string }>
        tasks?: ExtractedTask[]
      };
    };

    const segments = payload.result?.segments ?? [];
    const extractedTasks = payload.result?.tasks ?? [];

    // 2. Save transcripts
    const transcriptSegments = segments.map((s, i) => ({
      meeting_id: initialMeeting.id,
      speaker: s.speaker || "Speaker",
      text: s.text || "",
      time: `${String(i).padStart(2, "0")}:00`,
    }));

    if (transcriptSegments.length > 0) {
      const { error: tsError } = await supabase.from("transcripts").insert(transcriptSegments);
      if (tsError) console.error("Error saving transcripts:", tsError);
    }

    // 3. Create tasks
    if (extractedTasks.length > 0) {
      await Promise.all(
        extractedTasks
          .filter((task) => task.title?.trim())
          .map(async (task) => {
            try {
              await createTaskIfUnique({
                workspaceId,
                title: task.title,
                status: "Backlog",
                priority: task.priority ?? "medium",
                dueDate: task.deadline ?? undefined,
                meetingId: initialMeeting.id,
                meetingTitle: initialMeeting.title,
                sourceType: "AI",
              });
            } catch (error) {
              console.error(`Failed to create task "${task.title}":`, error);
            }
          })
      );

      // Log task extraction activity
      await logActivity({
        workspaceId,
        action: `generated ${extractedTasks.length} tasks`,
        target: `from ${title}`,
      });
    }

    // 4. Update meeting to "completed"
    const { data: finalMeeting, error: finalError } = await supabase
      .from("meetings")
      .update({ status: "completed" })
      .eq("id", initialMeeting.id)
      .select()
      .single();

    if (finalError) throw finalError;

    return {
      ...finalMeeting,
      date: finalMeeting.date ?? finalMeeting.created_at,
      transcript: toTranscriptSegments(segments),
    };

  } catch (error: any) {
    // 5. Update meeting to "failed" on error
    await supabase
      .from("meetings")
      .update({ status: "failed" })
      .eq("id", initialMeeting.id);
      
    throw error;
  }
}

export function subscribeToMeetings(workspaceId: string, onEvent: (payload: any) => void) {
  return supabase
    .channel(`public:meetings:workspace:${workspaceId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "meetings",
        filter: `workspace_id=eq.${workspaceId}`,
      },
      onEvent
    )
    .subscribe();
}
