"use client"

import { useEffect, useState } from "react"
import { KanbanBoard } from "@/components/kanban/KanbanBoard"
import { Button } from "@/components/ui/button"
import { Task, TaskPriority } from "@/lib/types"
import { createTask, fetchTasks, hasTaskBackendConfigured, updateTaskStatus, deleteTask, updateTask, subscribeToTasks } from "@/lib/services/taskService"
import { exportTasksAsCSVFile, exportTasksAsJSONFile } from "@/lib/services/exportService"
import { fetchWorkspaceMembers } from "@/lib/services/workspaceService"
import { toast } from "sonner"
import { useWorkspace } from "@/lib/contexts/WorkspaceContext"
import { PendingTasks } from "@/components/kanban/PendingTasks"
import { useRef } from "react"
import { Sparkles, Plus, Filter, Download, Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function KanbanBoardPage() {
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editStatus, setEditStatus] = useState<Task["status"]>("To Do")
  const [editPriority, setEditPriority] = useState<TaskPriority>("medium")
  const [editDueDate, setEditDueDate] = useState("")
  const [editAssigneeId, setEditAssigneeId] = useState("")
  const [editSourceType, setEditSourceType] = useState<"AI" | "User">("User")
  const [editMeetingTitle, setEditMeetingTitle] = useState("")
  const [editTranscriptTimestamp, setEditTranscriptTimestamp] = useState("")
  const prevTasksCount = useRef(0)

  const isAdmin = currentWorkspace?.role === 'admin';

  const loadTasks = async () => {
    if (!currentWorkspace?.id) return
    try {
      setLoading(true)
      const records = await fetchTasks(currentWorkspace.id)
      
      // If new tasks are detected, show a toast
      if (records.length > prevTasksCount.current && prevTasksCount.current > 0) {
        toast.info("New tasks added from meeting", {
           description: "Check your Kanban board for the latest updates.",
           icon: <Sparkles className="h-4 w-4 text-primary" />
        })
      }
      prevTasksCount.current = records.length
      setTasks(records)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }

  const loadTeamMembers = async () => {
    if (!currentWorkspace?.id) return
    try {
      const members = await fetchWorkspaceMembers(currentWorkspace.id)
      // Map members to the format expected by the UI (joining with users)
      setTeamMembers(members.map((m: any) => ({
        id: m.users.id,
        name: m.users.name,
        avatar: m.users.avatar_url
      })))
    } catch (error) {
      console.error("Failed to load team members:", error)
    }
  }

  useEffect(() => {
    if (!currentWorkspace?.id) return

    void loadTasks()
    void loadTeamMembers()

    // Subscribe to real-time changes
    const subscription = subscribeToTasks(currentWorkspace.id, (payload) => {
      if (payload.eventType === "INSERT") {
        const newTask = payload.new as Task
        setTasks((prev) => {
          if (prev.find((t) => t.id === newTask.id)) return prev
          return [...prev, newTask]
        })
        toast.info("New task added")
      } else if (payload.eventType === "UPDATE") {
        const updatedTask = payload.new as Task
        setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)))
      } else if (payload.eventType === "DELETE") {
        const deletedId = payload.old.id
        setTasks((prev) => prev.filter((t) => t.id !== deletedId))
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [currentWorkspace?.id])

  // Polling every 5 seconds for tasks (fallback for real-time)
  useEffect(() => {
    if (!currentWorkspace?.id) return
    const interval = setInterval(() => loadTasks(), 3000)
    return () => clearInterval(interval)
  }, [currentWorkspace?.id])

  if (isWorkspaceLoading) {
    return <div className="p-8">Loading workspace...</div>
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setEditTitle(task.title || "")
    setEditStatus(task.status)
    setEditPriority(task.priority || "medium")
    setEditDueDate(task.dueDate ? task.dueDate.split("T")[0] : "")
    setEditAssigneeId(task.assigneeId || "")
    setEditSourceType(task.sourceType || "User")
    setEditMeetingTitle(task.meetingTitle || "")
    setEditTranscriptTimestamp(task.transcriptTimestamp || "")
  }

  const handleSaveEdit = async () => {
    if (!editingTask || !editTitle.trim()) {
      toast.error("Task title cannot be empty")
      return
    }

    try {
      await updateTask(editingTask.id, {
        title: editTitle,
        status: editStatus,
        dueDate: editDueDate || undefined,
        priority: editPriority,
        assigneeId: editAssigneeId || undefined,
        sourceType: editSourceType,
        meetingTitle: editMeetingTitle || undefined,
        transcriptTimestamp: editTranscriptTimestamp || undefined,
      })
      setEditingTask(null)
      toast.success("Task updated successfully")
      await loadTasks()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update task")
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return

    try {
      await deleteTask(taskId)
      await loadTasks()
      toast.success("Task deleted successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete task")
    }
  }

  const handleExport = (format: "csv" | "json") => {
    try {
      if (format === "csv") {
        exportTasksAsCSVFile(tasks)
      } else {
        exportTasksAsJSONFile(tasks)
      }
      toast.success(`Tasks exported as ${format.toUpperCase()}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed")
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage and track your extracted action items.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
           <Button variant="outline" size="sm" className="hidden sm:flex">
             <Filter className="h-4 w-4 mr-2" /> Filter
           </Button>
           <div className="flex gap-1">
             <Button 
               variant="outline" 
               size="sm"
               onClick={() => handleExport("csv")}
               disabled={tasks.length === 0}
             >
               <Download className="h-4 w-4 mr-2" /> CSV
             </Button>
             <Button 
               variant="outline" 
               size="sm"
               onClick={() => handleExport("json")}
               disabled={tasks.length === 0}
             >
               <Download className="h-4 w-4 mr-2" /> JSON
             </Button>
           </div>
           <Button size="sm">
             <Plus className="h-4 w-4 mr-2" /> Add Task
           </Button>
        </div>
      </div>

      {isAdmin && currentWorkspace?.id && (
        <PendingTasks 
          workspaceId={currentWorkspace.id} 
          onTaskApproved={loadTasks} 
          onEditTask={handleEditTask}
        />
      )}

      <div className="flex-1 overflow-hidden rounded-xl border bg-muted/10 p-4">
        {!hasTaskBackendConfigured() ? (
          <div className="text-sm text-muted-foreground p-4">
            Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to enable AutoScrum task sync.
          </div>
        ) : loading ? (
          <div className="text-sm text-muted-foreground p-4">Loading tasks...</div>
        ) : (
          <KanbanBoard
            tasks={tasks}
            onTaskStatusChange={async (taskId, status) => {
              await updateTaskStatus(taskId, status)
              await loadTasks()
            }}
            onAddTask={async (title, status) => {
              if (!title.trim() || !currentWorkspace?.id) return
              await createTask({ workspaceId: currentWorkspace.id, title, status })
              await loadTasks()
            }}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />
        )}
      </div>

      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Task title"
              />
            </div>
            <div>
              <Label htmlFor="task-status">Status</Label>
              <Select value={editStatus} onValueChange={(value) => setEditStatus(value as Task["status"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Backlog">Backlog</SelectItem>
                  <SelectItem value="To Do">To Do</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="task-priority">Priority</Label>
              <Select value={editPriority} onValueChange={(value) => setEditPriority(value as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="task-assignee">Assign To</Label>
              <Select value={editAssigneeId} onValueChange={(value) => setEditAssigneeId(value || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="task-due-date">Due Date</Label>
              <Input
                id="task-due-date"
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task-source">Source Type</Label>
                <Select value={editSourceType} onValueChange={(v) => setEditSourceType(v as "AI" | "User")}>
                  <SelectTrigger id="task-source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AI">AI Generated</SelectItem>
                    <SelectItem value="User">User Added</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="task-timestamp">Timestamp</Label>
                <Input
                  id="task-timestamp"
                  placeholder="e.g. 12:45"
                  value={editTranscriptTimestamp}
                  onChange={(e) => setEditTranscriptTimestamp(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="task-meeting">Source Meeting</Label>
              <Input
                id="task-meeting"
                placeholder="Meeting title"
                value={editMeetingTitle}
                onChange={(e) => setEditMeetingTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTask(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
