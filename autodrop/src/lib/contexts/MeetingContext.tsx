"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Meeting } from "@/lib/types";
import { fetchLiveMeetings, subscribeToMeetings } from "@/lib/services/meetingService";
import { useWorkspace } from "./WorkspaceContext";

interface MeetingContextType {
  liveMeeting: Meeting | null;
  isPopupVisible: boolean;
  isMeetingActive: boolean;
  dismissPopup: () => void;
  joinMeeting: () => void;
  refreshMeetingState: () => void;
  isLoading: boolean;
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

const STALE_THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4 hours

export function MeetingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentWorkspace } = useWorkspace();
  const [liveMeeting, setLiveMeeting] = useState<Meeting | null>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use a ref for dismissed ID to instantly prevent race conditions in async checks
  const dismissedMeetingIdRef = useRef<string | null>(null);
  const isCheckingRef = useRef(false);

  const checkLiveMeetings = async () => {
    if (!currentWorkspace?.id || isCheckingRef.current) {
      if (!currentWorkspace?.id) setIsLoading(false);
      return;
    }

    isCheckingRef.current = true;
    try {
      const meetings = await fetchLiveMeetings(currentWorkspace.id);
      const now = Date.now();
      
      // Filter for valid meetings: 
      // 1. Must have a roomId
      // 2. Must not be older than 4 hours (Zombie protection)
      const validMeetings = meetings.filter(m => {
        if (!m.roomId) return false;
        const meetingAge = now - new Date(m.date).getTime();
        return meetingAge < STALE_THRESHOLD_MS;
      });
      
      if (validMeetings.length > 0) {
        const meeting = validMeetings[0];
        setLiveMeeting(meeting);
        
        // Logic check:
        // 1. Are we already on the meeting page?
        const isAlreadyInMeeting = pathname.includes("/meetings/live") && 
                                  pathname.includes(meeting.roomId || "");
        
        // 2. Has this specific meeting been dismissed? (Check current ref value)
        const isThisMeetingDismissed = dismissedMeetingIdRef.current === meeting.id;
        
        if (!isAlreadyInMeeting && !isThisMeetingDismissed) {
          setIsPopupVisible(true);
        } else {
          setIsPopupVisible(false);
        }
      } else {
        setLiveMeeting(null);
        setIsPopupVisible(false);
        // Note: We don't clear the dismissedMeetingIdRef here. 
        // It's benign and keeps older dismissals sticky if needed.
      }
    } catch (error) {
      console.error("Error checking live meetings:", error);
    } finally {
      isCheckingRef.current = false;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentWorkspace?.id) return;

    void checkLiveMeetings();
    
    const interval = setInterval(checkLiveMeetings, 15000);

    const subscription = subscribeToMeetings(currentWorkspace.id, () => {
      void checkLiveMeetings();
    });

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [currentWorkspace?.id, pathname]);

  const dismissPopup = () => {
    if (liveMeeting) {
      // 1. Update ref immediately to block any in-flight checkLiveMeetings results
      dismissedMeetingIdRef.current = liveMeeting.id;
      // 2. Update state to hide UI immediately
      setIsPopupVisible(false);
    }
  };

  const joinMeeting = () => {
    if (liveMeeting?.roomId) {
      dismissedMeetingIdRef.current = liveMeeting.id;
      setIsPopupVisible(false);
      router.push(`/meetings/live?room=${encodeURIComponent(liveMeeting.roomId)}`);
    }
  };

  const isMeetingActive = !!liveMeeting && !!liveMeeting.roomId;

  return (
    <MeetingContext.Provider 
      value={{ 
        liveMeeting, 
        isPopupVisible, 
        isMeetingActive, 
        dismissPopup, 
        joinMeeting,
        refreshMeetingState: () => void checkLiveMeetings(),
        isLoading 
      }}
    >
      {children}
    </MeetingContext.Provider>
  );
}

export function useMeeting() {
  const context = useContext(MeetingContext);
  if (context === undefined) {
    throw new Error("useMeeting must be used within a MeetingProvider");
  }
  return context;
}
