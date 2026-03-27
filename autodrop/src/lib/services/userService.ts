"use client";

import { supabase } from "@/lib/supabase";

export interface User {
  id: string; // Clerk userId
  email: string;
  name?: string;
  avatar_url?: string;
  created_at?: string;
}

export async function fetchUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user:", error.message);
    return null;
  }

  return data;
}

export async function fetchAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching users:", error.message);
    return [];
  }

  return data ?? [];
}

export async function updateUserProfile(userId: string, input: Partial<User>): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update(input)
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }
}
