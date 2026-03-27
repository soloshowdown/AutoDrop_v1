"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Play, ArrowLeft, Bot, Sparkles, Plus, Download } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Meeting, TranscriptSnippet, Task } from "@/lib/types"
import { downloadFile } from "@/lib/services/exportService"

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
  const [extractedTasks, setExtractedTasks] = useState(initialTasks)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateTasks = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      toast.success("Tasks extracted successfully!")
      if (extractedTasks.length === initialTasks.length) {
         setExtractedTasks([...extractedTasks, {
           id: "t-new",
           title: "Follow up with client regarding AI feature",
           status: "To Do",
           dueDate: "Next week",
           assignee: "AutoAssigned",
           meetingId: meeting.id
         }])
      }
    }, 2000)
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

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] w-full mx-auto">
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
           <Button 
             variant="outline"
             size="sm"
             onClick={handleExportTranscript}
           >
             <Download className="mr-2 h-4 w-4" /> Export Transcript
           </Button>
           <Button 
             size="sm"
             onClick={handleExportSummary}
           >
             <Download className="mr-2 h-4 w-4" /> Export Summary
           </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="col-span-2 flex flex-col gap-6">
          <div className="w-full aspect-video bg-black/90 rounded-xl overflow-hidden relative flex flex-col shadow-md border">
            <div className="absolute inset-0 flex items-center justify-center">
              <Button size="icon" className="h-16 w-16 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/40">
                <Play className="h-8 w-8 ml-1" />
              </Button>
            </div>
            <div className="mt-auto h-12 bg-gradient-to-t from-black/80 to-transparent p-4 flex items-end">
               <div className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden">
                 <div className="w-1/3 h-full bg-primary"></div>
               </div>
            </div>
          </div>

          <Card className="flex-1 flex flex-col overflow-hidden min-h-[400px]">
            <CardHeader className="py-4 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5"/> Transcript</CardTitle>
                <Input placeholder="Search transcript..." className="h-8 w-[200px]" />
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto max-h-[500px]">
              {transcript.length > 0 ? (
                <div className="divide-y relative">
                  {transcript.map((snippet, i) => (
                    <div key={i} className="p-4 hover:bg-muted/30 group flex gap-4 transition-colors">
                      <div className="w-12 text-sm text-muted-foreground font-mono shrink-0">{snippet.time}</div>
                      <div className="flex-1">
                        <span className="font-semibold text-sm block mb-1">{snippet.speaker}</span>
                        <p className="text-sm leading-relaxed">{snippet.text}</p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-start">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Plus className="h-4 w-4"/></Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                  <Bot className="h-8 w-8 mb-4 opacity-50" />
                  <p>Transcript is processing.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="flex-1 border-primary/20 shadow-xl overflow-hidden flex flex-col">
            <div className="h-2 w-full bg-gradient-to-r from-primary to-blue-500"></div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                   <Sparkles className="h-5 w-5 text-primary" /> Auto-Extracted Tasks
                </CardTitle>
                <Badge variant="outline" className="bg-primary/5">{extractedTasks.length} Found</Badge>
              </div>
              <CardDescription>Tasks identified by our LLM during the meeting.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              {extractedTasks.map((task) => (
                 <div key={task.id} className="p-3 rounded-lg border bg-card shadow-sm group">
                   <div className="flex justify-between items-start mb-2">
                     <p className="font-medium text-sm leading-tight">{task.title}</p>
                   </div>
                   <div className="flex items-center justify-between mt-4">
                     <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                           {task.status}
                        </Badge>
                        {task.assignee && (
                          <span className="flex items-center"><div className="w-4 h-4 rounded-full bg-muted mr-1.5 flex items-center justify-center text-[8px] border">{task.assignee[0]}</div> {task.assignee}</span>
                        )}
                     </div>
                   </div>
                 </div>
              ))}

              <Button 
                className="w-full mt-auto mt-4" 
                onClick={handleGenerateTasks} 
                disabled={isGenerating}
              >
                {isGenerating ? (
                   <span className="flex items-center gap-2 animate-pulse"><Sparkles className="h-4 w-4" /> Analyzing Audio...</span>
                ) : (
                   <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Re-scan for Tasks</span>
                )}
              </Button>
              <Link 
                href="/tasks"
                className={buttonVariants({ variant: "outline", className: "w-full" })}
              >
                View in Kanban Board
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />
}
