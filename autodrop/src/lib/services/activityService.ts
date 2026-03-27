import { supabase } from "@/lib/supabase";

export async function logActivity(input: {
  workspaceId: string;
  userId?: string;
  action: string;
  target: string;
}) {
  const { error } = await supabase.from("activity_log").insert({
    workspace_id: input.workspaceId,
    user_id: input.userId || null,
    action: input.action,
    target: input.target,
  });

  if (error) {
    console.error("Failed to log activity:", error.message);
  }
}

export async function fetchActivities(workspaceId: string) {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*, users (*)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Failed to fetch activities:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    user: {
      name: row.users?.name || "AI Engine",
      avatar: row.users?.avatar_url || "",
      initials: (row.users?.name || "AI").substring(0, 2).toUpperCase(),
    },
    action: row.action,
    target: row.target,
    time: row.created_at,
  }));
}
