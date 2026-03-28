import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizeTaskTitle, resolveAssigneeIdFromName } from "@/lib/taskUtils";
import { extractTasksFromChunk } from "@/lib/extractTasks";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { meetingId, workspaceId, speaker, text, time } = body;

    if (!meetingId || !workspaceId || !text) {
      return NextResponse.json({ error: "meetingId, workspaceId, and text are required" }, { status: 400 });
    }

    // 1. Save transcript segment
    const { data: transcriptData, error: transcriptError } = await supabaseAdmin.from("transcripts").insert({
      meeting_id: meetingId,
      speaker: speaker || "Speaker",
      text: text,
      time: time || new Date().toISOString(),
      is_actionable: false,
    }).select().single();

    if (transcriptError) {
      return NextResponse.json({ error: transcriptError.message }, { status: 500 });
    }

    // 2. Extract tasks from the text chunk
    const extraction = await extractTasksFromChunk(text, speaker || "Speaker");
    const extractedTasks = extraction.tasks ?? [];

    // 3. Get existing tasks for deduplication
    const { data: existingTasks = [] } = await supabaseAdmin
      .from("tasks")
      .select("title")
      .eq("meeting_id", meetingId);

    const existingTitles = (existingTasks ?? []).map((row: any) => normalizeTaskTitle(String(row.title || "")));
    
    // 4. Get workspace members for assignee mapping
    const { data: workspaceMembers } = await supabaseAdmin
      .from("workspace_members")
      .select("*, users (*)")
      .eq("workspace_id", workspaceId);

    const membersArray = (workspaceMembers || []) as any[];
    const insertedTasks: any[] = [];

    for (const item of extractedTasks) {
      const title = String(item.title || "").trim();
      if (!title) continue;
      
      const normalizedTitle = normalizeTaskTitle(title);
      if (existingTitles.includes(normalizedTitle)) continue;
      existingTitles.push(normalizedTitle);

      const assigneeName = item.assignee?.trim() || speaker;
      const assigneeId = resolveAssigneeIdFromName(assigneeName, membersArray);

      const { data: insertedTask, error: insertTaskError } = await supabaseAdmin
        .from("tasks")
        .insert({
          workspace_id: workspaceId,
          meeting_id: meetingId,
          title,
          assignee_id: assigneeId || null,
          due_date: item.deadline || null,
          priority: item.priority || "medium",
          status: "Backlog",
          source_type: "AI",
          transcript_timestamp: time || new Date().toISOString(),
          approved: false,
        })
        .select()
        .single();

      if (!insertTaskError && insertedTask) {
        insertedTasks.push(insertedTask);
      }
    }

    // 5. Update transcript if actionable
    if (insertedTasks.length > 0) {
      await supabaseAdmin.from("transcripts").update({ is_actionable: true }).eq("id", transcriptData.id);
    }

    return NextResponse.json({
      transcript: transcriptData,
      tasks: insertedTasks,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
