"use client"

import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, Search } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Video, KanbanSquare, Settings, Play, Phone } from "lucide-react"
import { Show, UserButton, SignInButton } from '@clerk/nextjs'

const sidebarItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Meetings", href: "/meetings", icon: Video },
  { title: "Live Call", href: "/meetings/live", icon: Phone },
  { title: "Tasks", href: "/tasks", icon: KanbanSquare },
  { title: "Settings", href: "/settings", icon: Settings },
]

export default function TopNavbar() {
  const pathname = usePathname()

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      <Sheet>
        <SheetTrigger className={buttonVariants({ variant: "outline", size: "icon", className: "shrink-0 md:hidden" })}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <nav className="grid gap-2 text-lg font-medium">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold mb-4">
              <div className="bg-primary text-primary-foreground p-1 rounded-md">
                <Play className="h-5 w-5" />
              </div>
              <span>AutoDrop</span>
            </Link>
            {sidebarItems.map((item, i) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={i}
                  href={item.href}
                  className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground ${
                    active ? "bg-muted text-foreground" : ""
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Link>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1">
        <form>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search meetings, tasks..."
              className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
            />
          </div>
        </form>
      </div>
      <div className="flex items-center gap-2">
        <Show when="signed-in">
          <UserButton />
        </Show>
        <Show when="signed-out">
          <SignInButton>
            <button className={buttonVariants({ variant: "secondary", size: "sm" })}>
              Sign in
            </button>
          </SignInButton>
        </Show>
      </div>
    </header>
  )
}
