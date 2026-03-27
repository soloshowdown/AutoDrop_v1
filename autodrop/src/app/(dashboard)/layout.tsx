import React from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { ClientProviders } from "@/components/providers/ClientProviders"
import Sidebar from "@/components/Sidebar"
import TopNavbar from "@/components/TopNavbar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/login")
  }

  return (
    <ClientProviders>
      <div className="grid min-h-screen w-full md:grid-cols-[250px_1fr]">
        <Sidebar />
        <div className="flex flex-col sm:gap-4 sm:py-0">
          <TopNavbar />
          <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:p-6 mb-8 mt-4 lg:mt-0">
            {children}
          </main>
        </div>
      </div>
    </ClientProviders>
  )
}
