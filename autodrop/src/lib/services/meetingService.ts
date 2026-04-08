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
    roomId: row.room_id,
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
    roomId: row.room_id,
  }));
}

export async function getMeetingById(id: string): Promise<Meeting | null> {
  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .select("*, transcripts (*), tasks (*)")
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
    // Map tasks using the existing taskService logic if needed, 
    // but here we can just do a basic map for now to preserve types.
    // Normalized tasks are important for the UI.
    tasks: (meeting.tasks ?? []).map((t: any) => ({
      id: String(t.id),
      title: String(t.title),
      status: t.status,
      priority: t.priority,
      dueDate: t.due_date,
      assignee: t.assignee_name,
      assigneeId: t.assignee_id,
      meetingId: t.meeting_id,
      sourceType: t.source_type,
      approved: !!t.approved,
      confidence: t.confidence,
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
      roomId: meeting.room_id,
    };
  } catch (error) {
    console.error("Error fetching meeting by room id:", error);
    return null;
  }
}

export async function setMeetingStatus(meetingId: string, status: "processing" | "live" | "extracting" | "completed" | "failed", duration?: string): Promise<Meeting | null> {
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

export async function createMeeting(workspaceId: string, title: string): Promise<Meeting> {
  const { data, error } = await supabase
    .from("meetings")
    .insert({
      workspace_id: workspaceId,
      title: title,
      status: "processing",
      duration: "N/A",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logActivity({
    workspaceId,
    action: "started processing meeting",
    target: title,
  });

  return {
    ...data,
    date: data.date ?? data.created_at,
  };
}

export async function uploadAndProcessMeeting(file: File, workspaceId: string, meetingId: string): Promise<void> {
  const formData = new FormData();
  formData.append("audio", file);
  formData.append("meetingId", meetingId);

  const response = await fetch("/api/transcribe", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Transcription failed" }));
    throw new Error(errorData.error || "Transcription failed");
  }

  // Activity logging for task extraction is now harder since it's server-side, 
  // but we logged the start above.
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
