export interface Meeting {
  id: string;
  title: string;
  date: string;
  status: "completed" | "processing" | "failed" | "live";
  duration: string;
  roomId?: string;
  transcript?: TranscriptSnippet[];
  extractedTasks?: ExtractedTask[];
  participants?: string[];
}

export type TaskStatus = "Review" | "Backlog" | "To Do" | "In Progress" | "Done";
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
  meetingTitle?: string;
  sourceType?: "AI" | "User";
  transcriptTimestamp?: string;
  approved: boolean;
  confidence?: number;
  assigneeName?: string;
}


export interface TranscriptSnippet {
  time: string;
  speaker: string;
  text: string;
  isActionable?: boolean;
  taskId?: string;
}

export interface ExtractedTask {
  assignee: string;
  title: string;
  deadline: string | null;
  priority?: "low" | "medium" | "high";
}
