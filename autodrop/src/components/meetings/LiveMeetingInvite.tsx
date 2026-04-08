"use client";

import { useEffect, useState } from "react";
import { Mic, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMeeting } from "@/lib/contexts/MeetingContext";

export function LiveMeetingInvite() {
  const { liveMeeting, isPopupVisible, dismissPopup, joinMeeting } = useMeeting();

  if (!isPopupVisible || !liveMeeting) return null;

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
            onClick={dismissPopup}
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
          onClick={joinMeeting}
          className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Phone className="mr-2 h-4 w-4" />
          Join Meeting
        </Button>
      </div>
    </div>
  );
}
