"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { Video, CheckCircle2, Clock, ArrowRight } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useEffect, useMemo, useState } from "react"
import { listMeetings } from "@/lib/services/meetingService"
import { fetchTasks } from "@/lib/services/taskService"
import { Meeting, Task } from "@/lib/types"
import { useWorkspace } from "@/lib/contexts/WorkspaceContext"

import { ActivityFeed } from "@/components/dashboard/ActivityFeed"

export default function DashboardPage() {
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
    return <div className="flex items-center justify-center min-h-[400px]">Loading workspace data...</div>
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back! Here&apos;s what&apos;s happening across your team.</p>
        </div>
        <div className="flex -space-x-2">
           {[1,2,3,4].map(i => (
             <Avatar key={i} className="border-2 border-background w-8 h-8">
                <AvatarFallback className="text-[10px] font-bold">U{i}</AvatarFallback>
             </Avatar>
           ))}
           <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold text-muted-foreground">
              +12
           </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/10 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Meetings</CardTitle>
            <Video className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{meetings.length}</div>
            <div className="flex items-center gap-1.5 mt-1">
               <span className="text-xs font-bold text-green-500">+2</span>
               <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Since yesterday</p>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingTasks}</div>
            <div className="flex items-center gap-1.5 mt-1">
               <span className="text-xs font-bold text-orange-500">12</span>
               <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Awaiting action</p>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Completed Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedTasks}</div>
            <div className="flex items-center gap-1.5 mt-1">
               <span className="text-xs font-bold text-green-500">84%</span>
               <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Team velocity</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
        <Card className="lg:col-span-5 bg-background/40 backdrop-blur-sm border-white/5 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Recordings</CardTitle>
              <CardDescription>Your team&apos;s latest processed meetings.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {meetings.slice(0, 5).map((meeting) => (
                <div key={meeting.id} className="group flex items-center justify-between p-2 rounded-xl hover:bg-muted/40 transition-all">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="bg-primary/10 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                      <Video className="h-4 w-4 text-primary" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold truncate">{meeting.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                         <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">{new Date(meeting.date).toLocaleDateString()}</span>
                         <span className="text-[10px] text-muted-foreground/40">•</span>
                         <div className="flex -space-x-1.5 uppercase text-[8px] font-bold">
                            <span className="bg-muted px-1.5 py-0.5 rounded text-muted-foreground">AI GEN</span>
                         </div>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/meetings/${meeting.id}`}
                    className={buttonVariants({ variant: "ghost", size: "icon-sm", className: "rounded-full" })}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
              <Link href="/meetings" className="w-full inline-flex items-center justify-center text-xs font-bold uppercase tracking-widest text-primary hover:underline mt-4">
                 View all recordings
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-4 bg-background/40 backdrop-blur-sm border-white/5 shadow-xl overflow-hidden">
           <CardHeader>
             <CardTitle className="text-lg">Live Feed</CardTitle>
             <CardDescription>Real-time collaboration activity.</CardDescription>
           </CardHeader>
           <CardContent className="h-[400px] overflow-y-auto scrollbar-hide">
              <ActivityFeed />
           </CardContent>
        </Card>

        <Card className="lg:col-span-3 bg-background/40 backdrop-blur-sm border-white/5 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg text-orange-500">Urgent Tasks</CardTitle>
            <CardDescription>Needs immediate attention.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.filter(t => t.status !== "Done" && t.priority === "high").slice(0, 5).map((task) => (
                <div key={task.id} className="p-3 rounded-xl border-l-4 border-l-red-500 bg-red-500/5 hover:bg-red-500/10 transition-all cursor-pointer">
                  <p className="text-xs font-bold leading-tight mb-2 truncate">{task.title}</p>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                           <AvatarFallback className="text-[8px] font-bold">{task.assignee?.substring(0, 2) || "??"}</AvatarFallback>
                        </Avatar>
                        <span className="text-[10px] font-bold text-muted-foreground truncate max-w-[80px]">{task.assignee || "Unassigned"}</span>
                     </div>
                     <span className="text-[9px] font-mono text-red-500 font-bold uppercase">{task.dueDate || "ASAP"}</span>
                  </div>
                </div>
              ))}
              {tasks.filter(t => t.status !== "Done" && t.priority === "high").length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-40 italic gap-2">
                   <CheckCircle2 className="h-8 w-8 text-green-500" />
                   <p className="text-xs font-medium">All high-priority tasks cleared!</p>
                </div>
              )}
            </div>
            <Link
              href="/tasks"
              className={buttonVariants({ variant: "outline", className: "w-full mt-6 rounded-xl font-bold text-xs uppercase tracking-widest" })}
            >
              Collaborate
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
