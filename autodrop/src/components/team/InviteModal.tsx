"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Mail, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/contexts/WorkspaceContext";

interface InviteModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteModal({ isOpen, onOpenChange }: InviteModalProps) {
  const { currentWorkspace } = useWorkspace();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const inviteLink = typeof window !== "undefined" 
    ? `${window.location.origin}/signup?invite=${currentWorkspace?.id || ""}`
    : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Invite link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = async () => {
    if (!email || !currentWorkspace?.id) return;
    
    setIsSending(true);
    try {
      const response = await fetch("/api/workspace/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: currentWorkspace.id,
          email,
          role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send invite");
      }

      toast.success(`Invite sent to ${email}`);
      onOpenChange(false);
      setEmail("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl border-primary/20 shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        
        <DialogHeader className="pt-4">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Invite Team Members
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium pt-1">
            Grow your workspace by inviting collaborators.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-6">
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
              Email Address
            </Label>
            <Input
              id="email"
              placeholder="kunal@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border-primary/10 bg-muted/30 focus-visible:ring-primary/40 focus-visible:border-primary/50"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="role" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
              Workspace Role
            </Label>
            <Select 
              value={role} 
              onValueChange={(val) => val && setRole(val)}
            >
              <SelectTrigger className="rounded-xl border-primary/10 bg-muted/30">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-primary/20">
                <SelectItem value="member" className="cursor-pointer">Member</SelectItem>
                <SelectItem value="admin" className="cursor-pointer">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
              Share Invite Link
            </Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={inviteLink}
                className="rounded-xl border-primary/10 bg-muted/30 text-[10px] font-mono select-all"
              />
              <Button 
                variant="secondary" 
                size="icon" 
                onClick={handleCopyLink}
                className="rounded-xl shrink-0"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-6 bg-muted/5 -mx-6 -mb-6 px-6 pb-6">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="rounded-xl font-bold"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSendInvite}
            disabled={!email || isSending}
            className="rounded-xl font-bold shadow-lg shadow-primary/20"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Inviting...
              </>
            ) : (
              "Send Invite"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
