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
  file: File | null;
  result: Meeting | null;
}

const steps = [
  { id: "upload", label: "Upload complete", icon: CheckCircle2 },
  { id: "transcribe", label: "Transcribing audio", icon: FileText },
  { id: "speakers", label: "Identifying speakers", icon: Users },
  { id: "tasks", label: "Extracting action items", icon: ListTodo },
  { id: "assign", label: "Assigning tasks", icon: Sparkles },
];

export default function AIProcessingOverlay({ isOpen, onComplete, file, result }: AIProcessingOverlayProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [displayedTranscript, setDisplayedTranscript] = useState<TranscriptSnippet[]>([]);
  const [displayedTasks, setDisplayedTasks] = useState<ExtractedTask[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  // Simulated processing logic
  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      setDisplayedTranscript([]);
      setDisplayedTasks([]);
      setIsFinished(false);
      return;
    }

    if (!result) return;

    const runSimulation = async () => {
      // Step 0: Upload complete (already done)
      await new Promise((r) => setTimeout(r, 800));
      setCurrentStepIndex(1); // Transcribing

      // Step 1: Transcribe - stream transcript
      const transcript = result.transcript || [];
      const transcriptToShow = transcript.slice(0, 8);
      
      for (let i = 0; i < transcriptToShow.length; i++) {
        setDisplayedTranscript((prev) => [...prev, transcriptToShow[i]]);
        await new Promise((r) => setTimeout(r, 600)); // Stream speed
      }

      setCurrentStepIndex(2); // Identifying speakers
      await new Promise((r) => setTimeout(r, 1200));

      setCurrentStepIndex(3); // Extracting tasks
      const tasks = result.extractedTasks || [];
      for (let i = 0; i < tasks.length; i++) {
        setDisplayedTasks((prev) => [...prev, tasks[i]]);
        await new Promise((r) => setTimeout(r, 1000)); // Task appearance speed
      }

      setCurrentStepIndex(4); // Assigning tasks
      await new Promise((r) => setTimeout(r, 1200));

      setCurrentStepIndex(5); // All done
      setIsFinished(true);
      await new Promise((r) => setTimeout(r, 1500));
      onComplete();
    };

    runSimulation();
  }, [isOpen, result, onComplete]);

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
              Transforming your recording into actionable insights using our advanced neural engine.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full mt-4">
            {/* Left: Pipeline Steps */}
            <div className="lg:col-span-3 space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1 mb-4 flex items-center gap-2">
                <div className="h-1 w-4 bg-primary/50 rounded-full" />
                Pipeline Stream
              </h3>
              <div className="space-y-3">
                {steps.map((step, index) => {
                  const isCompleted = currentStepIndex > index;
                  const isActive = currentStepIndex === index;
                  const Icon = step.icon;

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index + 0.4 }}
                      className={`relative flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-500 overflow-hidden ${
                        isActive 
                          ? "bg-primary/10 border-primary/30 shadow-[0_8px_32px_rgba(var(--primary),0.15)] scale-[1.02]" 
                          : isCompleted 
                            ? "bg-muted/40 border-green-500/20" 
                            : "bg-muted/10 border-white/5 opacity-40"
                      }`}
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="active-bg"
                          className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent -z-10"
                        />
                      )}
                      <div className={`shrink-0 p-2 rounded-xl scale-90 ${
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                          : isCompleted 
                            ? "bg-green-500/20 text-green-500" 
                            : "bg-muted text-muted-foreground"
                      }`}>
                        {isActive ? <Loader2 className="h-4 w-4 animate-spin" /> : isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <span className={`text-sm font-semibold tracking-tight ${isActive ? "text-foreground" : "text-muted-foreground/80"}`}>
                        {step.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Middle: Live Transcript */}
            <div className="lg:col-span-5 flex flex-col gap-4">
               <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1 mb-1 flex items-center gap-2">
                  <div className="h-1 w-4 bg-primary/50 rounded-full" />
                  Neural Transcription
               </h3>
               <Card className="flex-1 bg-white/[0.03] backdrop-blur-xl border-white/10 overflow-hidden flex flex-col rounded-3xl relative shadow-2xl">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
                  <CardContent className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[420px] scrollbar-hide pt-8">
                    <AnimatePresence initial={false} mode="popLayout">
                      {displayedTranscript.length === 0 && currentStepIndex <= 1 && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-6 mt-2"
                        >
                           {[1,2,3,4].map(i => (
                             <div key={i} className="animate-pulse flex flex-col gap-3">
                                <div className="h-2 w-16 bg-white/10 rounded-full"></div>
                                <div className="h-12 w-full bg-white/5 rounded-2xl"></div>
                             </div>
                           ))}
                        </motion.div>
                      )}
                      {displayedTranscript.map((snippet, idx) => (
                        <motion.div
                          key={`${snippet.time}-${idx}`}
                          initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" }}
                          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                          className="flex flex-col gap-2 group"
                        >
                          <div className="flex items-center gap-2 pl-1">
                             <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                             <span className="text-[10px] font-bold text-primary tracking-wider uppercase">{snippet.speaker}</span>
                             <span className="text-[9px] text-muted-foreground/60 font-mono">{snippet.time}</span>
                          </div>
                          <p className="text-[13px] leading-relaxed text-foreground/90 bg-white/5 p-4 rounded-2xl border border-white/[0.04] group-hover:border-primary/20 transition-colors">
                            {snippet.text}
                          </p>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <div className="h-10 shrink-0" />
                  </CardContent>
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
               </Card>
            </div>

            {/* Right: Real-time Tasks */}
            <div className="lg:col-span-4 flex flex-col gap-4">
               <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1 mb-1 flex items-center gap-2">
                  <div className="h-1 w-4 bg-primary/50 rounded-full" />
                  Captured Action Items
               </h3>
               <div className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-[420px] scrollbar-hide pr-1 py-1">
                  <AnimatePresence initial={false} mode="popLayout">
                    {displayedTasks.length === 0 && (
                       <motion.div 
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 0.4 }}
                         className="flex flex-col items-center justify-center h-full gap-4 border-2 border-dashed rounded-[2rem] p-10 border-white/5 mt-1"
                       >
                          <div className="p-4 rounded-full bg-muted/20">
                            <ListTodo className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <p className="text-xs text-center font-medium text-muted-foreground">Scanning conversation for<br/>commitments and tasks...</p>
                       </motion.div>
                    )}
                    {displayedTasks.map((task, idx) => (
                      <motion.div
                        key={idx}
                        layout
                        initial={{ opacity: 0, x: 40, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        className="group p-5 rounded-2xl bg-gradient-to-br from-primary/[0.08] to-primary/[0.02] border border-primary/20 shadow-xl backdrop-blur-sm hover:border-primary/40 transition-all duration-300"
                      >
                         <div className="flex items-start justify-between gap-4 mb-3">
                            <p className="text-[13px] font-bold leading-tight group-hover:text-primary transition-colors">{task.title}</p>
                            <Badge variant="outline" className={`text-[9px] h-4 px-1.5 uppercase shrink-0 border-primary/20 bg-primary/5 text-primary`}>
                               {task.priority || "Medium"}
                            </Badge>
                         </div>
                         <div className="flex items-center justify-between mt-4 text-[10px] text-muted-foreground font-semibold">
                            <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-full">
                               <Users className="h-3 w-3 text-primary/70" />
                               <span className="text-foreground/80">{task.assignee || "Everyone"}</span>
                            </div>
                            {task.deadline && (
                              <div className="flex items-center gap-1.5 opacity-70">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>{task.deadline}</span>
                              </div>
                            )}
                         </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
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
