import OpenAI from "openai";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Extracts tasks from a full transcript using GPT-4o-mini.
 * Follows the strict requirement for field mapping and column (status) logic.
 */
export async function extractTasks(meetingId: string, transcriptText: string, workspaceId: string) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = `You are an expert meeting analyst.
Extract every action item, task, deadline, and commitment from the transcript.
Return ONLY a valid JSON object with a single key "tasks" containing an array.
Each task object must have exactly these fields:
 {
  "title": string,           // clear imperative sentence
  "assignee": string|null,   // person's name if mentioned, else null
  "deadline": string|null,   // ISO date YYYY-MM-DD if mentioned, else null
  "priority": "high"|"medium"|"low",
  "confidence": number,      // 0.0 to 1.0
  "source_timestamp_ms": number,
  "key_point": boolean
 }`;

    await supabaseAdmin.from("meetings").update({ status: "extracting" }).eq("id", meetingId);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "TRANSCRIPT:\n" + transcriptText }
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content ?? "{\"tasks\": []}";
    let extractedTasks: any[] = [];
    try {
      const parsed = JSON.parse(content);
      extractedTasks = parsed.tasks || [];
    } catch (e) {
      console.error("Failed to parse GPT response:", e);
      throw new Error("AI output parsing failed");
    }

    const tasksToInsert = [];
    
    for (let i = 0; i < extractedTasks.length; i++) {
      const task = extractedTasks[i];
      let assigneeId = null;

      // Attemp to resolve assignee name to real user id if possible
      if (task.assignee && task.assignee !== "null") {
        const { data: users } = await supabaseAdmin
          .from("users")
          .select("id")
          .ilike("name", `%${task.assignee}%`)
          .limit(1);
          
        if (users && users.length > 0) {
          assigneeId = users[0].id;
        }
      }

      tasksToInsert.push({
        workspace_id: workspaceId,
        meeting_id: meetingId,
        title: task.title,
        assignee_name: task.assignee !== "null" ? task.assignee : null,
        assignee_id: assigneeId,
        due_date: task.deadline || null,
        priority: task.priority || "medium",
        status: task.confidence >= 0.7 ? "Backlog" : "Review", 
        source_type: "AI",
        confidence: task.confidence || 0.5,
        transcript_timestamp: task.source_timestamp_ms ? String(task.source_timestamp_ms) : null,
        approved: false, // AI tasks always start unapproved
        position: i
      });
    }

    if (tasksToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin.from("tasks").insert(tasksToInsert);
      if (insertError) {
        console.error("Error bulk inserting tasks:", insertError.message);
        throw insertError;
      }
    }

    await supabaseAdmin.from("meetings").update({ status: "completed" }).eq("id", meetingId);
    return tasksToInsert.length;
  } catch (error) {
    console.error("Critical error in extractTasks:", error);
    await supabaseAdmin.from("meetings").update({ status: "failed" }).eq("id", meetingId);
    throw error;
  }
}


