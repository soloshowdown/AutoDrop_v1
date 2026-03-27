"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const workspaces = [
  {
    id: "ws-1",
    name: "AutoDrop Corp",
    role: "Admin",
    color: "bg-blue-600",
  },
  {
    id: "ws-2",
    name: "Design Team",
    role: "Member",
    color: "bg-purple-600",
  },
  {
    id: "ws-3",
    name: "Marketing",
    role: "Member",
    color: "bg-orange-600",
  },
];

export function WorkspaceSwitcher() {
  const [activeWorkspace, setActiveWorkspace] = useState(workspaces[0]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        nativeButton={false}
        render={
          <div className="flex h-12 w-full items-center justify-between gap-2 px-3 hover:bg-muted/60 transition-colors cursor-pointer rounded-lg outline-none">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white font-bold", activeWorkspace.color)}>
                {activeWorkspace.name.substring(0, 1)}
              </div>
              <div className="flex flex-col items-start overflow-hidden text-left leading-tight">
                <span className="truncate text-sm font-semibold">{activeWorkspace.name}</span>
                <span className="truncate text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                  {activeWorkspace.role}
                </span>
              </div>
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
        }
      />
      <DropdownMenuContent className="w-64" align="start" sideOffset={10}>
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2">
          Workspaces
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onClick={() => setActiveWorkspace(ws)}
            className="flex items-center justify-between py-2.5 px-3 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold text-sm", ws.color)}>
                {ws.name.substring(0, 1)}
              </div>
              <span className={cn("text-sm", activeWorkspace.id === ws.id ? "font-bold" : "font-medium")}>
                {ws.name}
              </span>
            </div>
            {activeWorkspace.id === ws.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="py-2.5 px-3 cursor-pointer text-primary bg-primary/5 hover:bg-primary/10 transition-colors">
          <Plus className="mr-2 h-4 w-4" />
          <span className="text-sm font-semibold">Create Workspace</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
