"use client";

import { createClient } from "@supabase/supabase-js";

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role?: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

function isTeamMembersMissing(error: { message?: string } | null): boolean {
  const message = error?.message ?? "";
  return message.includes("Could not find the table 'public.team_members'") ||
    message.includes("table \"team_members\" does not exist");
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    if (isTeamMembersMissing(error)) {
      console.warn("`team_members` table missing in Supabase. Returning empty team member list.")
      return [];
    }
    console.error("Error fetching team members:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? "Unknown"),
    email: row.email ? String(row.email) : undefined,
    avatar: row.avatar ? String(row.avatar) : undefined,
    role: row.role ? String(row.role) : undefined,
  }));
}

export async function createTeamMember(input: {
  name: string;
  email?: string;
  avatar?: string;
  role?: string;
}): Promise<TeamMember | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("team_members")
    .insert({
      name: input.name,
      email: input.email ?? null,
      avatar: input.avatar ?? null,
      role: input.role ?? null,
    })
    .select()
    .single();

  if (error) {
    if (isTeamMembersMissing(error)) {
      throw new Error("Supabase table 'team_members' is missing. Create it with the migration below and retry.")
    }
    throw new Error(error.message);
  }

  return data
    ? {
        id: String(data.id),
        name: String(data.name),
        email: data.email ? String(data.email) : undefined,
        avatar: data.avatar ? String(data.avatar) : undefined,
        role: data.role ? String(data.role) : undefined,
      }
    : null;
}

export async function updateTeamMember(
  memberId: string,
  input: Partial<TeamMember>
): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from("team_members")
    .update({
      name: input.name,
      email: input.email,
      avatar: input.avatar,
      role: input.role,
    })
    .eq("id", memberId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteTeamMember(memberId: string): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", memberId);

  if (error) {
    throw new Error(error.message);
  }
}
