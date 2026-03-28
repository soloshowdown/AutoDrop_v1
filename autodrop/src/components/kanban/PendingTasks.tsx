"use client";

import React, { useEffect, useState } from "react";
import { Task } from "@/lib/types";
import { fetchPendingTasks, approveTask, deleteTask } from "@/lib/services/taskService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Trash2, Edit2, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface PendingTasksProps {
  workspaceId: string;
  onTaskApproved: () => void;
  onEditTask: (task: Task) => void;
}

export function PendingTasks({ workspaceId, onTaskApproved, onEditTask }: PendingTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadPendingTasks = async () => {
    try {
      const pending = await fetchPendingTasks(workspaceId);
      setTasks(pending);
    } catch (error) {
      console.error("Error loading pending tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingTasks();
    // Poll every 5 seconds for new AI tasks
    const interval = setInterval(loadPendingTasks, 5000);
    return () => clearInterval(interval);
  }, [workspaceId]);

  const handleApprove = async (taskId: string) => {
    setProcessingId(taskId);
    try {
      await approveTask(taskId);
      toast.success("Task approved and added to Kanban.");
      setTasks(tasks.filter(t => t.id !== taskId));
      onTaskApproved();
    } catch (error) {
      toast.error("Failed to approve task.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Delete this pending task?")) return;
    setProcessingId(taskId);
    try {
      await deleteTask(taskId);
      toast.success("Task deleted.");
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error) {
      toast.error("Failed to delete task.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && tasks.length === 0) {
    return <div className="p-8 text-center animate-pulse">Scanning for new AI tasks...</div>;
  }

  if (tasks.length === 0) return null;

  return (
    <div className="mb-10 space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
            Pending AI Tasks
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-full font-bold">
              {tasks.length} New
            </Badge>
          </h2>
          <p className="text-sm text-muted-foreground font-medium">Review and approve tasks generated from your meetings.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tasks.map((task) => (
          <Card key={task.id} className="group relative border-none bg-background/50 backdrop-blur-xl shadow-2xl shadow-black/[0.02] hover:shadow-amber-500/5 transition-all duration-500 overflow-hidden ring-1 ring-white/5">
            <div className="absolute inset-x-0 top-0 h-1 bg-amber-500/50 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-700" />
            <CardHeader className="p-5 pb-2">
              <div className="flex justify-between items-start gap-2 mb-2">
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-amber-500/20 text-amber-600 bg-amber-500/5">
                  Needs Review
                </Badge>
                {task.meetingTitle && (
                  <span className="text-[9px] font-bold text-muted-foreground/60 truncate max-w-[120px]">
                     {task.meetingTitle}
                  </span>
                )}
              </div>
              <CardTitle className="text-base font-bold leading-snug group-hover:text-amber-600 transition-colors">
                {task.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
               <div className="flex items-center gap-2 mt-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">AI Extraction</span>
               </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onEditTask(task)}
                className="h-9 w-9 p-0 rounded-xl hover:bg-muted/50"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleDelete(task.id)}
                className="h-9 w-9 p-0 rounded-xl hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button 
                onClick={() => handleApprove(task.id)}
                disabled={!!processingId}
                className="flex-1 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20 transition-all gap-2 text-xs font-bold"
              >
                {processingId === task.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Approve
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
