"use client";

import { supabase } from "@/lib/supabase";

export interface Workspace {
  id: string;
  name: string;
  created_by: string;
  role?: "admin" | "member";
  created_at?: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: "admin" | "member";
}

export interface Invite {
  id: string;
  workspace_id: string;
  email: string;
  role: "admin" | "member";
  status: "pending" | "accepted" | "rejected";
  invited_by: string;
  created_at: string;
}

export async function fetchUserWorkspaces(userId: string): Promise<Workspace[]> {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role, workspaces (*)")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching workspaces:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    ...row.workspaces,
    role: row.role as "admin" | "member"
  }));
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

export async function sendInvite(workspaceId: string, email: string, role: "admin" | "member", invitedBy: string) {
  const { data, error } = await supabase
    .from("invites")
    .insert({
      workspace_id: workspaceId,
      email,
      role,
      invited_by: invitedBy,
      status: "pending"
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw new Error("An invitation is already pending for this email in this workspace");
    throw new Error(error.message);
  }
  return data;
}

export async function fetchPendingInvites(email: string) {
  const { data, error } = await supabase
    .from("invites")
    .select("*, workspaces(name)")
    .eq("email", email)
    .eq("status", "pending");

  if (error) {
    console.error("Error fetching pending invites:", error.message);
    return [];
  }
  return data ?? [];
}

export async function respondToInvite(inviteId: string, status: "accepted" | "rejected", userId?: string) {
  if (status === "accepted" && !userId) {
    throw new Error("User ID is required to accept an invitation");
  }

  // 1. Get invite details
  const { data: invite, error: fetchError } = await supabase
    .from("invites")
    .select("*")
    .eq("id", inviteId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  if (status === "accepted") {
    // 2. Add to workspace members
    const { error: joinError } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: invite.workspace_id,
        user_id: userId,
        role: invite.role,
      });

    if (joinError) throw new Error(joinError.message);
  }

  // 3. Update invite status
  const { error: updateError } = await supabase
    .from("invites")
    .update({ status })
    .eq("id", inviteId);

  if (updateError) throw new Error(updateError.message);
}

export async function removeWorkspaceMember(workspaceId: string, userId: string) {
  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}
