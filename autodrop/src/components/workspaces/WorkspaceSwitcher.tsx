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

import { useWorkspace } from "@/lib/contexts/WorkspaceContext";

export function WorkspaceSwitcher() {
  const { currentWorkspace, workspaces, switchWorkspace } = useWorkspace();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateWorkspace = async () => {
    const name = prompt("Enter workspace name:");
    if (!name || name.trim() === "") return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/workspace/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        window.location.reload(); // Simplest way to refresh workspaces for now
      } else {
        alert("Failed to create workspace");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!currentWorkspace) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        nativeButton={false}
        render={
          <div className="flex h-12 w-full items-center justify-between gap-2 px-3 hover:bg-muted/60 transition-colors cursor-pointer rounded-lg outline-none">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white font-bold bg-primary")}>
                {currentWorkspace.name.substring(0, 1).toUpperCase()}
              </div>
              <div className="flex flex-col items-start overflow-hidden text-left leading-tight">
                <span className="truncate text-sm font-semibold">{currentWorkspace.name}</span>
                <span className="truncate text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                  {currentWorkspace.role || "Admin"}
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
            onClick={() => switchWorkspace(ws.id)}
            className="flex items-center justify-between py-2.5 px-3 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold text-sm bg-muted-foreground")}>
                {ws.name.substring(0, 1).toUpperCase()}
              </div>
              <span className={cn("text-sm", currentWorkspace.id === ws.id ? "font-bold" : "font-medium")}>
                {ws.name}
              </span>
            </div>
            {currentWorkspace.id === ws.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="py-2.5 px-3 cursor-pointer text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
          onClick={handleCreateWorkspace}
          disabled={isCreating}
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="text-sm font-semibold">
            {isCreating ? "Creating..." : "Create Workspace"}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
