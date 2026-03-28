"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Workspace, fetchUserWorkspaces, fetchPendingInvitesCount } from "@/lib/services/workspaceService";

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  pendingInvitesCount: number;
  isLoading: boolean;
  switchWorkspace: (workspaceId: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    async function loadWorkspaces() {
      if (!isLoaded || !user) {
        if (isLoaded && !user) setIsLoading(false);
        return;
      }

      try {
        let ws: Workspace[] = [];
        try {
          ws = await fetchUserWorkspaces(user.id);
        } catch (err) {
          console.error("fetchUserWorkspaces error:", err);
          ws = [];
        }

        // If user has no workspace, we'll redirect to onboarding
        if (ws.length === 0) {
          const isInvitePage = typeof window !== "undefined" && window.location.pathname === "/invites";
          const isOnboardingPage = typeof window !== "undefined" && window.location.pathname === "/onboarding";
          
          if (typeof window !== "undefined" && !isOnboardingPage && !isInvitePage) {
            window.location.href = "/onboarding";
            return;
          }
        }

        // 2. Fetch pending invites count
        const email = user.emailAddresses[0].emailAddress;
        if (email) {
          const count = await fetchPendingInvitesCount(email);
          setPendingInvitesCount(count);
        }

        setWorkspaces(ws);

        if (typeof window !== "undefined") {
          const lastWsId = localStorage.getItem("autodrop_last_workspace_id");
          let found = ws.find((w) => w.id === lastWsId);
          
          if (!found) {
            // Prioritize workspaces where the user is a member (invited) over personal ones
            found = ws.find((w) => w.created_by !== user.id) || ws[0];
          }
          
          setCurrentWorkspace(found || null);
        } else {
          setCurrentWorkspace(ws[0] || null);
        }
      } catch (error) {
        console.error("Global WorkspaceProvider error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadWorkspaces();
  }, [user, isLoaded]);

  const switchWorkspace = (workspaceId: string) => {
    const ws = workspaces.find(w => w.id === workspaceId);
    if (ws) {
      localStorage.setItem("autodrop_last_workspace_id", workspaceId);
      // Clean refresh to ensure all hooks and states reset with the new workspace context
      window.location.href = "/dashboard";
    }
  };

  if (!isMounted) return null;

  return (
    <WorkspaceContext.Provider value={{ currentWorkspace, workspaces, pendingInvitesCount, isLoading, switchWorkspace }}>
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
