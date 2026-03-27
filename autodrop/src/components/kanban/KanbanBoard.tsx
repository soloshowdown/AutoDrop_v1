"use client";

import { useState } from "react";
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
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

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

  function getTasksByColumn(columnId: TaskStatus) {
    return tasks.filter((task) => task.status === columnId);
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

  return (
    <div className="flex h-full w-full overflow-x-auto overflow-y-hidden pt-4 pb-8">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-6 mx-auto w-full min-w-max">
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
  );
}
