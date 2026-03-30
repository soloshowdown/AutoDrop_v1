"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, FileText, Users, ListTodo, Sparkles, Cpu } from "lucide-react";
import Lightning from "@/components/ui/Lightning";
import { Meeting, TranscriptSnippet, ExtractedTask } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AIProcessingOverlayProps {
  isOpen: boolean;
  onComplete: () => void;
  meetingId: string | null;
}

const statusSteps: Record<string, number> = {
  "uploaded": 0,
  "transcribing": 1,
  "transcribed": 2,
  "extracting": 3,
  "completed": 4,
  "failed": -1
};

const steps = [
  { id: "upload", label: "Upload complete", icon: CheckCircle2 },
  { id: "transcribe", label: "Transcribing audio", icon: FileText },
  { id: "transcribed", label: "Transcription ready", icon: FileText }, // Placeholder for 'transcribed'
  { id: "extracting", label: "Extracting action items", icon: ListTodo },
  { id: "assign", label: "Finalizing sync", icon: Sparkles },
];

export default function AIProcessingOverlay({ isOpen, onComplete, meetingId }: AIProcessingOverlayProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !meetingId) return;

    let pollInterval: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/meetings/${meetingId}/status`);
        if (!response.ok) throw new Error("Failed to fetch status");
        
        const data = await response.json();
        const status = data.status;
        
        if (status === "failed") {
          setError("Processing failed. Please try again.");
          clearInterval(pollInterval);
          return;
        }

        const stepIdx = statusSteps[status] ?? 0;
        setCurrentStepIndex(stepIdx);

        if (status === "completed") {
          setIsFinished(true);
          clearInterval(pollInterval);
          setTimeout(() => {
            onComplete();
          }, 2000);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    pollStatus();
    pollInterval = setInterval(pollStatus, 3000);

    return () => clearInterval(pollInterval);
  }, [isOpen, meetingId, onComplete]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-2xl overflow-hidden"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10 opacity-40">
          <Lightning hue={210} intensity={0.6} speed={0.4} />
        </div>

        <div className="container max-w-6xl w-full px-6 flex flex-col items-center gap-10 relative z-10">
          {/* Header Section */}
          <div className="text-center space-y-3">
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.1 
              }}
              className="inline-flex items-center justify-center p-4 rounded-3xl bg-primary/10 border border-primary/20 mb-2 shadow-[0_0_30px_rgba(var(--primary),0.1)]"
            >
              <Cpu className="h-10 w-10 text-primary animate-pulse" />
            </motion.div>
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent"
            >
              AI Processing Experience
            </motion.h2>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground text-lg max-w-2xl mx-auto"
            >
              {error ? <span className="text-destructive">{error}</span> : "Transforming your recording into actionable insights using our advanced neural engine."}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full mt-4">
            {/* Left: Pipeline Steps */}
            <div className="lg:col-span-12 max-w-4xl mx-auto w-full">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {steps.map((step, index) => {
                  const isCompleted = currentStepIndex > index;
                  const isActive = currentStepIndex === index;
                  const Icon = step.icon;

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index + 0.4 }}
                      className={`relative flex flex-col items-center gap-3 p-6 rounded-3xl border transition-all duration-500 overflow-hidden ${
                        isActive 
                          ? "bg-primary/10 border-primary/30 shadow-[0_8px_32px_rgba(var(--primary),0.15)] scale-[1.05]" 
                          : isCompleted 
                            ? "bg-muted/40 border-green-500/20" 
                            : "bg-muted/10 border-white/5 opacity-40"
                      }`}
                    >
                      <div className={`shrink-0 p-3 rounded-2xl ${
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                          : isCompleted 
                            ? "bg-green-500/20 text-green-500" 
                            : "bg-muted text-muted-foreground"
                      }`}>
                        {isActive ? <Loader2 className="h-6 w-6 animate-spin" /> : isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                      </div>
                      <span className={`text-xs font-bold tracking-tight text-center ${isActive ? "text-foreground" : "text-muted-foreground/80"}`}>
                        {step.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Success Banner */}
          <AnimatePresence>
            {isFinished && (
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="bg-primary text-primary-foreground px-10 py-5 rounded-[2rem] flex items-center gap-6 shadow-[0_20px_50px_rgba(var(--primary),0.4)] border border-white/20 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" style={{ animation: 'shimmer 2s infinite' }} />
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-black tracking-tight uppercase">Intelligence Synchronized</h4>
                  <p className="text-sm font-medium opacity-80">Finalizing workspace synchronization...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <style jsx global>{`
          @keyframes shimmer {
            100% {
              transform: translateX(100%);
            }
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}
