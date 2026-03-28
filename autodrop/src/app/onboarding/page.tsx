"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, Users, ArrowRight, Loader2, Sparkles, LogIn } from "lucide-react";
import { createWorkspace } from "@/lib/services/workspaceService";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [step, setStep] = useState<"choice" | "create">("choice");

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !workspaceName.trim()) return;

    setIsCreating(true);
    try {
      const workspace = await createWorkspace(workspaceName, user.id);
      if (workspace) {
        toast.success("Workspace created successfully!");
        // Refresh to trigger WorkspaceContext update
        window.location.href = "/dashboard";
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create workspace");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background overflow-hidden relative">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse delay-700" />
      
      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 mb-4 rounded-2xl bg-primary/10 border border-primary/20 shadow-xl shadow-primary/5">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Welcome to AutoDrop
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {user?.firstName ? `Hey ${user.firstName}, l` : "L"}et&apos;s get you set up with a workspace.
          </p>
        </div>

        {step === "choice" ? (
          <div className="grid gap-4">
            <Card 
              className="group cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 border-muted bg-background/50 backdrop-blur-sm overflow-hidden relative"
              onClick={() => setStep("create")}
            >
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary to-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-4 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                  <Rocket className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">Create Workspace</CardTitle>
                  <CardDescription>Start fresh and invite your team later.</CardDescription>
                </div>
                <ArrowRight className="ml-auto w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1" />
              </CardHeader>
            </Card>

            <Link href="/invites" className="block">
              <Card className="group cursor-pointer hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/5 border-muted bg-background/50 backdrop-blur-sm overflow-hidden relative">
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="p-4 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Join via Invite</CardTitle>
                    <CardDescription>Check for pending invitations to join a team.</CardDescription>
                  </div>
                  <ArrowRight className="ml-auto w-5 h-5 text-muted-foreground group-hover:text-blue-500 transition-colors group-hover:translate-x-1" />
                </CardHeader>
              </Card>
            </Link>
          </div>
        ) : (
          <Card className="border-muted bg-background/50 backdrop-blur-lg shadow-2xl border-none ring-1 ring-white/10 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-blue-500 to-indigo-500" />
            <form onSubmit={handleCreateWorkspace}>
              <CardHeader>
                <CardTitle className="text-2xl">Create your workspace</CardTitle>
                <CardDescription>Give your space a name. You can change this later.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Input
                    placeholder="e.g. Acme Tech, Product Team"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="h-12 bg-muted/30 border-muted focus:ring-primary/20 transition-all text-lg"
                    autoFocus
                    required
                  />
                  <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/50 px-1">Suggested: {user?.firstName || "My"}&apos;s Team</p>
                </div>
              </CardContent>
              <CardFooter className="flex gap-3 pt-6 pb-8">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setStep("choice")}
                  disabled={isCreating}
                  className="px-6 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={isCreating || !workspaceName.trim()}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-600 hover:shadow-lg hover:shadow-primary/20 transition-all text-lg font-bold"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Launching...
                    </>
                  ) : (
                    <>
                      Create & Continue
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        <div className="mt-8 text-center">
           <p className="text-xs text-muted-foreground italic font-medium opacity-60">
             &ldquo;Meeting intelligence delivered, tasks automated.&rdquo;
           </p>
        </div>
      </div>
    </div>
  );
}
