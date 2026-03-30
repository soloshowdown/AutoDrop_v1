"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Check, X, Loader2, Mail, ArrowLeft, Inbox } from "lucide-react";
import { fetchPendingInvites, respondToInvite } from "@/lib/services/workspaceService";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export default function InvitesPage() {
  const { user } = useUser();
  const router = useRouter();
  const [invites, setInvites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.emailAddresses?.[0]?.emailAddress) return;

    async function loadInvites() {
      try {
        const rawEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress;
        if (!rawEmail) return;
        const email = rawEmail.trim().toLowerCase();
        const data = await fetchPendingInvites(email);
        setInvites(data);
      } catch (error) {
        console.error("Error loading invites:", error);
        toast.error("Failed to load invitations. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    }


    loadInvites();
  }, [user]);

  const handleRespond = async (inviteId: string, status: "accepted" | "rejected") => {
    if (!user) return;
    setProcessingId(inviteId);
    try {
      await respondToInvite(inviteId, status, user.id);
      toast.success(`Invitation ${status === "accepted" ? "accepted" : "declined"}.`);
      setInvites(invites.filter((i) => i.id !== inviteId));
      if (status === "accepted") {
        // Refresh to dashboard
        window.location.href = "/dashboard";
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update invitation");
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse uppercase tracking-[0.2em]">Checking your inbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/5 via-background to-background">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-12">
          <Link href="/onboarding">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Onboarding
            </Button>
          </Link>
          <div className="flex items-center gap-2 bg-muted/30 px-4 py-2 rounded-full border border-muted">
            <Mail className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-bold uppercase tracking-widest">{user?.emailAddresses[0].emailAddress}</span>
          </div>
        </div>

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-5 mb-6 rounded-3xl bg-blue-500/10 border border-blue-500/20 shadow-2xl shadow-blue-500/10">
            <Inbox className="w-10 h-10 text-blue-500" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter mb-4">Your Invite Inbox</h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
            Manage invitations to join existing workspaces and start collaborating.
          </p>
        </div>

        {invites.length > 0 ? (
          <div className="grid gap-6">
            {invites.map((invite) => (
              <Card key={invite.id} className="group relative border-none bg-background/50 backdrop-blur-xl shadow-2xl shadow-black/[0.02] hover:shadow-primary/5 transition-all duration-500 overflow-hidden ring-1 ring-white/5">
                <div className="absolute inset-y-0 left-0 w-1.5 bg-blue-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-center duration-500" />
                <CardHeader className="flex flex-row items-center gap-6 p-8">
                  <div className="p-5 rounded-2xl bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                    <Users className="w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/70">New Invitation</span>
                       <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    </div>
                    <CardTitle className="text-2xl font-black truncate">{invite.workspaces?.name}</CardTitle>
                    <CardDescription className="text-base font-medium mt-1">Invited to join as <span className="text-foreground font-bold underline decoration-blue-500/30 underline-offset-4">{invite.role}</span></CardDescription>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => handleRespond(invite.id, "rejected")}
                      disabled={!!processingId}
                      className="h-14 w-14 rounded-2xl border-muted hover:bg-destructive/5 hover:border-destructive/20 hover:text-destructive transition-all duration-300"
                    >
                      <X className="h-6 w-6" />
                    </Button>
                    <Button 
                      onClick={() => handleRespond(invite.id, "accepted")}
                      disabled={!!processingId}
                      className="h-14 px-8 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 gap-2 font-bold"
                    >
                      {processingId === invite.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                      Accept
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-24 text-center border-4 border-dashed rounded-[40px] bg-muted/5 opacity-50 relative group overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
             <div className="p-8 rounded-full bg-muted/20 mb-6 group-hover:scale-110 transition-transform duration-1000">
               <Mail className="w-12 h-12 text-muted-foreground/30" />
             </div>
             <p className="text-2xl font-black tracking-tight text-muted-foreground/80 mb-2">No pending invitations</p>
             <p className="text-muted-foreground max-w-[280px]">When someone invites you to their workspace, it will appear here.</p>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-muted/30 flex flex-col items-center gap-2">
           <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Debug Presence</p>
           <p className="text-[10px] text-muted-foreground/60 font-mono bg-muted/20 px-3 py-1.5 rounded-full border border-muted/40">
             Checking for invitations sent to: <span className="text-primary font-bold">{user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress}</span>
           </p>
           <p className="text-[9px] text-muted-foreground/40 text-center max-w-sm">
             Note: Invitations are case-insensitive. If you don't see an invite, ensure the sender used this exact email address.
           </p>
        </div>
      </div>
    </div>
  );
}
