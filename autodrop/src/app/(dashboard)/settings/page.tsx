"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"
import React, { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { user, isLoaded } = useUser()
  const [name, setName] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user?.firstName) {
      setName(user.firstName)
    }
  }, [user])

  const handleSaveProfile = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      await user.update({ firstName: name })
      
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      })

      if (!response.ok) throw new Error("Failed to update profile in database")
      
      toast.success("Profile updated successfully")
    } catch (error) {
      toast.error("Failed to update profile")
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account settings and preferences.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal details here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                disabled={!isLoaded || isSaving}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                value={user?.primaryEmailAddress?.emailAddress || ""} 
                disabled 
              />
            </div>
            <Button onClick={handleSaveProfile} disabled={!isLoaded || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize the look and feel of AutoDrop.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Switch between light and dark themes.</p>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked: boolean) => setTheme(checked ? "dark" : "light")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>Enter your LLM API keys for custom processing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="openai-key">OpenAI API Key (Optional)</Label>
              <Input id="openai-key" type="password" placeholder="sk-..." />
              <p className="text-xs text-muted-foreground">Leave blank to use our default hosted models.</p>
            </div>
            <Button variant="secondary">Update Keys</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
