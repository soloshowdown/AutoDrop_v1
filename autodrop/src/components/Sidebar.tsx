"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Video, KanbanSquare, Settings, Play, Phone, Mail } from "lucide-react"
import { WorkspaceSwitcher } from "./workspaces/WorkspaceSwitcher"
import { TeamList } from "./team/TeamList"
import { useWorkspace } from "@/lib/contexts/WorkspaceContext"
import { useMeeting } from "@/lib/contexts/MeetingContext"
import { Badge } from "@/components/ui/badge"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Meetings",
    href: "/meetings",
    icon: Video,
  },
  {
    title: "Live Call",
    href: "/meetings/live",
    icon: Phone,
  },
  {
    title: "Tasks",
    href: "/tasks",
    icon: KanbanSquare,
  },
  {
    title: "My Invites",
    href: "/invites",
    icon: Mail,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { pendingInvitesCount } = useWorkspace()
  const { isMeetingActive } = useMeeting()

  return (
    <div className="hidden border-r bg-muted/40 md:block w-64 flex-shrink-0">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex flex-col border-b lg:h-[130px]">
          <div className="flex h-14 items-center px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <div className="bg-primary text-primary-foreground p-1 rounded-md">
                <Play className="h-5 w-5" />
              </div>
              <span className="tracking-tight">AutoDrop</span>
            </Link>
          </div>
          <div className="px-3 pb-3">
             <WorkspaceSwitcher />
          </div>
        </div>
        <div className="flex-1 overflow-auto py-2 flex flex-col justify-between">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
            {sidebarItems.map((item, index) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
                    active 
                      ? "bg-primary/10 text-primary font-bold shadow-sm" 
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                    {item.title}
                  </div>
                  {item.href === "/invites" && pendingInvitesCount > 0 && (
                    <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] animate-pulse">
                      {pendingInvitesCount}
                    </Badge>
                  )}
                  {item.href === "/meetings/live" && isMeetingActive && (
                    <div className="ml-auto">
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    </div>
                  )}
                </Link>
              )
            })}
          </nav>
          
          <div className="mt-auto border-t bg-muted/20">
             <TeamList />
          </div>
        </div>
      </div>
    </div>
  )
}
