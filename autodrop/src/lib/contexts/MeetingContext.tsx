"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
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
  isLoading: boolean;
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export function MeetingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentWorkspace } = useWorkspace();
  const [liveMeeting, setLiveMeeting] = useState<Meeting | null>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [dismissedMeetingId, setDismissedMeetingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkLiveMeetings = async () => {
    if (!currentWorkspace?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const meetings = await fetchLiveMeetings(currentWorkspace.id);
      // Only consider meetings that have a roomId
      const validMeetings = meetings.filter(m => !!m.roomId);
      
      if (validMeetings.length > 0) {
        const meeting = validMeetings[0];
        setLiveMeeting(meeting);
        
        // Only show popup if not already in the meeting page and not dismissed for this specific meeting ID
        const isAlreadyInMeeting = pathname.includes("/meetings/live") && 
                                  pathname.includes(meeting.roomId || "");
        
        const isThisMeetingDismissed = dismissedMeetingId === meeting.id;
        
        if (!isAlreadyInMeeting && !isThisMeetingDismissed) {
          setIsPopupVisible(true);
        } else {
          setIsPopupVisible(false);
        }
      } else {
        setLiveMeeting(null);
        setIsPopupVisible(false);
        // Important: We don't reset dismissedMeetingId here. 
        // It stays until a NEW meeting with a different ID starts.
      }
    } catch (error) {
      console.error("Error checking live meetings:", error);
    } finally {
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
  }, [currentWorkspace?.id, pathname, dismissedMeetingId]);

  const dismissPopup = () => {
    if (liveMeeting) {
      setIsPopupVisible(false);
      setDismissedMeetingId(liveMeeting.id);
    }
  };

  const joinMeeting = () => {
    if (liveMeeting?.roomId) {
      router.push(`/meetings/live?room=${encodeURIComponent(liveMeeting.roomId)}`);
      setIsPopupVisible(false);
      setDismissedMeetingId(liveMeeting.id); // Mark as dismissed since we are joining it
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
