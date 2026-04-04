import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { extractTasks } from "@/lib/extractTasks";

const MAX_WHISPER_SIZE = 25 * 1024 * 1024; // 25MB

export const maxDuration = 60;

export async function POST(req: Request) {
  let fallbackMeetingId: string | null = null;
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const formData = await req.formData();
    const file = formData.get("audio") as File | null;
    const meetingId = formData.get("meetingId") as string | null;
    fallbackMeetingId = meetingId;

    if (!file || !meetingId) {
      return NextResponse.json({ error: "File and meetingId are required" }, { status: 400 });
    }

    // 1. Upload to Supabase Storage - bucket "meetings" at path recordings/{userId}/{meeting_id}.{ext}
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Check file size against OpenAI Whisper limits (25MB)
    if (buffer.length > MAX_WHISPER_SIZE) {
      await supabaseAdmin.from("meetings").update({ status: "failed" }).eq("id", meetingId);
      return NextResponse.json({ 
        error: `File is too large (${(buffer.length / (1024 * 1024)).toFixed(1)}MB). OpenAI Whisper has a 25MB limit. Please upload a shorter recording.` 
      }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop();
    const storagePath = `recordings/${userId}/${meetingId}.${fileExt}`;
    
    const { error: uploadError } = await supabaseAdmin.storage
      .from("meetings")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError.message);
      await supabaseAdmin.from("meetings").update({ status: "failed" }).eq("id", meetingId);
      return NextResponse.json({ error: "Failed to upload file to storage" }, { status: 500 });
    }

    // 2. Set status to transcribing before calling Whisper
    await supabaseAdmin.from("meetings").update({ 
        status: "transcribing",
        file_path: storagePath 
    }).eq("id", meetingId);

    // 3. Transcription with Whisper
    const tmpDir = process.platform === "win32" ? path.join(process.cwd(), "tmp") : "/tmp";
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    
    const filePath = path.join(tmpDir, `${Date.now()}-${file.name}`);
    await fs.promises.writeFile(filePath, buffer);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
      response_format: "verbose_json"
    });

    const transcriptText = transcription.text || "";
    const words = (transcription as any).words || [];

    // 4. Save transcript
    const { error: tsError } = await supabaseAdmin.from("transcripts").insert({
      meeting_id: meetingId,
      speaker: "System",
      text: transcriptText,
      words: words
    });

    if (tsError) console.error("Error saving transcript:", tsError.message);

    // 5. Update status to transcribed (intermediate)
    const { data: meeting } = await supabaseAdmin
      .from("meetings")
      .update({ status: "transcribed" })
      .eq("id", meetingId)
      .select("workspace_id")
      .single();

    // 6. Trigger extraction (this updates status to extracting then completed)
    if (meeting?.workspace_id) {
        await extractTasks(meetingId, transcriptText, meeting.workspace_id);
    }
    
    // Cleanup
    await fs.promises.unlink(filePath).catch(() => undefined);

    return NextResponse.json({ 
      meeting_id: meetingId, 
      success: true 
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Transcribe route error:", message);
    
    // Attempt to mark meeting as failed if we have the ID
    if (fallbackMeetingId) {
      await supabaseAdmin.from("meetings").update({ status: "failed" }).eq("id", fallbackMeetingId);
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

