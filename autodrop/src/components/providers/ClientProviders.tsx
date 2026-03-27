"use client";

import React from "react";
import { WorkspaceProvider } from "@/lib/contexts/WorkspaceContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      {children}
    </WorkspaceProvider>
  );
}
