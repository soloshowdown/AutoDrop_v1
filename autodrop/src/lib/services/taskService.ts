"use client";

import { supabase } from "@/lib/supabase";
import { Task, TaskStatus } from "@/lib/types";
import { logActivity } from "./activityService";

function normalizeTask(row: any): Task {
  if (!row) return {} as Task;
  return {
    id: String(row.id),
    title: String(row.title ?? "Untitled Task"),
    status: (row.status as TaskStatus) ?? "To Do",
    priority: (row.priority as any) ?? "medium",
    dueDate: row.due_date ? String(row.due_date) : undefined,
    assigneeId: row.assignee_id ? String(row.assignee_id) : undefined,
    assignee: typeof row.assignee === 'object' ? row.assignee?.name : undefined,
    sourceType: (row.source_type as any) ?? "User",
    meetingId: row.meeting_id ? String(row.meeting_id) : undefined,
    meetingTitle: row.meeting_title ? String(row.meeting_title) : undefined,
    transcriptTimestamp: row.transcript_timestamp ? String(row.transcript_timestamp) : undefined,
    approved: !!row.approved,
  };
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export async function fetchTasks(workspaceId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*, assignee:users!assignee_id(*)")
    .eq("workspace_id", workspaceId)
    .eq("approved", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tasks:", error.message);
    throw error;
  }

  return (data ?? []).map((r) => normalizeTask(r));
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus
): Promise<void> {
  const { data: task, error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId)
    .select("title, workspace_id")
    .single();

  if (error) throw new Error(error.message);

  // Log activity on status change
  if (status === "Done" && task) {
    await logActivity({
      workspaceId: task.workspace_id,
      action: "completed task",
      target: task.title,
    });
  }
}

export async function createTask(input: {
  workspaceId: string;
  title: string;
  status?: TaskStatus;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  assigneeId?: string;
  meetingId?: string;
  meetingTitle?: string;
  sourceType?: "AI" | "User";
  transcriptTimestamp?: string;
}): Promise<void> {
  const { data: task, error } = await supabase.from("tasks").insert({
    workspace_id: input.workspaceId,
    title: input.title,
    status: input.status ?? "To Do",
    priority: input.priority ?? "medium",
    due_date: input.dueDate ?? null,
    assignee_id: input.assigneeId ?? null,
    meeting_id: input.meetingId ?? null,
    meeting_title: input.meetingTitle ?? null,
    source_type: input.sourceType ?? "User",
    transcript_timestamp: input.transcriptTimestamp ?? null,
    approved: input.sourceType === "AI" ? false : true,
  }).select().single();

  if (error) throw new Error(error.message);

  // Log manual task creation
  if (input.sourceType !== "AI") {
    await logActivity({
      workspaceId: input.workspaceId,
      action: "created task",
      target: input.title,
    });
  }
}

export async function updateTask(
  taskId: string,
  input: {
    title?: string;
    status?: TaskStatus;
    priority?: "low" | "medium" | "high";
    dueDate?: string;
    assigneeId?: string;
    meetingTitle?: string;
    sourceType?: "AI" | "User";
    transcriptTimestamp?: string;
  }
): Promise<void> {
  const updateData: Record<string, any> = {};

  if (input.title) updateData.title = input.title;
  if (input.status) updateData.status = input.status;
  if (input.priority) updateData.priority = input.priority;
  if (input.dueDate) updateData.due_date = input.dueDate;
  if (input.assigneeId !== undefined) updateData.assignee_id = input.assigneeId || null;
  if (input.meetingTitle !== undefined) updateData.meeting_title = input.meetingTitle || null;
  if (input.sourceType !== undefined) updateData.source_type = input.sourceType;
  if (input.transcriptTimestamp !== undefined) updateData.transcript_timestamp = input.transcriptTimestamp || null;

  const { error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", taskId);

  if (error) throw new Error(error.message);
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw new Error(error.message);
}

export function subscribeToTasks(
  workspaceId: string,
  onEvent: (payload: { eventType: string; new: Task; old: Task }) => void
) {
  return supabase
    .channel(`tasks-workspace-${workspaceId}`)
    .on(
      "postgres_changes" as any,
      {
        event: "*",
        schema: "public",
        table: "tasks",
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload: any) => {
        onEvent({
          eventType: payload.eventType,
          new: normalizeTask(payload.new),
          old: normalizeTask(payload.old),
        });
      }
    )
    .subscribe();
}

export async function approveTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .update({ approved: true })
    .eq("id", taskId);

  if (error) throw new Error(error.message);
}

export async function fetchPendingTasks(workspaceId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*, assignee:users!assignee_id(*)")
    .eq("workspace_id", workspaceId)
    .eq("approved", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching pending tasks:", error.message);
    throw error;
  }

  return (data ?? []).map((r) => normalizeTask(r));
}

export function hasTaskBackendConfigured() {
  return true;
}
