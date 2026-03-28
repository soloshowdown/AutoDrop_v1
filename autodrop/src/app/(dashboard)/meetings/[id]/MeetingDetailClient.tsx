"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Play, ArrowLeft, Bot, Sparkles, Plus, Download, ArrowRight } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Meeting, TranscriptSnippet, Task } from "@/lib/types"
import { downloadFile } from "@/lib/services/exportService"
import { motion, AnimatePresence } from "framer-motion"

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
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const handleSnippetClick = (snippet: TranscriptSnippet) => {
    if (snippet.taskId) {
      setSelectedTaskId(snippet.taskId === selectedTaskId ? null : snippet.taskId)
    }
  }

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId === selectedTaskId ? null : taskId)
    // Optional: add scroll to transcript logic here
  }

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
           meetingId: meeting.id,
           approved: false,
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

          <Card className="flex-1 flex flex-col overflow-hidden min-h-[500px] border-primary/10 shadow-lg bg-background/50 backdrop-blur-xl">
            <CardHeader className="py-4 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary"/> 
                  Transcript
                </CardTitle>
                <div className="flex items-center gap-2">
                   <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10">AI Augmented</Badge>
                   <Input placeholder="Search transcript..." className="h-8 w-[200px] bg-background/50" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto max-h-[600px] scroll-smooth">
              {transcript.length > 0 ? (
                <div className="divide-y divide-primary/5 relative">
                  {transcript.map((snippet, i) => {
                    const isSelected = snippet.taskId && selectedTaskId === snippet.taskId;
                    return (
                      <motion.div 
                        key={i} 
                        layout
                        initial={false}
                        onClick={() => handleSnippetClick(snippet)}
                        className={`p-4 group flex gap-4 transition-all duration-300 cursor-pointer relative overflow-hidden ${
                          isSelected ? "bg-primary/10 border-l-4 border-l-primary" : "hover:bg-muted/50"
                        } ${snippet.isActionable && !isSelected ? "bg-yellow-500/5" : ""}`}
                      >
                        <div className="w-12 text-xs text-muted-foreground font-mono shrink-0 pt-1">{snippet.time}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm">{snippet.speaker}</span>
                            {snippet.isActionable && (
                              <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-yellow-500/30 text-yellow-600 bg-yellow-500/5">
                                Actionable Item
                              </Badge>
                            )}
                          </div>
                          <p className={`text-sm leading-relaxed ${isSelected ? "text-foreground font-medium" : "text-muted-foreground group-hover:text-foreground"}`}>
                            {snippet.text}
                          </p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-start gap-1">
                          {snippet.isActionable && !snippet.taskId ? (
                             <Button variant="secondary" size="sm" className="h-7 px-2 text-[10px] bg-primary text-primary-foreground">
                               <Plus className="h-3 w-3 mr-1"/> Create Task
                             </Button>
                          ) : (
                             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary">
                               <Plus className="h-4 w-4"/>
                             </Button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-24 text-center text-muted-foreground flex flex-col items-center">
                  <Bot className="h-12 w-12 mb-4 opacity-20 animate-pulse text-primary" />
                  <p className="font-medium">Transcript is being processed by AI...</p>
                  <p className="text-xs opacity-60">This usually takes a few minutes.</p>
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
            <CardContent className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-[600px] p-4">
              <AnimatePresence mode="popLayout">
                {extractedTasks.map((task) => {
                  const isSelected = selectedTaskId === task.id;
                  // Mock confidence score
                  const confidence = 85 + (parseInt(task.id.slice(-1)) || 5) % 15;
                  
                  return (
                    <motion.div 
                      key={task.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => handleTaskClick(task.id)}
                      className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer group relative overflow-hidden ${
                        isSelected 
                          ? "ring-2 ring-primary border-transparent bg-primary/5 shadow-md" 
                          : "bg-card hover:border-primary/30 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <p className={`font-semibold text-sm leading-tight transition-colors ${isSelected ? "text-primary" : "text-foreground"}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                           <span className="text-[10px] font-bold">{confidence}%</span>
                           <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                             <div 
                               className="h-full bg-primary transition-all duration-500" 
                               style={{ width: `${confidence}%` }}
                             />
                           </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-transparent">
                              {task.status}
                           </Badge>
                           {task.assignee && (
                             <div className="flex items-center gap-1.5">
                               <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary border border-primary/10">
                                 {task.assignee[0]}
                               </div>
                               <span className="text-[10px] text-muted-foreground font-medium">{task.assignee}</span>
                             </div>
                           )}
                        </div>
                        
                        {isSelected && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-primary text-primary-foreground p-1 rounded-full shadow-lg"
                          >
                             <ArrowRight className="h-3 w-3" />
                          </motion.div>
                        )}
                      </div>
                      
                      {isSelected && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          className="mt-3 pt-3 border-t border-primary/10 flex items-center justify-between text-[10px] text-muted-foreground"
                        >
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-primary" />
                            AI Confidence High
                          </span>
                          <button 
                            className="hover:text-primary transition-colors flex items-center gap-1 font-bold"
                          >
                            View Details <ArrowRight className="h-2.5 w-2.5" />
                          </button>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

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
