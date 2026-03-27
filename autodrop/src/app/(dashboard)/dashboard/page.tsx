"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { Video, CheckCircle2, Clock } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { listMeetings } from "@/lib/services/meetingService"
import { fetchTasks } from "@/lib/services/taskService"
import { Meeting, Task } from "@/lib/types"

export default function DashboardPage() {
  const [meetings] = useState<Meeting[]>(() => listMeetings())
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    fetchTasks().then(setTasks).catch(() => undefined)
  }, [])

  const completedTasks = useMemo(() => tasks.filter((t) => t.status === "Done").length, [tasks])
  const pendingTasks = tasks.length - completedTasks

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meetings.length}</div>
            <p className="text-xs text-muted-foreground">Uploaded meetings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
            <p className="text-xs text-muted-foreground">-1 from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
            <p className="text-xs text-muted-foreground">+5 from last week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Meetings</CardTitle>
            <CardDescription>Your latest uploaded and processed meetings.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {meetings.slice(0, 5).map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Video className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">{meeting.title}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-[200px] mt-1">{new Date(meeting.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Link
                    href={`/meetings/${meeting.id}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>Tasks that need your attention soon.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.filter(t => t.status !== "Done").slice(0, 4).map((task) => (
                <div key={task.id} className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium leading-none mb-1">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.dueDate ? `Due: ${task.dueDate}` : "No due date"}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/tasks"
              className={buttonVariants({ variant: "outline", className: "w-full mt-4" })}
            >
              View Kanban Board
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
