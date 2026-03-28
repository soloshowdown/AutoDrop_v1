"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { Video, CheckCircle2, Clock, ArrowRight } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useEffect, useMemo, useState } from "react"
import { listMeetings } from "@/lib/services/meetingService"
import { fetchTasks } from "@/lib/services/taskService"
import { Meeting, Task } from "@/lib/types"
import { useWorkspace } from "@/lib/contexts/WorkspaceContext"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ActivityFeed } from "@/components/dashboard/ActivityFeed"

export default function DashboardPage() {
  const { user } = useUser()
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isDataLoading, setIsDataLoading] = useState(true)

  useEffect(() => {
    if (!currentWorkspace?.id) return

    async function loadData() {
      setIsDataLoading(true)
      try {
        const [fetchedMeetings, fetchedTasks] = await Promise.all([
          listMeetings(currentWorkspace!.id),
          fetchTasks(currentWorkspace!.id)
        ])
        setMeetings(fetchedMeetings)
        setTasks(fetchedTasks)
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setIsDataLoading(false)
      }
    }

    loadData()
  }, [currentWorkspace?.id])

  const completedTasks = useMemo(() => tasks.filter((t) => t.status === "Done").length, [tasks])
  const pendingTasks = tasks.length - completedTasks

  if (isWorkspaceLoading || (isDataLoading && meetings.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Syncing your workspace...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Hey, {user?.firstName || "there"}! 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">Here&apos;s a quick look at your workspace activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-3 overflow-hidden">
            {[1,2,3,4].map(i => (
              <Avatar key={i} className="border-4 border-background w-10 h-10 ring-1 ring-black/5">
                <AvatarFallback className="text-xs font-bold bg-muted/50">U{i}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <div className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-bold text-primary uppercase tracking-wider">
            +12 Team members
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="relative overflow-hidden group border-none shadow-2xl shadow-primary/5">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50 transition-opacity group-hover:opacity-80" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/80">Total Meetings</CardTitle>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Video className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black tracking-tighter">{meetings.length}</div>
            <div className="flex items-center gap-2 mt-2">
               <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">+2.4%</span>
               <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Engagement</p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group border-none shadow-2xl shadow-orange-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent opacity-50 transition-opacity group-hover:opacity-80" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/80">Active Tasks</CardTitle>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black tracking-tighter">{pendingTasks}</div>
            <div className="flex items-center gap-2 mt-2">
               <span className="flex items-center gap-0.5 text-xs font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-full">{tasks.length > 0 ? Math.round((pendingTasks/tasks.length)*100) : 0}%</span>
               <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Pending completion</p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group border-none shadow-2xl shadow-emerald-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-50 transition-opacity group-hover:opacity-80" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/80">Completed</CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black tracking-tighter">{completedTasks}</div>
            <div className="flex items-center gap-2 mt-2">
               <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">{tasks.length > 0 ? Math.round((completedTasks/tasks.length)*100) : 0}%</span>
               <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Overall velocity</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <Card className="lg:col-span-8 border-none bg-background/50 backdrop-blur-xl shadow-2xl shadow-black/[0.02]">
          <CardHeader className="flex flex-row items-center justify-between px-8 pt-8 pb-4">
            <div>
              <CardTitle className="text-xl font-bold">Recent Recordings</CardTitle>
              <CardDescription className="text-sm">Quick access to your team&apos;s latest intelligence.</CardDescription>
            </div>
            <Link href="/meetings" className="text-xs font-bold text-primary hover:underline underline-offset-4 tracking-widest uppercase">
              View All
            </Link>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="grid gap-3">
              {meetings.length > 0 ? meetings.slice(0, 4).map((meeting) => (
                <div key={meeting.id} className="group relative flex items-center justify-between p-4 rounded-2xl border bg-background/50 hover:bg-muted/30 transition-all hover:border-primary/20 cursor-pointer overflow-hidden">
                  <div className="absolute inset-y-0 left-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />
                  <div className="flex items-center gap-5 min-w-0">
                    <div className="bg-primary/5 p-3 rounded-2xl group-hover:bg-primary/10 transition-colors shadow-inner">
                      <Video className="h-5 w-5 text-primary" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-base truncate group-hover:text-primary transition-colors">{meeting.title}</p>
                      <div className="flex items-center gap-3 mt-1 opacity-60">
                         <span className="text-[10px] font-black uppercase tracking-widest">
                           {meeting.date ? new Date(meeting.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "Recently"}
                         </span>
                         <span className="text-muted-foreground/30">•</span>
                         <span className="bg-primary/5 text-primary text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-primary/10">AI Optimized</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                       <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Open details</span>
                    </div>
                    <Link
                      href={`/meetings/${meeting.id}`}
                      className={buttonVariants({ variant: "ghost", size: "icon-sm", className: "rounded-full hover:bg-primary/10" })}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-3xl opacity-40 bg-muted/5">
                   <Video className="h-10 w-10 mb-4 opacity-20" />
                   <p className="text-sm font-bold uppercase tracking-widest">No recordings yet</p>
                   <p className="text-xs mt-1">Start a meeting to see intelligence here.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="lg:col-span-4 flex flex-col gap-8">
           <Card className="flex-1 border-none bg-background/50 backdrop-blur-xl shadow-2xl shadow-black/[0.02] overflow-hidden">
              <CardHeader className="pt-8 px-8">
                <CardTitle className="text-xl font-bold">Activity Feed</CardTitle>
                <CardDescription>Live updates from your workspace.</CardDescription>
              </CardHeader>
              <CardContent className="h-[430px] px-8 pb-8 overflow-y-auto scrollbar-hide">
                 <ActivityFeed />
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  )
}
