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
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkLiveMeetings = async () => {
    if (!currentWorkspace?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const meetings = await fetchLiveMeetings(currentWorkspace.id);
      if (meetings.length > 0) {
        const meeting = meetings[0];
        setLiveMeeting(meeting);
        
        // Only show popup if not already in the meeting page and not dismissed
        const isAlreadyInMeeting = pathname.includes("/meetings/live") && 
                                  pathname.includes(meeting.roomId || "");
        
        if (!isAlreadyInMeeting && !isDismissed) {
          setIsPopupVisible(true);
        } else {
          setIsPopupVisible(false);
        }
      } else {
        setLiveMeeting(null);
        setIsPopupVisible(false);
        setIsDismissed(false); // Reset dismissal when no meetings are active
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
    
    // Check every 15 seconds as a fallback
    const interval = setInterval(checkLiveMeetings, 15000);

    const subscription = subscribeToMeetings(currentWorkspace.id, () => {
      void checkLiveMeetings();
    });

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [currentWorkspace?.id, pathname, isDismissed]);

  const dismissPopup = () => {
    setIsPopupVisible(false);
    setIsDismissed(true);
  };

  const joinMeeting = () => {
    if (liveMeeting?.roomId) {
      router.push(`/meetings/live?room=${encodeURIComponent(liveMeeting.roomId)}`);
      setIsPopupVisible(false);
      setIsDismissed(true); // Don't show the popup again for this meeting after joining
    }
  };

  const isMeetingActive = !!liveMeeting;

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
