import OpenAI from "openai";
import { ExtractedTask } from "@/lib/types";
import { bulkInsertTasks } from "@/lib/services/taskService";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function getTeamMembers(workspaceId: string) {
  const { data, error } = await supabaseAdmin
    .from("workspace_members")
    .select("user_id, users!inner(name)")
    .eq("workspace_id", workspaceId);
    
  if (error || !data) return ["Kunal", "Vaibhav", "Rahul", "Sumit"];
  const names = data.map((d: any) => d.users?.name).filter(Boolean);
  return names.length > 0 ? names : ["Kunal", "Vaibhav", "Rahul", "Sumit"];
}

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

    const teamMembersList = await getTeamMembers(workspaceId);

    const systemPrompt = `You are an AI assistant that extracts tasks from a team meeting transcript.

Each line is in format:
"Speaker: message"

---

GOAL:
Extract tasks and assign them to the correct team member.

---

RULES:

1. If speaker says "I will..." → assign task to speaker
2. If speaker mentions a person (e.g., "Vaibhav, do this") → assign to that person
3. If someone agrees ("I'll do it") → assign to that speaker
4. If no clear assignee → assignee = null
5. Only assign tasks to valid team members

---

TEAM MEMBERS:
${JSON.stringify(teamMembersList)}

---

OUTPUT FORMAT (STRICT JSON):

{
  "tasks": [
    {
      "title": "task title",
      "assignee_name": "exact team member name or null",
      "assigned_by": "speaker"
    }
  ]
}`;

    await supabaseAdmin.from("meetings").update({ status: "extracting" }).eq("id", meetingId);

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "TRANSCRIPT:\n" + transcriptText }
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

    const tasksToInsert = [];
    
    for (const t of tasks) {
      let assigneeId = null;
      if (t.assignee_name && t.assignee_name !== "null") {
        const { data: user } = await supabaseAdmin
          .from("users")
          .select("id")
          .ilike("name", `%${t.assignee_name}%`)
          .single();
          
        if (user) {
          assigneeId = user.id;
        }
      }

      tasksToInsert.push({
        workspace_id: workspaceId,
        meeting_id: meetingId,
        title: t.title,
        assignee_name: t.assignee_name !== "null" ? t.assignee_name : null,
        assignee_id: assigneeId,
        due_date: null,
        status: "Backlog", 
        source_type: "AI",
        confidence: 1.0,
        transcript_timestamp: null,
        approved: false
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
    return tasksToInsert;
  } catch (error) {
    console.error("Critical error in extractTasks:", error);
    await supabaseAdmin.from("meetings").update({ status: "failed" }).eq("id", meetingId);
    throw error;
  }
}

