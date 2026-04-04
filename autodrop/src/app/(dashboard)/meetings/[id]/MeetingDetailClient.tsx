"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FileText, Play, ArrowLeft, Bot, Sparkles, Plus, Download, ArrowRight } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Meeting, TranscriptSnippet, Task } from "@/lib/types"
import { downloadFile, exportTasksAsCSVFile } from "@/lib/services/exportService"
import { motion, AnimatePresence } from "framer-motion"
import { KanbanBoard } from "@/components/kanban/KanbanBoard"
import { updateTaskColumn, deleteTask } from "@/lib/services/taskService"

interface MeetingDetailClientProps {
  meeting: Meeting
  transcript: TranscriptSnippet[]
  initialTasks: Task[]
}

export default function MeetingDetailClient({ 
  meeting, 
  transcript, 
  initialTasks 
}: MeetingDetailClientProps) {
  const [extractedTasks, setExtractedTasks] = useState<Task[]>(initialTasks)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const handleSnippetClick = (snippet: TranscriptSnippet) => {
    if (snippet.taskId) {
      setSelectedTaskId(snippet.taskId === selectedTaskId ? null : snippet.taskId)
    }
  }

  const handleTaskStatusChange = async (taskId: string, status: any) => {
    try {
      await updateTaskColumn(taskId, status)
      setExtractedTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
      toast.success("Task updated")
    } catch (error) {
      toast.error("Failed to update task")
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId)
      setExtractedTasks(prev => prev.filter(t => t.id !== taskId))
      toast.success("Task deleted")
    } catch (error) {
      toast.error("Failed to delete task")
    }
  }

  const handleExportTranscript = () => {
    try {
      const transcriptText = transcript
        .map((snippet) => `[${snippet.time}] ${snippet.speaker}: ${snippet.text}`)
        .join("\n\n");
      
      const content = `MEETING TRANSCRIPT\n==================\n\nTitle: ${meeting.title}\nDate: ${new Date(meeting.date).toLocaleDateString()}\n\n${transcriptText}`;
      const filename = `transcript-${meeting.title}-${new Date(meeting.date).toISOString().split("T")[0]}.txt`;
      
      downloadFile(content, filename, "text/plain");
      toast.success("Transcript exported successfully");
    } catch (error) {
      toast.error("Failed to export transcript");
    }
  }

  const handleExportSummary = () => {
    try {
      const summary = `MEETING SUMMARY
==================

Title: ${meeting.title}
Date: ${new Date(meeting.date).toLocaleDateString()}
Duration: ${meeting.duration}
Status: ${meeting.status}

EXTRACTED TASKS
----------------
${extractedTasks.map((task) => `- [${task.status}] ${task.title}${task.assignee ? ` (${task.assignee})` : ""}${task.dueDate ? ` - Due: ${task.dueDate}` : ""}`).join("\n")}
`;
      const filename = `summary-${meeting.title}-${new Date(meeting.date).toISOString().split("T")[0]}.txt`;
      downloadFile(summary, filename, "text/plain");
      toast.success("Summary exported successfully");
    } catch (error) {
      toast.error("Failed to export summary");
    }
  }

  const handleExportTasks = () => {
    try {
      exportTasksAsCSVFile(extractedTasks);
      toast.success("Tasks exported to CSV");
    } catch (error) {
      toast.error("Failed to export tasks");
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] w-full mx-auto">
      {/* Header Section */}
      <div className="flex items-center gap-4">
        <Link 
          href="/meetings"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{meeting.title}</h1>
            <Badge variant="secondary">{meeting.status}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">{new Date(meeting.date).toLocaleDateString()} • {meeting.duration}</p>
        </div>
        <div className="ml-auto flex gap-2">
           <Button variant="outline" size="sm" onClick={handleExportTasks} disabled={extractedTasks.length === 0}>
             <Download className="mr-2 h-4 w-4" /> Export Tasks
           </Button>
           <Button variant="outline" size="sm" onClick={handleExportTranscript}>
             <Download className="mr-2 h-4 w-4" /> Export Transcript
           </Button>
           <Button size="sm" onClick={handleExportSummary}>
             <Download className="mr-2 h-4 w-4" /> Export Summary
           </Button>
        </div>
      </div>

      {/* Main Content: Video/Audio Player Area */}
      <div className="w-full aspect-video bg-black/90 rounded-xl overflow-hidden relative flex flex-col shadow-xl border max-w-5xl mx-auto">
        <div className="absolute inset-0 flex items-center justify-center">
          <Button size="icon" className="h-20 w-20 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20">
            <Play className="h-10 w-10 ml-1 fill-white" />
          </Button>
        </div>
      </div>

      {/* Split View: Transcript & Action Board */}
      <div className="grid lg:grid-cols-12 gap-8 h-[700px]">
        {/* Left: Transcript */}
        <div className="lg:col-span-4 flex flex-col h-full overflow-hidden">
          <Card className="flex-1 flex flex-col overflow-hidden border-primary/10 shadow-lg bg-background/50 backdrop-blur-xl">
            <CardHeader className="py-4 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary"/> 
                  Transcript
                </CardTitle>
                <Input placeholder="Search..." className="h-8 w-[120px] bg-background/50 text-xs" />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto scroll-smooth">
              {transcript.length > 0 ? (
                <div className="divide-y divide-primary/5">
                  {transcript.map((snippet, i) => (
                    <div 
                      key={i} 
                      onClick={() => handleSnippetClick(snippet)}
                      className={`p-4 hover:bg-muted/50 transition-all cursor-pointer relative ${
                        snippet.taskId && selectedTaskId === snippet.taskId ? "bg-primary/5 border-l-4 border-l-primary" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-muted-foreground">{snippet.time}</span>
                        <span className="font-bold text-xs">{snippet.speaker}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{snippet.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                  <Bot className="h-12 w-12 mb-4 opacity-20 text-primary" />
                  <p className="font-medium">Processing transcript...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Kanban Action Board */}
        <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Action Board
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/5 font-mono">{extractedTasks.length} ITEMS</Badge>
              <Link href="/tasks">
                 <Button variant="ghost" size="sm" className="text-xs text-primary">View Full Screen <ArrowRight className="ml-1 h-3 w-3"/></Button>
              </Link>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden border rounded-3xl bg-muted/5 p-4 shadow-inner">
             <KanbanBoard 
               tasks={extractedTasks}
               onTaskStatusChange={handleTaskStatusChange}
               onDeleteTask={handleDeleteTask}
             />
          </div>
        </div>
      </div>
    </div>
  )
}
