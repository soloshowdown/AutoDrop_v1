import { Task } from "@/lib/types";

export function exportTasksAsCSV(tasks: Task[]): string {
  const headers = ["Title", "Assignee", "Deadline", "Priority", "Column", "Confidence", "Meeting Name"];
  const rows = tasks.map((task) => [
    `"${task.title.replace(/"/g, '""')}"`,
    task.assignee ?? "",
    task.dueDate ?? "",
    task.priority ?? "medium",
    task.status,
    task.confidence ?? "",
    `"${(task.meetingTitle || "").replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  return csv;
}


export function exportTasksAsJSON(tasks: Task[]): string {
  return JSON.stringify(tasks, null, 2);
}

export function downloadFile(content: string, filename: string, mimeType: string = "text/plain") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportTasksAsCSVFile(tasks: Task[]) {
  const csv = exportTasksAsCSV(tasks);
  const timestamp = new Date().toISOString().split("T")[0];
  downloadFile(csv, `tasks-${timestamp}.csv`, "text/csv");
}

export function exportTasksAsJSONFile(tasks: Task[]) {
  const json = exportTasksAsJSON(tasks);
  const timestamp = new Date().toISOString().split("T")[0];
  downloadFile(json, `tasks-${timestamp}.json`, "application/json");
}

export function exportTasksSummary(tasks: Task[]): string {
  const byStatus = {
    Backlog: tasks.filter((t) => t.status === "Backlog").length,
    "To Do": tasks.filter((t) => t.status === "To Do").length,
    "In Progress": tasks.filter((t) => t.status === "In Progress").length,
    Done: tasks.filter((t) => t.status === "Done").length,
  };

  const summary = `
### Task Summary

**Total Tasks:** ${tasks.length}

**By Status:**
- Backlog: ${byStatus.Backlog}
- To Do: ${byStatus["To Do"]}
- In Progress: ${byStatus["In Progress"]}
- Done: ${byStatus.Done}

**Generated:** ${new Date().toLocaleString()}
`.trim();

  return summary;
}
