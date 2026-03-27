"use client"

import { useState } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UploadCloud, File, Video, ArrowRight, Phone } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { listMeetings, uploadAndProcessMeeting } from "@/lib/services/meetingService"
import { Meeting } from "@/lib/types"
import { toast } from "sonner"
import { useWorkspace } from "@/lib/contexts/WorkspaceContext"
import AIProcessingOverlay from "@/components/ai-processing/AIProcessingOverlay"
import { useEffect } from "react"

export default function MeetingsPage() {
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace()
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isDataLoading, setIsDataLoading] = useState(true)
  
  // AI Processing Overlay States
  const [showAIOverlay, setShowAIOverlay] = useState(false)
  const [processingResult, setProcessingResult] = useState<Meeting | null>(null)

  useEffect(() => {
    if (!currentWorkspace?.id) return
    async function loadMeetings() {
      setIsDataLoading(true)
      try {
        const data = await listMeetings(currentWorkspace!.id)
        setMeetings(data)
      } catch (error) {
        console.error("Error loading meetings:", error)
      } finally {
        setIsDataLoading(false)
      }
    }
    loadMeetings()
  }, [currentWorkspace?.id])

  if (isWorkspaceLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">Loading workspace...</div>
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return
    try {
      setIsUploading(true)
      // Show overlay as soon as upload/process starts
      setShowAIOverlay(true)
      
      const result = await uploadAndProcessMeeting(file, currentWorkspace!.id)
      setProcessingResult(result)
      
      const updated = await listMeetings(currentWorkspace!.id)
      setMeetings(updated)
      setFile(null)
      // We don't toast success here anymore, the overlay handles the "completion" feel
    } catch (error) {
      setShowAIOverlay(false) // Hide overlay on error
      toast.error(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  const handleProcessingComplete = () => {
    setShowAIOverlay(false)
    setProcessingResult(null)
    toast.success("Meeting processed and tasks extracted")
  }

  return (
    <div className="flex flex-col gap-8">
      <AIProcessingOverlay 
        isOpen={showAIOverlay} 
        file={file} 
        result={processingResult} 
        onComplete={handleProcessingComplete} 
      />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
          <p className="text-muted-foreground mt-2">Upload new recordings or review past meetings.</p>
        </div>
        <Link href="/meetings/live" className={buttonVariants({ variant: "outline" })}>
          <Phone className="h-4 w-4 mr-2" />
          Join Live Call
        </Link>
      </div>

      <div className="grid gap-6">
        {/* Upload Section */}
        <Card>
          <CardContent className="pt-6">
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center transition-colors ${
                dragActive ? "border-primary bg-primary/5" : "border-border"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {!file ? (
                <>
                  <div className="p-4 bg-muted rounded-full mb-4">
                    <UploadCloud className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">Upload meeting recording</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                    Drag and drop your MP4, MP3, or WAV file here, or click to browse. Max size 2GB.
                  </p>
                  <Button variant="secondary" onClick={() => document.getElementById("file-upload")?.click()}>
                    Browse Files
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept="video/mp4,audio/mp3,audio/wav"
                    onChange={handleChange}
                  />
                </>
              ) : (
                <>
                   <div className="p-4 bg-primary/10 rounded-full mb-4">
                    <File className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{file.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setFile(null)}>Cancel</Button>
                    <Button onClick={handleUpload} disabled={isUploading}>
                      {isUploading ? "Processing..." : "Start Processing"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Meeting List */}
        <div>
           <h2 className="text-xl font-semibold mb-4">Recent Recordings</h2>
           <div className="grid gap-4">
              {meetings.map((meeting) => (
                <Card key={meeting.id} className="hover:bg-muted/50 transition-colors">
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
                        <Video className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <Link href={`/meetings/${meeting.id}`} className="font-semibold text-lg hover:underline inline-block mb-1">
                          {meeting.title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span>{new Date(meeting.date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{meeting.duration}</span>
                          <span>•</span>
                          <Badge variant={meeting.status === "completed" ? "default" : "secondary"}>
                            {meeting.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Link
                       href={`/meetings/${meeting.id}`}
                       className={`${buttonVariants({ variant: "outline", size: "sm" })} sm:w-auto w-full shrink-0`}
                    >
                       View Details <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                </Card>
              ))}
           </div>
        </div>
      </div>
    </div>
  )
}
