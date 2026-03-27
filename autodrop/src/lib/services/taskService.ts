"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Task, TaskStatus } from "@/lib/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

const statusMap: Record<string, TaskStatus> = {
  todo: "To Do",
  "in-progress": "In Progress",
  done: "Done",
  backlog: "Backlog",
};

const reverseStatusMap: Record<TaskStatus, string> = {
  Backlog: "backlog",
  "To Do": "todo",
  "In Progress": "in-progress",
  Done: "done",
};

/* ------------------------------------------------------------------ */
/*  localStorage fallback – used when Supabase tables are unreachable  */
/* ------------------------------------------------------------------ */

const LOCAL_STORAGE_KEY = "autodrop_tasks";

function getLocalTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Task[]) : [];
  } catch {
    return [];
  }
}

function saveLocalTasks(tasks: Task[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
}

let useLocalFallback = false;

/* ------------------------------------------------------------------ */
/*  Supabase helpers                                                   */
/* ------------------------------------------------------------------ */

function normalizeTask(row: Record<string, unknown>): Task {
  const assignee = row.assignee as Record<string, unknown> | null;
  return {
    id: String(row.id),
    title: String(row.title ?? "Untitled Task"),
    status: statusMap[String(row.status ?? "todo")] ?? "To Do",
    priority: (row.priority as "low" | "medium" | "high") ?? "medium",
    dueDate: row.due_date ? String(row.due_date) : undefined,
    assigneeId: row.assignee_id ? String(row.assignee_id) : undefined,
    assignee: assignee?.name ? String(assignee.name) : undefined,
    requestedBy: row.requested_by ? String(row.requested_by) : undefined,
    meetingId: row.meeting_id ? String(row.meeting_id) : undefined,
  };
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export async function fetchTasks(): Promise<Task[]> {
  if (useLocalFallback || !supabase) {
    useLocalFallback = true;
    return getLocalTasks();
  }

  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*, assignee:team_members!assignee_id(*)")
      .order("created_at", { ascending: false });

    if (error) {
      const msg = error.message || "";
      // If team_members table is missing, retry without the join
      if (
        msg.includes("Could not find the table 'public.team_members'") ||
        msg.includes('table "team_members" does not exist')
      ) {
        console.warn("`team_members` table missing – retrying without join.");
        const { data: fb, error: fbErr } = await supabase
          .from("tasks")
          .select("*")
          .order("created_at", { ascending: false });

        if (fbErr) throw fbErr;
        return (fb ?? []).map((r) => normalizeTask(r as Record<string, unknown>));
      }
      throw error;
    }

    return (data ?? []).map((r) => normalizeTask(r as Record<string, unknown>));
  } catch (err) {
    console.warn("Supabase unreachable – falling back to localStorage.", err);
    useLocalFallback = true;
    return getLocalTasks();
  }
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus
): Promise<void> {
  if (useLocalFallback || !supabase) {
    const tasks = getLocalTasks().map((t) =>
      t.id === taskId ? { ...t, status } : t
    );
    saveLocalTasks(tasks);
    return;
  }

  const { error } = await supabase
    .from("tasks")
    .update({ status: reverseStatusMap[status], updated_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) throw new Error(error.message);
}

export async function createTask(input: {
  title: string;
  status?: TaskStatus;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  assigneeId?: string;
  requestedBy?: string;
  meetingId?: string;
}): Promise<void> {
  if (useLocalFallback || !supabase) {
    const tasks = getLocalTasks();
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: input.title,
      status: input.status ?? "To Do",
      priority: input.priority ?? "medium",
      dueDate: input.dueDate,
      assigneeId: input.assigneeId,
      requestedBy: input.requestedBy,
      meetingId: input.meetingId,
    };
    saveLocalTasks([newTask, ...tasks]);
    return;
  }

  const { error } = await supabase.from("tasks").insert({
    title: input.title,
    status: reverseStatusMap[input.status ?? "To Do"],
    priority: input.priority ?? "medium",
    due_date: input.dueDate ?? null,
    assignee_id: input.assigneeId ?? null,
    requested_by: input.requestedBy ?? null,
    meeting_id: input.meetingId ?? null,
  });

  if (error) throw new Error(error.message);
}

export async function updateTask(
  taskId: string,
  input: {
    title?: string;
    status?: TaskStatus;
    priority?: "low" | "medium" | "high";
    dueDate?: string;
    assigneeId?: string;
  }
): Promise<void> {
  if (useLocalFallback || !supabase) {
    const tasks = getLocalTasks().map((t) => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        ...(input.title !== undefined && { title: input.title }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
        ...(input.assigneeId !== undefined && { assigneeId: input.assigneeId }),
      };
    });
    saveLocalTasks(tasks);
    return;
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.title) updateData.title = input.title;
  if (input.status) updateData.status = reverseStatusMap[input.status];
  if (input.priority) updateData.priority = input.priority;
  if (input.dueDate) updateData.due_date = input.dueDate;
  if (input.assigneeId !== undefined)
    updateData.assignee_id = input.assigneeId || null;

  const { error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", taskId);

  if (error) throw new Error(error.message);
}

export async function deleteTask(taskId: string): Promise<void> {
  if (useLocalFallback || !supabase) {
    const tasks = getLocalTasks().filter((t) => t.id !== taskId);
    saveLocalTasks(tasks);
    return;
  }

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) throw new Error(error.message);
}

export function hasTaskBackendConfigured() {
  // Always return true so the board renders – localStorage provides fallback
  return true;
}
