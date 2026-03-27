"use client";

import { useEffect, useState } from "react";
import { fetchWorkspaceMembers } from "@/lib/services/workspaceService";
import { useWorkspace } from "@/lib/contexts/WorkspaceContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InviteModal } from "./InviteModal";

export function TeamList() {
  const { currentWorkspace } = useWorkspace();
  const [members, setMembers] = useState<any[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  useEffect(() => {
    if (!currentWorkspace?.id) return;
    
    fetchWorkspaceMembers(currentWorkspace.id)
      .then((data) => {
        setMembers(data.map((m: any) => ({
          id: m.users.id,
          name: m.users.name,
          email: m.users.email,
          avatar: m.users.avatar_url,
          role: m.role
        })));
      })
      .catch((err) => console.error("Failed to fetch members:", err));
  }, [currentWorkspace?.id]);

  return (
    <div className="flex flex-col gap-4 py-4 px-2">
      <div className="flex items-center justify-between px-2 mb-2">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Team Members
        </h3>
        <Button 
          variant="ghost" 
          size="icon-sm" 
          className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors"
          onClick={() => setIsInviteModalOpen(true)}
        >
          <UserPlus className="h-3.5 w-3.5" />
        </Button>
      </div>
      
      <div className="space-y-1">
        {members.map((member) => (
          <div 
            key={member.id} 
            className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-muted/40 cursor-pointer group transition-all"
          >
            <div className="relative">
              <Avatar size="sm">
                <AvatarImage src={member.avatar} />
                <AvatarFallback className="text-[10px]">
                  {member.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Online status indicator - mock */}
              <div 
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                  Math.random() > 0.3 ? "bg-green-500" : "bg-gray-400"
                )} 
              />
            </div>
            <div className="flex flex-col min-w-0 overflow-hidden">
              <span className="text-xs font-semibold truncate group-hover:text-primary transition-colors">
                {member.name}
              </span>
              <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
                {member.role || "Member"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <InviteModal 
        isOpen={isInviteModalOpen} 
        onOpenChange={setIsInviteModalOpen} 
      />
    </div>
  );
}
