"use client"

import { useEffect, useState } from "react"
import { KanbanBoard } from "@/components/kanban/KanbanBoard"
import { Button } from "@/components/ui/button"
import { Plus, Filter, Download, Users } from "lucide-react"
import { Task, TaskPriority } from "@/lib/types"
import { createTask, fetchTasks, hasTaskBackendConfigured, updateTaskStatus, deleteTask, updateTask } from "@/lib/services/taskService"
import { exportTasksAsCSVFile, exportTasksAsJSONFile } from "@/lib/services/exportService"
import { fetchTeamMembers, TeamMember } from "@/lib/services/teamService"
import { toast } from "sonner"
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
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editStatus, setEditStatus] = useState<Task["status"]>("To Do")
  const [editPriority, setEditPriority] = useState<TaskPriority>("medium")
  const [editDueDate, setEditDueDate] = useState("")
  const [editAssigneeId, setEditAssigneeId] = useState("")

  const loadTasks = async () => {
    try {
      setLoading(true)
      const records = await fetchTasks()
      setTasks(records)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }

  const loadTeamMembers = async () => {
    try {
      const members = await fetchTeamMembers()
      setTeamMembers(members)
    } catch (error) {
      console.error("Failed to load team members:", error)
    }
  }

  useEffect(() => {
    void loadTasks()
    void loadTeamMembers()
  }, [])

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setEditTitle(task.title || "")
    setEditStatus(task.status)
    setEditPriority(task.priority || "medium")
    setEditDueDate(task.dueDate ? task.dueDate.split("T")[0] : "")
    setEditAssigneeId(task.assigneeId || "")
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
              if (!title.trim()) return
              await createTask({ title, status })
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
