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
    const { meetingId, workspaceId, fullTranscript } = body;

    let finalMeetingId = meetingId;

    if (!meetingId || !workspaceId) {
      if (meetingId) await supabaseAdmin.from("meetings").update({ status: "failed" }).eq("id", meetingId);
      return NextResponse.json({ error: "meetingId and workspaceId are required" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      await supabaseAdmin.from("meetings").update({ status: "failed" }).eq("id", meetingId);
      return NextResponse.json({ error: "OpenAI API key missing" }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    let transcriptText = fullTranscript || "";

    if (!transcriptText) {
      // 1. List all chunks for this meeting
      const { data: chunks, error: listError } = await supabaseAdmin.storage
        .from("meetings")
        .list(`chunks/${meetingId}`, {
            sortBy: { column: 'name', order: 'asc' }
        });

      if (listError) {
        await supabaseAdmin.from("meetings").update({ status: "failed" }).eq("id", meetingId);
        return NextResponse.json({ error: listError.message }, { status: 500 });
      }
      
      if (!chunks || chunks.length === 0) {
          await supabaseAdmin.from("meetings").update({ status: "failed" }).eq("id", meetingId);
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
    const transcriptPayload: Record<string, any> = {
      meeting_id: meetingId,
      speaker: "System",
      text: transcriptText,
    };

    const extractedWords = (transcription as any).words || [];
    if (extractedWords.length > 0) {
      transcriptPayload.words = extractedWords;
    }

      const { error: transcriptError } = await supabaseAdmin.from("transcripts").insert(transcriptPayload);
      if (transcriptError) {
        if (transcriptError.message.includes("words")) {
          console.warn("Transcript table does not support the words column; saving transcript without words.");
          await supabaseAdmin.from("transcripts").insert({
            meeting_id: meetingId,
            speaker: "System",
            text: transcriptText,
          });
        } else {
          await supabaseAdmin.from("meetings").update({ status: "failed" }).eq("id", meetingId);
          return NextResponse.json({ error: transcriptError.message }, { status: 500 });
        }
      }

      // 6. Cleanup Storage chunks
      const chunkPaths = chunks.map(c => `chunks/${meetingId}/${c.name}`);
      await supabaseAdmin.storage.from("meetings").remove(chunkPaths);
      
      // Cleanup local file
      await fs.promises.unlink(filePath).catch(() => undefined);
    } else {
      // Use provided fullTranscript, skip processing chunks and Whisper
      await supabaseAdmin.from("meetings").update({ status: "transcribing" }).eq("id", meetingId);
      
      const transcriptPayload: Record<string, any> = {
        meeting_id: meetingId,
        speaker: "System",
        text: transcriptText,
      };

      const { error: transcriptError } = await supabaseAdmin.from("transcripts").insert(transcriptPayload);
      if (transcriptError) {
          await supabaseAdmin.from("meetings").update({ status: "failed" }).eq("id", meetingId);
          return NextResponse.json({ error: transcriptError.message }, { status: 500 });
      }
    }

    // 5. Run AI extraction
    const taskCount = await extractTasks(meetingId, transcriptText, workspaceId);

    return NextResponse.json({
      meeting_id: meetingId,
      task_count: taskCount,
      redirect_url: `/meetings/${meetingId}`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Live extract error:", error);
    
    // Extract meetingId from request body if available, since body parsing might throw
    // but try our best to set status to failed.
    try {
       const clonedReq = req.clone();
       const body = await clonedReq.json().catch(() => ({}));
       if (body.meetingId) {
          await supabaseAdmin.from("meetings").update({ status: "failed" }).eq("id", body.meetingId);
       }
    } catch (_) {}

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

