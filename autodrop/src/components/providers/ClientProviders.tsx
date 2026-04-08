"use client";

import React from "react";
import { WorkspaceProvider } from "@/lib/contexts/WorkspaceContext";
import { MeetingProvider } from "@/lib/contexts/MeetingContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <MeetingProvider>
        {children}
      </MeetingProvider>
    </WorkspaceProvider>
  );
}
