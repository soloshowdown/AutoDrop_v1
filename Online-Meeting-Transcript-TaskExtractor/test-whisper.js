import fs from "fs";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";

// ✅ Explicitly load env from project root
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

console.log("Loaded key prefix:", process.env.OPENAI_API_KEY?.slice(0, 10)); // should print "sk-..."

if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY not found. Check your .env.local file.");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const main = async () => {
  console.log("🎧 Sending to Whisper...");
  const response = await openai.audio.transcriptions.create({
    file: fs.createReadStream("./meeting-clip1.mp3"),
    model: "whisper-1",
  });

  console.log("✅ Transcription result:");
  console.log(response.text);
};

main();
