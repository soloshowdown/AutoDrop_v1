import { useMemo, useState } from "react";
import { Task, TaskStatus } from "@/lib/types";
import { KanbanColumn } from "./KanbanColumn";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";
import { createPortal } from "react-dom";
import { Plus, Search, Filter, Users, Video as VideoIcon, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const columns: { id: TaskStatus; title: string }[] = [
  { id: "Backlog", title: "Backlog" },
  { id: "To Do", title: "To Do" },
  { id: "In Progress", title: "In Progress" },
  { id: "Done", title: "Done" },
];

interface KanbanBoardProps {
  tasks: Task[];
  onTaskStatusChange?: (taskId: string, status: TaskStatus) => Promise<void> | void;
  onAddTask?: (title: string, status: TaskStatus) => Promise<void> | void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => Promise<void> | void;
}

export function KanbanBoard({ 
  tasks, 
  onTaskStatusChange, 
  onAddTask,
  onEditTask,
  onDeleteTask,
}: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  
  // Filtering state
  const [searchTerm, setSearchTerm] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [meetingFilter, setMeetingFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAssignee = assigneeFilter === "all" || task.assignee === assigneeFilter;
      const matchesMeeting = meetingFilter === "all" || task.meetingTitle === meetingFilter;
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      return matchesSearch && matchesAssignee && matchesMeeting && matchesPriority;
    });
  }, [tasks, searchTerm, assigneeFilter, meetingFilter, priorityFilter]);

  const uniqueAssignees = useMemo(() => {
    const assignees = new Set<string>();
    tasks.forEach(t => t.assignee && assignees.add(t.assignee));
    return Array.from(assignees);
  }, [tasks]);

  const uniqueMeetings = useMemo(() => {
    const meetings = new Set<string>();
    tasks.forEach(t => t.meetingTitle && meetings.add(t.meetingTitle));
    return Array.from(meetings);
  }, [tasks]);

  function getTasksByColumn(columnId: TaskStatus) {
    return filteredTasks.filter((task) => task.status === columnId);
  }

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task);
      return;
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";
    const isOverColumn = over.data.current?.type === "Column";

    if (!isActiveTask) return;

    // Dropping a Task over another Task
    if (isActiveTask && isOverTask) {
      const activeTask = tasks.find((t) => t.id === activeId);
      if (!activeTask) return;

      const targetStatus =
        isOverTask
          ? tasks.find((t) => t.id === overId)?.status
          : isOverColumn
          ? (overId as TaskStatus)
          : undefined;

      if (targetStatus && targetStatus !== activeTask.status) {
        void onTaskStatusChange?.(activeTask.id, targetStatus);
      }

      /* noop: visual movement is handled by server/state refresh */
      return;
    }

    // Dropping a Task over a Column
    if (isActiveTask && isOverColumn) {
      const currentTask = tasks.find((t) => t.id === activeId);
      const newStatus = overId as TaskStatus;
      if (currentTask && currentTask.status !== newStatus) {
        void onTaskStatusChange?.(currentTask.id, newStatus);
      }
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { over } = event;
    if (!over) return;
  }

  const clearFilters = () => {
    setSearchTerm("");
    setAssigneeFilter("all");
    setMeetingFilter("all");
    setPriorityFilter("all");
  };

  const hasActiveFilters = searchTerm || assigneeFilter !== "all" || meetingFilter !== "all" || priorityFilter !== "all";

  return (
    <div className="flex flex-col h-full w-full">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-primary/10 shadow-sm mb-6">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background/50 border-primary/5 focus-visible:ring-primary/20 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={assigneeFilter} onValueChange={(val) => setAssigneeFilter(val || "all")}>
            <SelectTrigger className="w-[140px] bg-background/50 border-primary/5 rounded-xl h-9">
              <Users className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Members</SelectItem>
              {uniqueAssignees.map(name => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={meetingFilter} onValueChange={(val) => setMeetingFilter(val || "all")}>
            <SelectTrigger className="w-[180px] bg-background/50 border-primary/5 rounded-xl h-9">
              <VideoIcon className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Meeting" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Meetings</SelectItem>
              {uniqueMeetings.map(title => (
                <SelectItem key={title} value={title}>{title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val || "all")}>
            <SelectTrigger className="w-[120px] bg-background/50 border-primary/5 rounded-xl h-9">
              <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="text-muted-foreground hover:text-primary transition-colors h-9 px-2 rounded-xl"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
        
        <div className="ml-auto flex items-center gap-2 pr-2">
           <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 rounded-full py-1">
             {filteredTasks.length} Tasks
           </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-8">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-6 min-w-max h-full">
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={getTasksByColumn(col.id)}
                onAddTask={async () => {
                  if (!draftTitle.trim()) return;
                  await onAddTask?.(draftTitle, col.id);
                  setDraftTitle("");
                }}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
              />
            ))}
          </div>

        <div className="fixed bottom-6 right-6 z-20 flex items-center gap-2 bg-background border rounded-lg p-2 shadow-lg">
          <Input
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            placeholder="Quick add task title"
            className="w-56 h-9"
          />
          <Button size="sm" onClick={() => onAddTask?.(draftTitle, "To Do")}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {typeof window !== "undefined" &&
          createPortal(
            <DragOverlay>
              {activeTask && <TaskCard task={activeTask} isOverlay />}
            </DragOverlay>,
            document.body
          )}
        </DndContext>
      </div>
    </div>
  );
}
