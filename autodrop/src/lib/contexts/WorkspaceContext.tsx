"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Workspace, fetchUserWorkspaces } from "@/lib/services/workspaceService";

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  switchWorkspace: (workspaceId: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadWorkspaces() {
      if (!isLoaded || !user) {
        setIsLoading(false);
        return;
      }

      try {
        let ws = await fetchUserWorkspaces(user.id);

        // If user has no workspace, create a default one via the server API (bypasses RLS)
        if (ws.length === 0) {
          const res = await fetch("/api/workspace/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: `${user.firstName || "My"}'s Workspace` }),
          });
          if (res.ok) {
            const defaultWs: Workspace = await res.json();
            ws = [defaultWs];
          } else {
            console.error("Failed to auto-create workspace:", await res.text());
          }
        }

        setWorkspaces(ws);

        const lastWsId = localStorage.getItem("autodrop_last_workspace_id");
        const found = ws.find((w) => w.id === lastWsId) || ws[0];
        setCurrentWorkspace(found || null);
      } catch (error) {
        console.error("Failed to load workspaces:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadWorkspaces();
  }, [user, isLoaded]);

  const switchWorkspace = (workspaceId: string) => {
    const ws = workspaces.find(w => w.id === workspaceId);
    if (ws) {
      setCurrentWorkspace(ws);
      localStorage.setItem("autodrop_last_workspace_id", workspaceId);
    }
  };

  return (
    <WorkspaceContext.Provider value={{ currentWorkspace, workspaces, isLoading, switchWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
