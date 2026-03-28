import OpenAI from "openai";
import { ExtractedTask } from "@/lib/types";

export async function segmentTranscriptBySpeaker(transcript: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const prompt = `
You are an AI meeting analyst that extracts actionable data from transcripts.

TASK 1: Segment the transcript by speaker with their full name/ID.
TASK 2: Extract all unique participants mentioned.
TASK 3: Identify all action items and tasks with:
   - task: Clear description of what needs to be done
   - who: Person responsible for doing the task (assignee)
   - to_whom: Person requesting the task (if applicable)
   - due_date: Deadline (extract all date indicators: "by tomorrow", "next Monday", "EOW", "end of month", etc.)
   - priority: 'high', 'medium', or 'low' based on context

Return ONLY valid JSON with this exact shape:
{
  "segments": [{"speaker": "Full Name", "text": "What they said..."}],
  "participants": ["Full Name 1", "Full Name 2"],
  "tasks": [
    {
      "title": "Prepare Q4 financial report",
      "assignee": "John Smith",
      "deadline": "Friday EOD",
      "priority": "high"
    }
  ]
}

Important:
- Use exact keys: "title", "assignee", "deadline"
- Extract FULL NAMES of all people mentioned (not "Speaker 1")
- If names aren't stated, use contextual clues from title or role
- Be aggressive about extracting ALL implied tasks
- Include meetings, reviews, presentations, deliverables
- Preserve exact date references the speaker used

Transcript:
${transcript}
`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content);
  } catch {
    return { segments: [], tasks: [] };
  }
}

export async function extractTasksFromChunk(speechText: string, speaker: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = `You are an AI meeting assistant that extracts action items from a short segment of meeting text.

Task:
- Read the transcript chunk below.
- Extract only the new tasks and commitments made in this chunk.
- Assign tasks by speaker when the speaker says "I will..." or by named person when the text says "<name> will...".
- Return only valid JSON with this exact structure:
{
  "tasks": [
    {
      "title": "Short task description",
      "assignee": "Full Name or Speaker",
      "deadline": "as stated in text or null",
      "priority": "low" | "medium" | "high"
    }
  ]
}

If there are no action items, return {"tasks": []}.

Transcript chunk:
${speaker}: ${speechText}`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content ?? "{}";

  try {
    const parsed = JSON.parse(content);
    return {
      tasks: Array.isArray(parsed.tasks)
        ? parsed.tasks.map((task: any) => ({
            title: String(task.title || "").trim(),
            assignee: task.assignee ? String(task.assignee).trim() : undefined,
            deadline: task.deadline ? String(task.deadline).trim() : null,
            priority: task.priority ? String(task.priority).toLowerCase() : undefined,
          }))
        : [],
    } as { tasks: ExtractedTask[] };
  } catch {
    return { tasks: [] };
  }
}
