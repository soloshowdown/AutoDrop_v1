import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizeTaskTitle, resolveAssigneeIdFromName } from "@/lib/taskUtils";
import { extractTasksFromChunk } from "@/lib/extractTasks";

const tmpDir = process.platform === "win32" ? path.join(process.cwd(), "tmp") : "/tmp";

async function transcribeAudio(file: File): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const filePath = path.join(tmpDir, `${Date.now()}-${file.name}`);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.promises.writeFile(filePath, buffer);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: "whisper-1",
    language: "en",
  });

  await fs.promises.unlink(filePath).catch(() => undefined);
  return String(transcription.text || "");
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
    }

    const contentType = req.headers.get("content-type") || "";
    let meetingId = "";
    let workspaceId = "";
    let speaker = "Speaker";
    let time = new Date().toISOString();
    let chunkText = "";
    let audioFile: File | null = null;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      meetingId = String(body.meetingId || "").trim();
      workspaceId = String(body.workspaceId || "").trim();
      speaker = String(body.speaker || "Speaker").trim();
      time = String(body.time || time);
      chunkText = String(body.chunkText || "").trim();
    } else {
      const formData = await req.formData();
      meetingId = String(formData.get("meetingId") || "").trim();
      workspaceId = String(formData.get("workspaceId") || "").trim();
      speaker = String(formData.get("speaker") || "Speaker").trim();
      time = String(formData.get("time") || time);
      chunkText = String(formData.get("chunkText") || "").trim();
      audioFile = formData.get("audio") as File | null;
    }

    if (!meetingId || !workspaceId) {
      return NextResponse.json({ error: "meetingId and workspaceId are required" }, { status: 400 });
    }

    if (!chunkText && !audioFile) {
      return NextResponse.json({ error: "chunkText or audio file is required" }, { status: 400 });
    }

    if (!chunkText && audioFile) {
      chunkText = await transcribeAudio(audioFile);
    }

    if (!chunkText.trim()) {
      return NextResponse.json({ error: "No transcribable text available" }, { status: 400 });
    }

    const { data: meeting, error: meetingError } = await supabaseAdmin
      .from("meetings")
      .select("*")
      .eq("id", meetingId)
      .single();

    if (meetingError || !meeting) {
      return NextResponse.json({ error: meetingError?.message || "Meeting not found" }, { status: 404 });
    }

    const { data: transcriptData, error: transcriptError } = await supabaseAdmin.from("transcripts").insert({
      meeting_id: meetingId,
      speaker,
      text: chunkText,
      time,
      is_actionable: false,
    }).select().single();

    if (transcriptError) {
      return NextResponse.json({ error: transcriptError.message }, { status: 500 });
    }

    const extraction = await extractTasksFromChunk(chunkText, speaker);
    const extractedTasks = extraction.tasks ?? [];

    const { data: existingTasks = [], error: taskFetchError } = await supabaseAdmin
      .from("tasks")
      .select("title")
      .eq("meeting_id", meetingId);

    if (taskFetchError) {
      return NextResponse.json({ error: taskFetchError.message }, { status: 500 });
    }

    const existingTitles = (existingTasks ?? []).map((row: any) => normalizeTaskTitle(String(row.title || "")));
    const workspaceMembersResult = await supabaseAdmin
      .from("workspace_members")
      .select("*, users (*)")
      .eq("workspace_id", meeting.workspace_id);
    const workspaceMembers = workspaceMembersResult.data ?? [];

    const insertedTasks: Array<Record<string, any>> = [];

    for (const item of extractedTasks) {
      const title = String(item.title || "").trim();
      if (!title) continue;
      const normalizedTitle = normalizeTaskTitle(title);
      if (existingTitles.includes(normalizedTitle)) continue;
      existingTitles.push(normalizedTitle);

      const assigneeName = item.assignee?.trim() || speaker;
      const assigneeId = resolveAssigneeIdFromName(assigneeName, workspaceMembers);

      const { data: insertedTask, error: insertTaskError } = await supabaseAdmin
        .from("tasks")
        .insert({
          workspace_id: meeting.workspace_id,
          meeting_id: meetingId,
          meeting_title: meeting.title,
          title,
          assignee_id: assigneeId || null,
          due_date: item.deadline || null,
          priority: item.priority || "medium",
          status: "Backlog",
          source_type: "AI",
          transcript_timestamp: time,
          approved: false,
        })
        .select()
        .single();

      if (insertTaskError) {
        console.error("Failed to insert AI task:", insertTaskError.message);
        continue;
      }

      insertedTasks.push(insertedTask);
    }

    if (insertedTasks.length > 0) {
      await supabaseAdmin.from("transcripts").update({ is_actionable: true }).eq("id", transcriptData.id);
    }

    return NextResponse.json({
      transcript: {
        id: transcriptData.id,
        meetingId,
        speaker,
        text: chunkText,
        time,
        isActionable: insertedTasks.length > 0,
      },
      tasks: insertedTasks,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
