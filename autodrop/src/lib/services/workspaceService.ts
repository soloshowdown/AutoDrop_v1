"use client";

import { supabase } from "@/lib/supabase";

export interface Workspace {
  // force recompile
  id: string;
  name: string;
  created_by: string;
  created_at?: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: "admin" | "member";
}

export async function fetchUserWorkspaces(userId: string): Promise<Workspace[]> {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspaces (*)")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching workspaces:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => row.workspaces);
}

export async function createWorkspace(name: string, userId: string): Promise<Workspace | null> {
  // 1. Create workspace
  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .insert({ name, created_by: userId })
    .select()
    .single();

  if (wsError) throw new Error(wsError.message);

  // 2. Add creator as admin member
  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert({
      workspace_id: workspace.id,
      user_id: userId,
      role: "admin",
    });

  if (memberError) throw new Error(memberError.message);

  return workspace;
}

export async function fetchWorkspaceMembers(workspaceId: string) {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("*, users (*)")
    .eq("workspace_id", workspaceId);

  if (error) {
    console.error("Error fetching workspace members:", error.message);
    return [];
  }

  return data ?? [];
}
