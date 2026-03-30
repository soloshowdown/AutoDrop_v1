import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import OpenAI from "openai";
import { extractTasks } from "@/lib/extractTasks";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { meetingId } = body;

    if (!meetingId) {
      return NextResponse.json({ error: "meetingId is required" }, { status: 400 });
    }

    // 1. Fetch meeting and workspace info
    const { data: meeting, error: meetingError } = await supabaseAdmin
      .from("meetings")
      .select("*")
      .eq("id", meetingId)
      .single();

    if (meetingError || !meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // 2. Download all chunks from storage
    const { data: chunks, error: listError } = await supabaseAdmin.storage
      .from("meetings")
      .list(`chunks/${meetingId}`, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (listError || !chunks || chunks.length === 0) {
      return NextResponse.json({ error: "No recorded chunks found" }, { status: 404 });
    }

    // Concatenate chunks
    const chunkBuffers: Buffer[] = [];
    for (const chunk of chunks) {
      const { data: blob, error: downloadError } = await supabaseAdmin.storage
        .from("meetings")
        .download(`chunks/${meetingId}/${chunk.name}`);
      
      if (!downloadError && blob) {
        chunkBuffers.push(Buffer.from(await blob.arrayBuffer()));
      }
    }

    const finalBuffer = Buffer.concat(chunkBuffers);

    // 3. Transcribe with Whisper
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not set");
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const tmpDir = process.platform === "win32" ? path.join(process.cwd(), "tmp") : "/tmp";
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const filePath = path.join(tmpDir, `${Date.now()}-live-recording.webm`);
    await fs.promises.writeFile(filePath, finalBuffer);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
      response_format: "verbose_json"
    });

    const transcriptText = transcription.text || "";
    const words = (transcription as any).words || [];

    // 4. Save full transcript
    await supabaseAdmin.from("transcripts").insert({
      meeting_id: meetingId,
      speaker: "System",
      text: transcriptText,
      time: "00:00",
      words: words,
      is_actionable: false
    });

    // 5. Run extraction
    const tasks = await extractTasks(meetingId, transcriptText, meeting.workspace_id);

    // 6. Cleanup Storage
    const chunkPaths = chunks.map(c => `chunks/${meetingId}/${c.name}`);
    await supabaseAdmin.storage.from("meetings").remove(chunkPaths);
    
    // Cleanup Local
    await fs.promises.unlink(filePath).catch(() => undefined);

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

