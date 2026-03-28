"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/contexts/WorkspaceContext";
import { createLiveMeeting, fetchMeetingByRoomId, setMeetingStatus } from "@/lib/services/meetingService";
import { Task, TranscriptSnippet } from "@/lib/types";
import { Mic, MicOff, Video, StopCircle, Loader2, Zap, Check } from "lucide-react";

export default function LiveMeetingPage() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const [roomId, setRoomId] = useState("");
  const [joinedRoomId, setJoinedRoomId] = useState("");
  const [liveMeetingId, setLiveMeetingId] = useState<string | null>(null);
  const [liveMeeting, setLiveMeeting] = useState<any | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<TranscriptSnippet[]>([]);
  const [liveTasks, setLiveTasks] = useState<Task[]>([]);
  const [isProcessingChunk, setIsProcessingChunk] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [userName, setUserName] = useState("AutoDrop User");
  const [isRecording, setIsRecording] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasJoinedFromQueryRef = useRef(false);
  const zegoRef = useRef<any>(null);

  // Web Speech API Ref
  const recognitionRef = useRef<any>(null);
  const transcriptBufferRef = useRef<string>("");
  const lastProcessedTimeRef = useRef<number>(Date.now());

  const [interimTranscript, setInterimTranscript] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (currentWorkspace) {
      setIsAdmin(currentWorkspace.role === 'admin');
    }
  }, [currentWorkspace]);

  const loadWorkspaceData = useCallback(async () => {
    if (!joinedRoomId || !currentWorkspace?.id) return;
    
    // 1. Sync meeting
    const { fetchMeetingByRoomId } = await import("@/lib/services/meetingService");
    const meeting = await fetchMeetingByRoomId(joinedRoomId);
    if (meeting) {
      setLiveMeeting(meeting);
      setLiveMeetingId(meeting.id);
    }

    // 2. Fetch pending tasks for this meeting
    const { fetchPendingTasks } = await import("@/lib/services/taskService");
    const pending = await fetchPendingTasks(currentWorkspace.id);
    const meetingTasks = meeting 
      ? pending.filter(t => t.meetingId === meeting.id)
      : pending;
    
    setLiveTasks(meetingTasks);
  }, [joinedRoomId, currentWorkspace?.id]);

  useEffect(() => {
    if (!joinedRoomId) return;
    void loadWorkspaceData();
    const interval = setInterval(loadWorkspaceData, 4000);
    return () => clearInterval(interval);
  }, [joinedRoomId, loadWorkspaceData]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      zegoRef.current = null;
    };
  }, []);

  const handleCreateRoom = () => {
    const generatedRoomId = `room-${Date.now()}`;
    setRoomId(generatedRoomId);
    void handleJoin(generatedRoomId);
  };

  const handleJoin = useCallback(async (roomToJoin?: string) => {
    const finalRoomId = (roomToJoin ?? roomId).trim();
    if (!finalRoomId || !containerRef.current) return;

    try {
      setIsJoining(true);
      const fullName = userName.trim() || "AutoDrop User";
      const workspaceInfo = currentWorkspace?.name ? `(${currentWorkspace.name})` : "";
      const finalUserName = `${fullName} ${workspaceInfo}`.trim();
      const userId = `user_${Date.now()}`;

      const response = await fetch("/api/zegocloud/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: finalRoomId,
          userId,
          userName: finalUserName,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        token?: string;
        appId?: number;
        error?: string;
      };
      if (!response.ok || !payload.token || !payload.appId) {
        throw new Error(payload.error || "Unable to fetch meeting token");
      }

      const ZegoUIKitPrebuiltModule = await import("@zegocloud/zego-uikit-prebuilt");
      const ZegoUIKitPrebuilt =
        ZegoUIKitPrebuiltModule.ZegoUIKitPrebuilt || ZegoUIKitPrebuiltModule.default;

      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
        payload.appId,
        payload.token,
        finalRoomId,
        userId,
        finalUserName
      );

      containerRef.current.innerHTML = "";
      const zego = ZegoUIKitPrebuilt.create(kitToken);
      zegoRef.current = zego;
      zego.joinRoom({
        container: containerRef.current,
        sharedLinks: [
          {
            name: "Join Room",
            url: `${window.location.origin}/meetings/live?room=${encodeURIComponent(finalRoomId)}`,
          },
        ],
        scenario: { mode: ZegoUIKitPrebuilt.GroupCall },
        turnOnCameraWhenJoining: true,
        turnOnMicrophoneWhenJoining: true,
        showMyCameraToggleButton: true,
        showMyMicrophoneToggleButton: true,
        showAudioVideoSettingsButton: true,
        showScreenSharingButton: true,
      });

      setJoinedRoomId(finalRoomId);
      if (currentWorkspace?.id) {
        const meeting = await createLiveMeeting(currentWorkspace.id, finalRoomId, `${finalUserName}'s meeting`);
        if (meeting?.id) {
          setLiveMeetingId(meeting.id);
        }
      }
      router.replace(`/meetings/live?room=${encodeURIComponent(finalRoomId)}`);
      toast.success(`Joined room ${finalRoomId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to join meeting");
    } finally {
      setIsJoining(false);
    }
  }, [roomId, router, userName, currentWorkspace?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const roomFromQuery = params.get("room");

    if (roomFromQuery && !hasJoinedFromQueryRef.current) {
      hasJoinedFromQueryRef.current = true;
      setRoomId(roomFromQuery);
      void handleJoin(roomFromQuery);
    }
  }, [handleJoin]);

  const processTextChunk = async (text: string) => {
    if (!currentWorkspace?.id || !liveMeetingId || !text.trim()) {
      return;
    }

    setIsProcessingChunk(true);
    const timestamp = new Date().toISOString();

    try {
      const response = await fetch("/api/meetings/live/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: currentWorkspace.id,
          meetingId: liveMeetingId,
          speaker: userName.trim() || "Speaker",
          text: text,
          time: timestamp,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Task extraction failed");
      }

      if (payload.transcript) {
        setLiveTranscript((prev) => [...prev, payload.transcript]);
      }

      if (Array.isArray(payload.tasks) && payload.tasks.length > 0) {
        await loadWorkspaceData();
        toast.success(`Extracted ${payload.tasks.length} new insight(s)!`, {
          icon: "⚡",
        });
      }
    } catch (error) {
      console.error("Live extract error:", error);
      // Don't toast for everything in real-time to avoid spam
    } finally {
      setIsProcessingChunk(false);
    }
  };

  const handleStartRecording = () => {
    if (!joinedRoomId) {
      toast.error("Join a room before starting live capture.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Your browser does not support Web Speech API. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const finalPart = event.results[i][0].transcript;
          transcriptBufferRef.current += " " + finalPart;
          setInterimTranscript("");
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInterimTranscript(interim);

      // Throttle: Send buffer every 15 seconds or if it gets too long
      const now = Date.now();
      if (now - lastProcessedTimeRef.current > 15000 && transcriptBufferRef.current.trim().length > 20) {
        const textToProcess = transcriptBufferRef.current.trim();
        transcriptBufferRef.current = "";
        lastProcessedTimeRef.current = now;
        void processTextChunk(textToProcess);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast.error("Microphone access denied.");
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      if (isRecording) {
        // Automatically restart if it was ended by the browser (not by user)
        recognition.start();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    toast.success("Live AI Capture started. Proccessing speech in 15s windows.", {
      icon: <Mic className="h-4 w-4 text-emerald-500" />,
    });
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    // Flush remaining buffer
    if (transcriptBufferRef.current.trim()) {
      void processTextChunk(transcriptBufferRef.current.trim());
      transcriptBufferRef.current = "";
    }
    
    toast.info("Live capture stopped.");
  };

  const handleEndLiveMeeting = async () => {
    if (!liveMeetingId) {
      toast.error("No active live meeting to end.");
      return;
    }

    setIsEnding(true);
    try {
      handleStopRecording();

      const result = await setMeetingStatus(liveMeetingId, "completed", "Live session ended");
      if (!result) {
        throw new Error("Failed to finalize live meeting");
      }

      toast.success("Live meeting saved successfully.");
      setLiveMeetingId(null);
      setLiveTranscript([]);
      setLiveTasks([]);
      router.push("/meetings");
    } catch (error) {
      console.error("Failed to end live meeting:", error);
      toast.error(error instanceof Error ? error.message : "Could not end live meeting");
    } finally {
      setIsEnding(false);
    }
  };

  const handleApproveLiveTask = async (taskId: string) => {
    const { approveTask } = await import("@/lib/services/taskService");
    try {
      await approveTask(taskId);
      toast.success("Task sent to Kanban!");
      setLiveTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      toast.error("Failed to approve task");
    }
  };

  const handleDeleteLiveTask = async (taskId: string) => {
    const { deleteTask } = await import("@/lib/services/taskService");
    try {
      await deleteTask(taskId);
      setLiveTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            Live Meeting
            {isRecording && <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
          </h1>
          <p className="text-muted-foreground font-medium">Capture intelligence in real-time.</p>
        </div>
        <div className="flex items-center gap-2">
          {!isRecording ? (
            <Button 
              onClick={handleStartRecording} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl h-11 px-6 shadow-lg shadow-emerald-500/20"
              disabled={!joinedRoomId}
            >
              <Mic className="mr-2 h-4 w-4" />
              Start AI Capture
            </Button>
          ) : (
            <Button 
              onClick={handleStopRecording} 
              variant="outline"
              className="border-red-500/50 text-red-600 font-bold rounded-2xl h-11 px-6 hover:bg-red-50"
            >
              <MicOff className="mr-2 h-4 w-4" />
              Stop AI Capture
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={handleEndLiveMeeting}
            disabled={isEnding || !liveMeetingId}
            className="rounded-2xl h-11 px-6 font-bold text-muted-foreground hover:bg-red-500/10 hover:text-red-600"
          >
            {isEnding ? <Loader2 className="h-4 w-4 animate-spin" /> : <StopCircle className="mr-2 h-4 w-4" />}
            End Meeting
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto_auto] items-end bg-white/5 border rounded-3xl p-4 shadow-sm">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Room ID</label>
          <Input
            placeholder="e.g. strategy-q2"
            value={roomId}
            onChange={(event) => setRoomId(event.target.value)}
            className="rounded-xl border-white/10 bg-black/5"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Your Name</label>
          <Input
            placeholder="Display name"
            value={userName}
            onChange={(event) => setUserName(event.target.value)}
            className="rounded-xl border-white/10 bg-black/5"
          />
        </div>
        <Button onClick={() => void handleJoin()} disabled={!roomId.trim() || isJoining} className="rounded-xl h-10 px-8 font-bold">
          {isJoining ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join"}
        </Button>
        <Button variant="outline" onClick={handleCreateRoom} disabled={isJoining} className="rounded-xl h-10 px-6 font-bold border-white/10">
          Create New
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
        <div className="space-y-4">
           <div 
             ref={containerRef} 
             className="w-full h-[60vh] rounded-[2.5rem] border bg-slate-950 overflow-hidden shadow-2xl shadow-primary/5 ring-1 ring-white/10" 
           />
           
           <div className="rounded-[2.5rem] border bg-white/5 p-8 shadow-sm">
             <div className="flex items-center justify-between mb-6">
               <div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 mb-1">Live Feed</p>
                 <h2 className="text-xl font-bold tracking-tight">Transcription Buffer</h2>
               </div>
               <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  {isProcessingChunk && <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />}
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{liveTranscript.length} Segments</span>
               </div>
             </div>
             <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 scrollbar-hide">
               {interimTranscript && (
                 <div className="rounded-[1.5rem] border border-primary/20 bg-primary/5 p-6 animate-pulse">
                    <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-widest text-primary/70">
                      <Zap className="h-3 w-3" /> Capturing...
                    </div>
                    <p className="text-sm italic text-foreground/70">{interimTranscript}</p>
                 </div>
               )}

               {liveTranscript.length === 0 && !interimTranscript ? (
                 <div className="rounded-[2rem] border-2 border-dashed border-white/5 bg-black/5 p-12 text-center">
                   <div className="p-4 bg-white/5 rounded-2xl w-fit mx-auto mb-4">
                      <Mic className="h-6 w-6 text-muted-foreground/30" />
                   </div>
                   <p className="text-sm font-bold text-muted-foreground/40 uppercase tracking-widest">Awaiting audio input...</p>
                   <p className="text-xs text-muted-foreground/30 mt-2 italic">Start AI Capture to begin real-time extraction.</p>
                 </div>
               ) : (
                 [...liveTranscript].reverse().map((snippet, index) => (
                   <div key={`${snippet.time}-${index}`} className="group relative rounded-[1.5rem] border border-white/5 bg-background/50 p-6 hover:bg-white/[0.02] transition-colors">
                     <div className="absolute left-0 top-6 w-1 h-8 bg-primary rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
                     <div className="flex items-center justify-between gap-3 mb-3 text-[10px] font-black uppercase tracking-widest opacity-40">
                       <span className="flex items-center gap-2 text-primary"><Mic className="h-3 w-3" /> {snippet.speaker}</span>
                       <span>{new Date(snippet.time).toLocaleTimeString()}</span>
                     </div>
                     <p className="text-sm leading-relaxed font-medium text-foreground/90">{snippet.text}</p>
                   </div>
                 ))
               )}
             </div>
           </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2.5rem] border bg-white/5 p-8 shadow-sm h-full">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 mb-1">AI Insights</p>
                <h2 className="text-xl font-bold tracking-tight">Pending Tasks</h2>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                 <Zap className="h-5 w-5 text-primary" />
              </div>
            </div>
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
              {liveTasks.length === 0 ? (
                <div className="rounded-[2rem] border-2 border-dashed border-white/5 bg-black/5 p-12 text-center">
                  <p className="text-sm font-bold text-muted-foreground/40 uppercase tracking-widest leading-relaxed">Intelligence will appear as commitments are made.</p>
                </div>
              ) : (
                liveTasks.map((task) => (
                  <div key={task.id} className="group relative rounded-2xl border border-white/10 bg-black/20 p-5 shadow-inner transition-all hover:bg-black/30 border-l-4 border-l-primary">
                    <div className="mb-3 text-sm font-bold tracking-tight leading-snug">{task.title}</div>
                    <div className="flex items-center justify-between gap-2">
                       <div className="flex flex-wrap items-center gap-2">
                         <span className="px-2 py-0.5 rounded-full bg-primary/10 text-[9px] font-black uppercase tracking-widest text-primary border border-primary/20">
                           {task.assignee || "Unassigned"}
                         </span>
                       </div>
                       
                       {isAdmin && (
                         <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => handleDeleteLiveTask(task.id)}
                              className="h-7 w-7 rounded-lg hover:bg-red-500/10 hover:text-red-500"
                            >
                              <StopCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => handleApproveLiveTask(task.id)}
                              className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                         </div>
                       )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
