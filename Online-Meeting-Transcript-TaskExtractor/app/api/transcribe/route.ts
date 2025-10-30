import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { segmentTranscriptBySpeaker } from "@/lib/extractTasks";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    // Get the uploaded audio file
    const formData = await req.formData();
    const file = formData.get("audio") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // ✅ Cross-platform temp path
    const tmpDir =
      process.platform === "win32"
        ? path.join(process.cwd(), "tmp")
        : "/tmp";

    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const filePath = path.join(tmpDir, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(filePath, buffer);

    console.log("Uploaded file saved at:", filePath);

    // ✅ Transcribe using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
      language: "en",
    });

    const transcript = transcription.text || "";
    console.log("Transcript received ✅");

    // ✅ Get segmentation + tasks
    const result = await segmentTranscriptBySpeaker(transcript);

    // ✅ Clean up temporary file
    await fs.promises.unlink(filePath).catch(() => {});

    return NextResponse.json({
      transcript,
      result,
    });
  } catch (err: any) {
    console.error("❌ Error in /api/transcribe:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
