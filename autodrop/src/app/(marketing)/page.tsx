"use client"

import React from "react"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Mic, Layout, Zap, Calendar, ArrowRight, Play } from "lucide-react"
import Lightning from "@/components/ui/Lightning"

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Section with Lightning Background */}
      <section className="relative overflow-hidden">
        {/* Lightning Background */}
        <div className="absolute inset-0 z-0">
          <Lightning hue={220} xOffset={0} speed={1.2} intensity={1.3} size={1} />
        </div>
        {/* Gradient fade at bottom so the lightning blends into the page */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent z-[1]" />

        <div className="container relative z-[2] mx-auto px-4 pt-24 md:pt-32 pb-8 flex flex-col items-center text-center gap-6">
          <div className="inline-flex items-center rounded-full border border-primary/30 px-2.5 py-0.5 text-xs font-semibold text-primary bg-primary/10 backdrop-blur-sm">
            <Zap className="mr-1 h-3 w-3" /> AutoDrop 2.0 is live
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl drop-shadow-lg">
            Turn Meetings into <span className="text-primary">Actionable Tasks</span> Automatically
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl drop-shadow-md">
            Upload your meeting recordings. Our AI extracts action items, assigns owners, and drops them perfectly into your Kanban board.
          </p>
          <div className="flex sm:flex-row flex-col gap-4 mt-4">
            <Link 
              href="/dashboard" 
              className={buttonVariants({ size: "lg", className: "gap-2" })}
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <Button size="lg" variant="outline" className="gap-2 backdrop-blur-sm">
              <Play className="h-4 w-4" /> Watch Demo
            </Button>
          </div>

        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Everything you need to ship faster</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Stop worrying about notes. AutoDrop handles the busywork so you can focus on building.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-none bg-muted/40">
            <CardHeader>
              <Mic className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Speech-to-Text</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">Flawless transcription of your meeting recordings in over 50 languages.</CardDescription>
            </CardContent>
          </Card>
          <Card className="border-none shadow-none bg-muted/40">
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>AI Task Extraction</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">Our LLM identifies commitments, deadlines, and assignees directly from conversation.</CardDescription>
            </CardContent>
          </Card>
          <Card className="border-none shadow-none bg-muted/40">
            <CardHeader>
              <Layout className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Kanban Board</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">Built-in agile board to visually track your tasks from To Do to Done.</CardDescription>
            </CardContent>
          </Card>
          <Card className="border-none shadow-none bg-muted/40">
            <CardHeader>
              <Calendar className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Export Anywhere</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">Sync your extracted tasks to Jira, Linear, Asana, or export as CSV.</CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it Works */}
      <section className="container mx-auto px-4 py-16 bg-muted/20 rounded-3xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">How AutoDrop Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Three simple steps to automate your workflow.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-12 relative">
          <div className="absolute top-12 left-[16%] right-[16%] h-0.5 bg-border hidden md:block"></div>
          <div className="relative text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-background border-4 border-primary flex items-center justify-center text-xl font-bold z-10 shadow-sm">1</div>
            <h3 className="text-xl font-semibold">Upload Recording</h3>
            <p className="text-muted-foreground">Drop your MP3 or MP4 file into the dashboard after your meeting ends.</p>
          </div>
          <div className="relative text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-background border-4 border-primary flex items-center justify-center text-xl font-bold z-10 shadow-sm">2</div>
            <h3 className="text-xl font-semibold">AI Processing</h3>
            <p className="text-muted-foreground">We generate the transcript and intelligently extract actionable items.</p>
          </div>
          <div className="relative text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-background border-4 border-primary flex items-center justify-center text-xl font-bold z-10 shadow-sm">3</div>
            <h3 className="text-xl font-semibold">Review & Organize</h3>
            <p className="text-muted-foreground">Tasks are populated on your Kanban board. Review, assign, and get to work.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-16 md:py-24">
         <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Loved by engineering teams</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              quote: "AutoDrop has saved our product team at least 5 hours a week in meeting follow-ups.",
              name: "Sarah Jenkins",
              role: "Product Manager at TechFlow",
            },
            {
              quote: "The task extraction is scarily accurate. It picks up nuances in conversation I would have missed.",
              name: "David Chen",
              role: "Lead Engineer at StartupX",
            },
            {
              quote: "Finally a tool that natively bridges the gap between Zoom meetings and our Jira board.",
              name: "Emily Ross",
              role: "Scrum Master at BuildIt",
            }
          ].map((t, i) => (
            <Card key={i} className="bg-background">
              <CardContent className="pt-6">
                <p className="italic text-muted-foreground mb-4">&quot;{t.quote}&quot;</p>
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing PricingCard */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Start for free, upgrade when you need more power.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Free</CardTitle>
              <CardDescription>For individuals getting started.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-6">$0<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3"><Check className="h-4 w-4 text-primary"/> 3 meetings per month</li>
                <li className="flex items-center gap-3"><Check className="h-4 w-4 text-primary"/> Standard AI extraction</li>
                <li className="flex items-center gap-3"><Check className="h-4 w-4 text-primary"/> 7-day task history</li>
              </ul>
              <Button className="w-full" variant="outline">Get Started</Button>
            </CardContent>
          </Card>
          
          {/* Pro */}
          <Card className="border-primary shadow-xl relative scale-105">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
              Most Popular
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Pro</CardTitle>
              <CardDescription>For professionals and small teams.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-6">$19<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3"><Check className="h-4 w-4 text-primary"/> Unlimited meetings</li>
                <li className="flex items-center gap-3"><Check className="h-4 w-4 text-primary"/> Advanced GPT-4 extraction</li>
                <li className="flex items-center gap-3"><Check className="h-4 w-4 text-primary"/> Unlimited history</li>
                <li className="flex items-center gap-3"><Check className="h-4 w-4 text-primary"/> Jira/Linear exports</li>
              </ul>
              <Button className="w-full">Upgrade to Pro</Button>
            </CardContent>
          </Card>

          {/* Team */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Team</CardTitle>
              <CardDescription>For larger organizations.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-6">$49<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3"><Check className="h-4 w-4 text-primary"/> Everything in Pro</li>
                <li className="flex items-center gap-3"><Check className="h-4 w-4 text-primary"/> Custom AI workflows</li>
                <li className="flex items-center gap-3"><Check className="h-4 w-4 text-primary"/> Priority support</li>
                <li className="flex items-center gap-3"><Check className="h-4 w-4 text-primary"/> SSO & SAML</li>
              </ul>
              <Button className="w-full" variant="outline">Contact Sales</Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
