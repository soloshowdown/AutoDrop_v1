import React from "react";
import { ClientProviders } from "@/components/providers/ClientProviders";

export default function InvitesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientProviders>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </ClientProviders>
  );
}
