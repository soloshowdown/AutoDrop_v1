import { Meeting, Task, TranscriptSnippet } from "./types"

export const mockMeetings: Meeting[] = [
  {
    id: "m-1",
    title: "Q3 Planning Sync",
    date: "2023-10-14T10:00:00Z",
    status: "Completed",
    duration: "45 mins",
  },
  {
    id: "m-2",
    title: "Design Review - V2",
    date: "2023-10-12T14:30:00Z",
    status: "Completed",
    duration: "30 mins",
  },
  {
    id: "m-3",
    title: "All Hands Meeting",
    date: "2023-10-10T09:00:00Z",
    status: "Processing",
    duration: "60 mins",
  },
]

export const mockTasks: Task[] = [
  {
    id: "t-1",
    title: "Update Q3 roadmap with new priorities",
    status: "To Do",
    dueDate: "2023-10-20",
    assignee: "Alice",
    meetingId: "m-1",
  },
  {
    id: "t-2",
    title: "Review new design system components",
    status: "In Progress",
    dueDate: "2023-10-18",
    assignee: "Bob",
    meetingId: "m-2",
  },
  {
    id: "t-3",
    title: "Draft email summarizing All Hands for absentees",
    status: "Done",
    dueDate: "2023-10-15",
    assignee: "Charlie",
    meetingId: "m-3",
  },
  {
    id: "t-4",
    title: "Schedule follow-up on budget approvals",
    status: "Backlog",
    dueDate: "2023-10-25",
    assignee: "Alice",
    meetingId: "m-1",
  },
]

export const mockTranscripts: Record<string, TranscriptSnippet[]> = {
  "m-1": [
    { time: "00:00", speaker: "Alice", text: "Alright, let's get started with the Q3 planning sync." },
    { time: "00:15", speaker: "Bob", text: "I've reviewed the numbers, and we need to adjust our targets." },
    { time: "01:05", speaker: "Alice", text: "Agreed. I will update the roadmap with these new priorities by Friday." },
    { time: "02:30", speaker: "Charlie", text: "Should we also look into the budget for next quarter?" },
    { time: "02:45", speaker: "Alice", text: "Yes, let's schedule a follow up on budget approvals next week." },
  ],
  "m-2": [
    { time: "00:00", speaker: "Bob", text: "Thanks for joining the design review." },
    { time: "00:20", speaker: "Charlie", text: "The new color palette looks great, but we need to check contrast." },
    { time: "01:10", speaker: "Bob", text: "I'll review the new design system components to ensure compliance." },
  ],
}
