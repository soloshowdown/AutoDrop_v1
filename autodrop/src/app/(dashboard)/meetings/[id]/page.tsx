"use client"

import { useParams } from "next/navigation"
import MeetingDetailClient from "./MeetingDetailClient"
import { getMeetingById } from "@/lib/services/meetingService"
import { Meeting, Task } from "@/lib/types"
import { useEffect, useState } from "react"

export default function MeetingDetailPage() {
  const params = useParams<{ id: string }>()
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = params?.id
    if (!id) return

    let intervalId: NodeJS.Timeout

    async function loadMeeting() {
      try {
        const data = await getMeetingById(id)
        if (!data) {
          setLoading(false)
          return
        }
        setMeeting(data)
        setLoading(false)

        if (data.status === "processing") {
          if (!intervalId) {
            intervalId = setInterval(loadMeeting, 3000)
          }
        } else {
           if (intervalId) {
             clearInterval(intervalId)
             // No need to clear intervalId variable since it's local
           }
        }
      } catch (error) {
        console.error("Error loading meeting:", error)
        setLoading(false)
        if (intervalId) clearInterval(intervalId)
      }
    }

    loadMeeting()

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [params?.id])

  if (loading) {
    return <div className="p-8">Loading meeting...</div>
  }

  if (!meeting) {
    return <div className="text-sm text-muted-foreground p-8">Meeting not found.</div>
  }

  const transcript = meeting.transcript ?? []
  // Map extracted tasks to Task type
  const initialTasks: Task[] = (meeting.extractedTasks ?? []).map((task, index) => ({
    id: `${meeting.id}-${index}`,
    title: task.title,
    status: "To Do",
    assignee: task.assignee,
    dueDate: task.deadline ?? undefined,
    meetingId: meeting.id,
    sourceType: "AI",
    priority: task.priority || "medium",
    approved: false,
  }))

  return (
    <MeetingDetailClient 
      meeting={meeting} 
      transcript={transcript} 
      initialTasks={initialTasks} 
    />
  )
}
