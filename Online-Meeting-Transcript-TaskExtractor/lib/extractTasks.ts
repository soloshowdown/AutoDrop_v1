import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function segmentTranscriptBySpeaker(transcript: string) {
  const prompt = `
You are an AI meeting summarizer.

1️⃣ Segment the following transcript by speaker.
2️⃣ Identify tasks in this format:
   - who
   - to_whom
   - task
   - due_date (if mentioned, else null)

Return a JSON object with:
{
  "segments": [
    {"speaker": "Speaker 1", "text": "Hello everyone..."},
    {"speaker": "Speaker 2", "text": "Sure, I’ll handle the report by Monday."}
  ],
  "tasks": [
    {"who": "Speaker 2", "to_whom": "Speaker 1", "task": "Prepare report", "due_date": "Monday"}
  ]
}

Transcript:
${transcript}
`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const text = completion.choices[0].message?.content || "{}";
  try {
    return JSON.parse(text);
  } catch {
    return { segments: [], tasks: [] };
  }
}
