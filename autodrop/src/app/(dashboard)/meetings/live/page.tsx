"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LiveMeetingPage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [joinedRoomId, setJoinedRoomId] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [userName, setUserName] = useState("AutoDrop User");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasJoinedFromQueryRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const zegoRef = useRef<any>(null);

  useEffect(() => {
    return () => {
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
      const finalUserName = userName.trim() || "AutoDrop User";
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
      router.replace(`/meetings/live?room=${encodeURIComponent(finalRoomId)}`);
      toast.success(`Joined room ${finalRoomId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to join meeting");
    } finally {
      setIsJoining(false);
    }
  }, [roomId, router, userName]);

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

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const timestamp = new Date().toISOString();
        
        // Save file locally
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `recording_${joinedRoomId || "meeting"}_${timestamp}.webm`;
        anchor.click();
        URL.revokeObjectURL(url);

        // Auto-upload and transcribe
        try {
          toast.info("Processing recording...");
          const file = new File([blob], `meeting_${timestamp}.webm`, { type: "video/webm" });
          const formData = new FormData();
          formData.append("audio", file);

          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || "Transcription failed");
          }

          await response.json();
          toast.success("Meeting processed and tasks extracted automatically!");
          
          // Optionally redirect to meetings page to see the new meeting
          setTimeout(() => {
            window.location.href = "/meetings";
          }, 2000);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to process meeting");
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.success("Recording started");
    } catch {
      toast.error("Could not start recording. Check browser permissions.");
    }
  };

  const handleStopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
    toast.info("Stopping recording and processing audio...");
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Live Meeting</h1>
      <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto_auto]">
        <Input
          placeholder="Enter room id"
          value={roomId}
          onChange={(event) => setRoomId(event.target.value)}
        />
        <Input
          placeholder="Display name"
          value={userName}
          onChange={(event) => setUserName(event.target.value)}
        />
        <Button onClick={() => void handleJoin()} disabled={!roomId.trim() || isJoining}>
          {isJoining ? "Joining..." : "Join"}
        </Button>
        <Button variant="outline" onClick={handleCreateRoom} disabled={isJoining}>
          Create Room
        </Button>
      </div>

      <div ref={containerRef} className="w-full h-[65vh] rounded-lg border bg-black/5" />

      {joinedRoomId && (
        <div className="flex gap-2">
          {!isRecording ? (
            <Button variant="outline" onClick={handleStartRecording}>
              Start Recording
            </Button>
          ) : (
            <Button onClick={handleStopRecording}>Stop Recording</Button>
          )}
        </div>
      )}
    </div>
  );
}
