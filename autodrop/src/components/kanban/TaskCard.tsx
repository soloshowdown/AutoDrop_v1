"use client";

import { Task } from "@/lib/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, GripVertical, MoreVertical, Trash2, Edit2, AlertCircle, Sparkles, User, Video, ArrowRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

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
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-start justify-between gap-2 flex-1">
               <div className="font-bold text-sm leading-snug flex-1 group-hover:text-primary transition-colors line-clamp-2">
                 {task.title}
               </div>
               <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 shrink-0 mt-0.5">
                  {!isOverlay && (
                     <DropdownMenu>
                       <DropdownMenuTrigger render={<button className="h-6 w-6 inline-flex items-center justify-center text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors" onClick={(e) => e.stopPropagation()}><MoreVertical className="h-4 w-4" /></button>} />
                       <DropdownMenuContent align="end" className="rounded-xl border-primary/20">
                         <DropdownMenuItem onClick={() => onEdit?.(task)} className="cursor-pointer">
                           <Edit2 className="h-4 w-4 mr-2" /> Edit
                         </DropdownMenuItem>
                         <DropdownMenuItem 
                           onClick={() => onDelete?.(task.id)}
                           className="text-destructive cursor-pointer"
                         >
                           <Trash2 className="h-4 w-4 mr-2" /> Delete
                         </DropdownMenuItem>
                       </DropdownMenuContent>
                     </DropdownMenu>
                  )}
               </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1">
             {task.sourceType === "AI" ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 text-[10px] font-bold border border-purple-500/20 uppercase tracking-wider">
                   <Sparkles className="h-3 w-3" />
                   AI Generated
                </div>
             ) : (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-bold border border-blue-500/20 uppercase tracking-wider">
                   <User className="h-3 w-3" />
                   User Added
                </div>
             )}

             {task.priority && (
               <Badge className={`text-[10px] px-2 py-0 h-4 rounded-full border-transparent font-bold tracking-tight ${priorityColors[task.priority] || ""}`}>
                 {task.priority.toUpperCase()}
               </Badge>
             )}
          </div>

          <div className="flex flex-col gap-2 mt-2">
            {task.meetingTitle && (
              <Link 
                href={`/meetings/${task.meetingId}${task.transcriptTimestamp ? `?t=${task.transcriptTimestamp}` : ""}`}
                className="group/link flex items-center gap-2 text-[10px] text-muted-foreground hover:text-primary transition-colors w-fit bg-muted/30 px-2 py-1 rounded-md"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                 <Video className="h-3 w-3" />
                 <span className="truncate max-w-[120px] font-medium">{task.meetingTitle}</span>
                 <ArrowRight className="h-2.5 w-2.5 opacity-0 group-hover/link:opacity-100 transition-all -translate-x-1 group-hover/link:translate-x-0" />
              </Link>
            )}
          </div>
          
          <div className="flex items-center justify-between gap-2 mt-2 pt-3 border-t border-muted/30">
             <div className="flex items-center gap-1.5 text-xs">
               {task.dueDate && (
                 <div className="flex items-center text-muted-foreground bg-muted/40 hover:bg-muted/60 transition-colors px-2 py-1 rounded-md gap-1.5 group/date">
                   <Calendar className="h-3 w-3 text-muted-foreground" />
                   <span className="text-[10px] font-bold">{task.dueDate}</span>
                 </div>
               )}
             </div>
             
             {task.assignee && (
                <div className="relative shrink-0">
                  <Avatar size="sm" className="h-7 w-7 border-2 border-background shadow-sm hover:scale-110 transition-transform cursor-pointer">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary uppercase">
                      {task.assignee.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500 shadow-sm" />
                </div>
             )}
          </div>
      </CardContent>
    </Card>
  );
}
