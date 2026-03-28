"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Mic, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/lib/contexts/WorkspaceContext";
import { fetchLiveMeetings, subscribeToMeetings } from "@/lib/services/meetingService";
import { Meeting } from "@/lib/types";

export function LiveMeetingInvite() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentWorkspace } = useWorkspace();
  const [liveMeeting, setLiveMeeting] = useState<Meeting | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!currentWorkspace?.id) return;

    const checkLiveMeetings = async () => {
      const meetings = await fetchLiveMeetings(currentWorkspace.id);
      if (meetings.length > 0) {
        // If we're already in the live meeting page for this room, don't show the invite
        const isAlreadyInMeeting = pathname.includes("/meetings/live") && 
          pathname.includes(meetings[0].roomId || "");
          
        if (!isAlreadyInMeeting) {
          setLiveMeeting(meetings[0]);
          setIsVisible(true);
        }
      } else {
        setIsVisible(false);
      }
    };

    void checkLiveMeetings();

    const subscription = subscribeToMeetings(currentWorkspace.id, (payload) => {
      if (payload.eventType === "INSERT" || (payload.eventType === "UPDATE" && payload.new.status === "live")) {
        const m = payload.new;
        if (m.status === "live") {
          setLiveMeeting({
            id: m.id,
            title: m.title,
            status: m.status,
            roomId: m.room_id,
            date: m.date || m.created_at,
            duration: m.duration
          });
          setIsVisible(true);
        }
      } else if (payload.eventType === "UPDATE" && payload.new.status !== "live") {
        setIsVisible(false);
      } else if (payload.eventType === "DELETE") {
        setIsVisible(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [currentWorkspace?.id, pathname]);

  if (!isVisible || !liveMeeting) return null;

  const handleJoin = () => {
    if (liveMeeting.roomId) {
      router.push(`/meetings/live?room=${encodeURIComponent(liveMeeting.roomId)}`);
      setIsVisible(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="relative group overflow-hidden rounded-[2.5rem] border border-primary/20 bg-background/80 backdrop-blur-2xl p-6 shadow-2xl ring-1 ring-white/10 w-80">
        {/* Glow effect */}
        <div className="absolute -right-4 -top-4 h-24 w-24 bg-primary/10 blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
        
        <div className="flex items-start justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
            <Mic className="h-6 w-6 animate-pulse" />
          </div>
          <button 
            onClick={() => setIsVisible(false)}
            className="rounded-full p-1.5 hover:bg-white/5 text-muted-foreground/40 hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Live Meeting Started</p>
          <h3 className="font-bold text-lg leading-tight tracking-tight">{liveMeeting.title}</h3>
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">Your team just started a session. Join now to participate in real-time AI capture.</p>
        </div>

        <Button 
          onClick={handleJoin}
          className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Phone className="mr-2 h-4 w-4" />
          Join Meeting
        </Button>
      </div>
    </div>
  );
}
