"use client"

import React, { useMemo } from "react"
import { useParams } from "next/navigation"
import MeetingDetailClient from "./MeetingDetailClient"
import { getMeetingById } from "@/lib/services/meetingService"
import { Task } from "@/lib/types"

export default function MeetingDetailPage() {
  const params = useParams<{ id: string }>()
  const meeting = useMemo(() => {
    const id = params?.id
    if (!id) return null
    return getMeetingById(id)
  }, [params?.id])

  if (!meeting) {
    return <div className="text-sm text-muted-foreground">Meeting not found.</div>
  }

  const transcript = meeting.transcript ?? []
  const initialTasks: Task[] = (meeting.extractedTasks ?? []).map((task, index) => ({
    id: `${meeting.id}-${index}`,
    title: task.task,
    status: "To Do",
    assignee: task.who,
    dueDate: task.due_date ?? undefined,
    meetingId: meeting.id,
  }))

  return (
    <MeetingDetailClient 
      meeting={meeting} 
      transcript={transcript} 
      initialTasks={initialTasks} 
    />
  )
}
