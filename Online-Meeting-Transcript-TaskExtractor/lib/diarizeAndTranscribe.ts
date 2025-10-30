import fs from "fs";
import { pipeline } from "@xenova/transformers";

/**
 * Performs speaker diarization + transcription
 * Returns [{ speaker: string, text: string, start: number, end: number }]
 */
export async function diarizeAndTranscribe(filePath: string) {
  console.log("🧠 Loading Whisper + Speaker Diarization model...");
  const diarizer = await pipeline("automatic-speech-recognition", "Xenova/whisper-speaker-diarization");

  console.log("🎧 Processing audio:", filePath);
  const result = await diarizer(filePath, {
    chunk_length_s: 30,
    stride_length_s: 5,
    return_timestamps: true,
  });

  // Convert raw diarization into structured segments
  const segments = result.segments.map((seg: any) => ({
    speaker: seg.speaker || `Speaker ${seg.speaker_id ?? "?"}`,
    text: seg.text,
    start: seg.start,
    end: seg.end,
  }));

  return segments;
}
