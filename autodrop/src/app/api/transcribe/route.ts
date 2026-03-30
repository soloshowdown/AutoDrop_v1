import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { extractTasks } from "@/lib/extractTasks";

const MAX_WHISPER_SIZE = 25 * 1024 * 1024; // 25MB

export async function POST(req: Request) {
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

    if (!file || !meetingId) {
      return NextResponse.json({ error: "File and meetingId are required" }, { status: 400 });
    }

    // 1. Upload to Supabase Storage - bucket "meetings"
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // 1. Check file size against OpenAI Whisper limits (25MB)
    if (buffer.length > MAX_WHISPER_SIZE) {
      await supabaseAdmin.from("meetings").update({ status: "failed" }).eq("id", meetingId);
      return NextResponse.json({ 
        error: `File is too large (${(buffer.length / (1024 * 1024)).toFixed(1)}MB). OpenAI Whisper has a 25MB limit. Please upload a shorter recording.` 
      }, { status: 400 });
    }

    const storagePath = `recordings/${meetingId}/${file.name}`;
    
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

    // Update status to "uploaded"
    await supabaseAdmin.from("meetings").update({ status: "uploaded" }).eq("id", meetingId);

    // 2. Transcription with Whisper
    // If > 25MB, we should split it. For now, let's assume we need to handle it.
    // Simplifying: we'll use tmp file for OpenAI.
    const tmpDir = process.platform === "win32" ? path.join(process.cwd(), "tmp") : "/tmp";
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    
    const filePath = path.join(tmpDir, `${Date.now()}-${file.name}`);
    await fs.promises.writeFile(filePath, buffer);

    await supabaseAdmin.from("meetings").update({ status: "transcribing" }).eq("id", meetingId);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
      response_format: "verbose_json"
    });

    const transcriptText = transcription.text || "";
    // Note: verbose_json provides words array with timestamps
    const words = (transcription as any).words || [];

    // 3. Save transcript text + words JSON to transcripts table
    const { error: tsError } = await supabaseAdmin.from("transcripts").insert({
      meeting_id: meetingId,
      speaker: "System", // Or try to detect
      text: transcriptText,
      time: "00:00",
      words: words,
      is_actionable: false
    });

    if (tsError) console.error("Error saving transcript:", tsError.message);

    // 4. Update status to "transcribed"
    const { data: meeting } = await supabaseAdmin
      .from("meetings")
      .update({ status: "transcribed" })
      .eq("id", meetingId)
      .select("workspace_id")
      .single();

    // 5. Trigger extraction step
    if (meeting?.workspace_id) {
        await extractTasks(meetingId, transcriptText, meeting.workspace_id);
    }
    
    // Cleanup
    await fs.promises.unlink(filePath).catch(() => undefined);

    return NextResponse.json({ 
      meeting_id: meetingId, 
      transcript_preview: transcriptText.substring(0, 200) 
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Transcribe route error:", message);
    
    // Attempt to mark meeting as failed if we have the ID
    const formData = await req.formData().catch(() => null);
    const meetingId = formData?.get("meetingId") as string | null;
    if (meetingId) {
      await supabaseAdmin.from("meetings").update({ status: "failed" }).eq("id", meetingId);
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

