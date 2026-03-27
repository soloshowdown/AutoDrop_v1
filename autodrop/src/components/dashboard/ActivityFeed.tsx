"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Upload, 
  CheckCircle2, 
  Sparkles, 
  User, 
  MessageSquare,
  Clock
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { fetchActivities } from "@/lib/services/activityService";
import { useWorkspace } from "@/lib/contexts/WorkspaceContext";
import { formatDistanceToNow } from "date-fns";

const iconMap: Record<string, any> = {
  "uploaded meeting": { icon: Upload, color: "text-blue-500", bg: "bg-blue-500/10" },
  "generated tasks": { icon: Sparkles, color: "text-purple-500", bg: "bg-purple-500/10" },
  "completed task": { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
  "created task": { icon: User, color: "text-orange-500", bg: "bg-orange-500/10" },
  "default": { icon: MessageSquare, color: "text-slate-500", bg: "bg-slate-500/10" }
};

export function ActivityFeed() {
  const { currentWorkspace } = useWorkspace();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentWorkspace?.id) return;

    async function loadActivities() {
      try {
        const data = await fetchActivities(currentWorkspace!.id);
        setActivities(data);
      } catch (error) {
        console.error("Failed to load activities:", error);
      } finally {
        setLoading(false);
      }
    }

    loadActivities();
  }, [currentWorkspace?.id]);

  if (loading) {
    return <div className="text-[10px] text-muted-foreground p-4 italic uppercase tracking-widest font-bold opacity-50">Syncing live feed...</div>;
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center opacity-40 italic gap-2 h-full">
         <Clock className="h-8 w-8 text-muted-foreground" />
         <p className="text-xs font-medium">No recent activity found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
           <Clock className="h-4 w-4" />
           Recent Activity
        </h3>
      </div>
      
      <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-muted/50">
        {activities.map((activity, index) => {
          // Find matching icon config
          const actionKey = Object.keys(iconMap).find(k => activity.action.toLowerCase().includes(k)) || "default";
          const config = iconMap[actionKey];
          const Icon = config.icon;
          
          return (
            <motion.div 
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-4 relative z-10 group"
            >
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-4 border-background shadow-sm transition-transform group-hover:scale-110", config.bg)}>
                 <Icon className={cn("h-4 w-4", config.color)} />
              </div>
              
              <div className="flex flex-col gap-1.5 pt-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <span className="font-bold hover:text-primary cursor-pointer transition-colors">{activity.user.name}</span>
                  <span className="text-muted-foreground">{activity.action}</span>
                  <span className="font-semibold text-foreground/90">{activity.target}</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="flex -space-x-1">
                      <Avatar className="h-5 w-5 border border-background">
                         <AvatarImage src={activity.user.avatar} />
                         <AvatarFallback className="text-[8px]">{activity.user.initials}</AvatarFallback>
                      </Avatar>
                   </div>
                   <span className="text-[10px] font-medium text-muted-foreground uppercase">
                     {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                   </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
