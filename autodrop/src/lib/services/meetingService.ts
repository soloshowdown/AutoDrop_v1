"use client";

import { ExtractedTask, Meeting, TranscriptSnippet } from "@/lib/types";
import { createTask } from "@/lib/services/taskService";
import { fetchTeamMembers, createTeamMember } from "@/lib/services/teamService";

const STORAGE_KEY = "autodrop_meetings_v1";

type PersistedMeeting = Meeting;

function readMeetings(): PersistedMeeting[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PersistedMeeting[];
  } catch {
    return [];
  }
}

function writeMeetings(meetings: PersistedMeeting[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
}

function toTranscriptSegments(segments: Array<{ speaker?: string; text?: string }>): TranscriptSnippet[] {
  return segments.map((segment, index) => ({
    time: `${String(index).padStart(2, "0")}:00`,
    speaker: segment.speaker || "Speaker",
    text: segment.text || "",
  }));
}

export function listMeetings(): Meeting[] {
  return readMeetings().sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export function getMeetingById(id: string): Meeting | null {
  return readMeetings().find((meeting) => meeting.id === id) ?? null;
}

export async function uploadAndProcessMeeting(file: File): Promise<Meeting> {
  const formData = new FormData();
  formData.append("audio", file);

  const response = await fetch("/api/transcribe", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? "Failed to process meeting");
  }

  const payload = (await response.json()) as {
    transcript?: string;
    result?: { 
      segments?: Array<{ speaker?: string; text?: string }>
      tasks?: ExtractedTask[]
      participants?: string[]
    };
  };

  const segments = payload.result?.segments ?? [];
  const extractedTasks = payload.result?.tasks ?? [];
  const participants = payload.result?.participants ?? [];
  const transcript = toTranscriptSegments(segments);

  const meeting: Meeting = {
    id: `m-${Date.now()}`,
    roomId: `room-${Date.now()}`,
    title: file.name.replace(/\.[^/.]+$/, ""),
    date: new Date().toISOString(),
    status: "Completed",
    duration: "N/A",
    transcript,
    extractedTasks,
    participants,
  };

  const meetings = [meeting, ...readMeetings()];
  writeMeetings(meetings);

  // Fetch existing team members
  const existingMembers = await fetchTeamMembers();
  const memberMap = new Map(existingMembers.map((m) => [m.name.toLowerCase(), m]));

  // Create new team members for participants not in the system
  for (const participant of participants) {
    const key = participant.toLowerCase();
    if (!memberMap.has(key)) {
      try {
        const newMember = await createTeamMember({ name: participant });
        if (newMember) {
          memberMap.set(key, newMember);
        }
      } catch (error) {
        console.error(`Failed to create team member ${participant}:`, error);
      }
    }
  }

  // Create tasks with assignee IDs and priority
  await Promise.all(
    extractedTasks
      .filter((task) => task.task?.trim())
      .map(async (task) => {
        try {
          const assigneeKey = task.who?.toLowerCase();
          const assignee = assigneeKey ? memberMap.get(assigneeKey) : undefined;

          await createTask({
            title: task.task,
            status: "To Do",
            priority: task.priority ?? "medium",
            dueDate: task.due_date ?? undefined,
            assigneeId: assignee?.id,
            requestedBy: task.to_whom ?? undefined,
            meetingId: meeting.id,
          });
        } catch (error) {
          console.error(`Failed to create task "${task.task}":`, error);
        }
      })
  );

  return meeting;
}
