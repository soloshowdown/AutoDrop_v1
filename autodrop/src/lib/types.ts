export interface Meeting {
  id: string;
  title: string;
  date: string;
  status: "Completed" | "Processing" | "Failed";
  duration: string;
  roomId?: string;
  transcript?: TranscriptSnippet[];
  extractedTasks?: ExtractedTask[];
  participants?: string[];
}

export type TaskStatus = "Backlog" | "To Do" | "In Progress" | "Done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assignee?: string;
  assigneeId?: string;
  requestedBy?: string;
  meetingId?: string;
}

export interface TranscriptSnippet {
  time: string;
  speaker: string;
  text: string;
}

export interface ExtractedTask {
  who: string;
  to_whom: string;
  task: string;
  due_date: string | null;
  priority?: "low" | "medium" | "high";
}
