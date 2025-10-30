import { pipeline } from "@xenova/transformers";

// Singleton pattern to avoid reloading the model on every request
let transcriber: any = null;

export async function getTranscriber() {
  if (!transcriber) {
    console.log("⏳ Loading Whisper model...");
    transcriber = await pipeline("automatic-speech-recognition", "Xenova/whisper-small.en");
    console.log("✅ Whisper model loaded!");
  }
  return transcriber;
}

export async function transcribeAudio(file: File) {
  const transcriber = await getTranscriber();
  const output = await transcriber(file, {
    chunk_length_s: 30,
    stride_length_s: 5,
    return_timestamps: true,
  });
  return output.text;
}
