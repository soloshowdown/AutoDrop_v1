"use client";

import { Task } from "@/lib/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, GripVertical, MoreVertical, Trash2, Edit2, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TaskCardProps {
  task: Task;
  isOverlay?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

export function TaskCard({ task, isOverlay, onEdit, onDelete }: TaskCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <Card
        ref={setNodeRef}
        style={style}
        className="border-2 border-primary/50 opacity-50 bg-primary/10 h-[120px] shadow-none"
      />
    );
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`relative group cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors shadow-sm ${
        isOverlay ? "rotate-2 scale-105 shadow-xl border-primary" : ""
      } ${task.priority === "high" ? "border-l-4 border-l-red-500" : ""}`}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-4 flex flex-col gap-3">
         <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-sm leading-snug flex-1">{task.title}</p>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 shrink-0 mt-0.5">
               {!isOverlay && (
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit?.(task)}>
                        <Edit2 className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete?.(task.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
               )}
            </div>
         </div>

         {task.priority && (
           <div className="flex items-center gap-1">
             {task.priority === "high" && <AlertCircle className="h-3 w-3 text-red-500" />}
             <Badge className={`text-[10px] px-1.5 py-0 h-4 ${priorityColors[task.priority] || ""}`}>
               {task.priority.toUpperCase()}
             </Badge>
           </div>
         )}
         
         <div className="flex items-center justify-between gap-2 mt-auto pt-2">
            <div className="flex items-center gap-1.5 text-xs">
              {task.dueDate && (
                <div className="flex items-center text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded-sm gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{task.dueDate}</span>
                </div>
              )}
            </div>
            
            {task.assignee && (
               <div 
                 className="h-6 w-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-semibold text-primary flex-shrink-0" 
                 title={task.assignee}
               >
                  {task.assignee.substring(0, 2).toUpperCase()}
               </div>
            )}
         </div>
      </CardContent>
    </Card>
  );
}
