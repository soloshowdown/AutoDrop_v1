import React from "react"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row mx-auto px-4">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by{" "}
            <a
              href="#"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              AutoDrop
            </a>
            . The source code is available on GitHub.
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="#" className="text-sm font-medium text-muted-foreground hover:underline">
            Terms
          </Link>
          <Link href="#" className="text-sm font-medium text-muted-foreground hover:underline">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  )
}
