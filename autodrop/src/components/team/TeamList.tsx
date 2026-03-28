"use client";

import { useEffect, useState } from "react";
import { fetchWorkspaceMembers } from "@/lib/services/workspaceService";
import { useWorkspace } from "@/lib/contexts/WorkspaceContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InviteModal } from "./InviteModal";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

export function TeamList() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useUser();
  const [members, setMembers] = useState<any[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  const isAdmin = currentWorkspace?.role === 'admin';

  const fetchMembers = () => {
    if (!currentWorkspace?.id) return;
    fetch(`/api/workspace/${currentWorkspace.id}/members`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMembers(data);
        }
      })
      .catch((err) => console.error("Failed to fetch members:", err));
  };

  useEffect(() => {
    fetchMembers();
  }, [currentWorkspace?.id]);

  const handleRemoveMember = async (memberId: string, isInvite: boolean) => {
    if (!currentWorkspace?.id) return;
    
    setIsRemoving(memberId);
    try {
      if (isInvite) {
        // We'll need a separate invite deletion logic if we want to remove pending invites
        // For now, let's focus on members
        toast.error("Invite removal not yet implemented specifically, but you can manage invites in the invites page.");
      } else {
        const res = await fetch(`/api/workspace/${currentWorkspace.id}/members?userId=${memberId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          toast.success("Member removed.");
          fetchMembers();
        } else {
          const err = await res.json();
          toast.error(err.error || "Failed to remove member");
        }
      }
    } catch (err) {
      toast.error("Failed to remove member");
    } finally {
      setIsRemoving(null);
    }
  };

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
                  {member.name ? member.name.substring(0, 2).toUpperCase() : "???"}
                </AvatarFallback>
              </Avatar>
              {/* Online status indicator - mock */}
              <div 
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                  "bg-green-500" // Removed Math.random() to prevent hydration mismatch
                )} 
              />
            </div>
            <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
              <span className="text-xs font-semibold truncate group-hover:text-primary transition-colors">
                {member.name} {member.id === user?.id && "(You)"}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
                  {member.role || "Member"}
                </span>
                {member.status === 'pending' && (
                  <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1 rounded font-bold uppercase tracking-tighter">
                    Pending
                  </span>
                )}
              </div>
            </div>
            {isAdmin && member.id !== user?.id && member.status !== 'pending' && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveMember(member.id, false);
                }}
                disabled={isRemoving === member.id}
              >
                {isRemoving === member.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            )}
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
