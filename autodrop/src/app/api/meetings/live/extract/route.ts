import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { extractTasks } from "@/lib/extractTasks";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { meetingId, workspaceId, fullTranscript } = body;

    if (!meetingId || !workspaceId) {
      return NextResponse.json({ error: "meetingId and workspaceId are required" }, { status: 400 });
    }

    if (!fullTranscript || fullTranscript.trim() === "") {
        return NextResponse.json({ message: "No transcript recorded." });
    }

    // 1. Fetch meeting
    const { data: meeting, error: meetingError } = await supabaseAdmin
      .from("meetings")
      .select("*")
      .eq("id", meetingId)
      .single();

    if (meetingError || !meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // 2. Save full transcript linearly
    await supabaseAdmin.from("transcripts").insert({
      meeting_id: meetingId,
      speaker: "System",
      text: fullTranscript,
      words: []
    });

    // 3. Run AI extraction
    const tasks = await extractTasks(meetingId, fullTranscript, workspaceId);

    // 4. Optionally Cleanup Storage Webm chunks if any linger
    const { data: chunks } = await supabaseAdmin.storage
      .from("meetings")
      .list(`chunks/${meetingId}`);
    if (chunks && chunks.length > 0) {
      const chunkPaths = chunks.map(c => `chunks/${meetingId}/${c.name}`);
      await supabaseAdmin.storage.from("meetings").remove(chunkPaths);
    }

    return NextResponse.json({
      meeting_id: meetingId,
      task_count: tasks.length,
      redirect_url: `/meetings/${meetingId}`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

