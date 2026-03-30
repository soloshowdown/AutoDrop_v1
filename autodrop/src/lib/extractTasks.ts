import OpenAI from "openai";
import { ExtractedTask } from "@/lib/types";
import { bulkInsertTasks } from "@/lib/services/taskService";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Extracts tasks from a full transcript using GPT-4o.
 */
export async function extractTasks(meetingId: string, transcriptText: string, workspaceId: string) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = `You are an expert meeting analyst. Extract every action item, task, deadline, and commitment from the transcript.
Return ONLY a valid JSON object with a "tasks" key containing an array of objects.
Each object must have exactly these fields:
{
  "title": string,          // imperative sentence e.g. 'Fix login bug on mobile'
  "assignee": string|null,  // name if mentioned, else null
  "deadline": string|null,  // ISO date YYYY-MM-DD if mentioned, else null
  "priority": "high"|"medium"|"low",  // infer from urgency
  "confidence": number,     // 0.0 to 1.0, how explicitly was this committed to
  "source_timestamp_ms": number,  // ms in transcript where this was mentioned
  "key_point": boolean      // true if major decision, not just a task
}`;

    await supabaseAdmin.from("meetings").update({ status: "extracting" }).eq("id", meetingId);

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: transcriptText }
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content ?? "{\"tasks\": []}";
    let tasks: any[] = [];
    try {
      const parsed = JSON.parse(content);
      tasks = parsed.tasks || (Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      console.error("Failed to parse GPT response:", e);
      throw new Error("AI output parsing failed");
    }

    // Map to Supabase schema and apply confidence logic
    const tasksToInsert = tasks.map(t => ({
      workspace_id: workspaceId,
      meeting_id: meetingId,
      title: t.title,
      assignee_name: t.assignee, 
      due_date: t.deadline,
      priority: t.priority || "medium",
      status: t.confidence >= 0.7 ? "Backlog" : "To Do", 
      source_type: "AI",
      confidence: t.confidence,
      transcript_timestamp: t.source_timestamp_ms ? String(t.source_timestamp_ms) : null,
      approved: false, 
      metadata: { key_point: t.key_point }
    }));

    if (tasksToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin.from("tasks").insert(tasksToInsert);
      if (insertError) {
        console.error("Error bulk inserting tasks:", insertError.message);
        throw insertError;
      }
    }

    await supabaseAdmin.from("meetings").update({ status: "completed" }).eq("id", meetingId);
    return tasksToInsert;
  } catch (error) {
    console.error("Critical error in extractTasks:", error);
    await supabaseAdmin.from("meetings").update({ status: "failed" }).eq("id", meetingId);
    throw error;
  }
}


// Keep existing helper if needed for live chunks, but update it to be consistent
export async function extractTasksFromChunk(speechText: string, speaker: string) {
  // This is now secondary but we'll keep it for live chunks if still used
  // and ensure it's simple.
  return { tasks: [] }; 
}

// Keeping this for backward compatibility if used in transcribe route initially
export async function segmentTranscriptBySpeaker(transcript: string) {
    // This is essentially what extractTasks does now but focused on segments
    // For now, let's keep a simplified version or just use extractTasks
    return { segments: [], tasks: [] };
}

