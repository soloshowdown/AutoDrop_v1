"use client"

import React from "react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Play } from "lucide-react"

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between mx-auto px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-primary text-primary-foreground p-1 rounded-md">
              <Play className="h-5 w-5" />
            </div>
            <span className="font-bold inline-block">AutoDrop</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-medium hover:underline underline-offset-4">
            Dashboard
          </Link>
          <Link href="/meetings" className={buttonVariants({ size: "sm" })}>
            Open App
          </Link>
        </div>
      </div>
    </header>
  )
}
