import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { extractTasks } from "@/lib/extractTasks";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { meetingId, workspaceId } = body;

    if (!meetingId || !workspaceId) {
      return NextResponse.json({ error: "meetingId and workspaceId are required" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key missing" }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 1. List all chunks for this meeting
    const { data: chunks, error: listError } = await supabaseAdmin.storage
      .from("meetings")
      .list(`chunks/${meetingId}`, {
          sortBy: { column: 'name', order: 'asc' }
      });

    if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });
    
    if (!chunks || chunks.length === 0) {
        return NextResponse.json({ error: "No audio chunks found for this meeting" }, { status: 404 });
    }

    // 2. Download and concatenate chunks
    const chunkBuffers: Buffer[] = [];
    for (const chunk of chunks) {
        const { data, error: downloadError } = await supabaseAdmin.storage
            .from("meetings")
            .download(`chunks/${meetingId}/${chunk.name}`);
        
        if (downloadError) {
            console.error(`Error downloading chunk ${chunk.name}:`, downloadError.message);
            continue;
        }
        
        const arrayBuffer = await data.arrayBuffer();
        chunkBuffers.push(Buffer.from(arrayBuffer));
    }

    const fullBuffer = Buffer.concat(chunkBuffers);

    // 3. Transcribe with Whisper
    const tmpDir = process.platform === "win32" ? path.join(process.cwd(), "tmp") : "/tmp";
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    
    const filePath = path.join(tmpDir, `live-${meetingId}.webm`);
    await fs.promises.writeFile(filePath, fullBuffer);

    await supabaseAdmin.from("meetings").update({ status: "transcribing" }).eq("id", meetingId);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
      response_format: "verbose_json"
    });

    const transcriptText = transcription.text || "";

    // 4. Save transcript
    await supabaseAdmin.from("transcripts").insert({
      meeting_id: meetingId,
      speaker: "System",
      text: transcriptText,
      words: (transcription as any).words || []
    });

    // 5. Run AI extraction
    const taskCount = await extractTasks(meetingId, transcriptText, workspaceId);

    // 6. Cleanup Storage chunks
    const chunkPaths = chunks.map(c => `chunks/${meetingId}/${c.name}`);
    await supabaseAdmin.storage.from("meetings").remove(chunkPaths);
    
    // Cleanup local file
    await fs.promises.unlink(filePath).catch(() => undefined);

    return NextResponse.json({
      meeting_id: meetingId,
      task_count: taskCount,
      redirect_url: `/meetings/${meetingId}`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Live extract error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

