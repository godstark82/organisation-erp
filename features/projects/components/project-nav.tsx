"use client"

import { usePathname } from "next/navigation"
import { twMerge } from "tailwind-merge"
import { TabScrollArea } from "@/components/ui/tabs"
import { Link } from "@/components/ui/link"

const PROJECT_TABS = [
  { href: "", label: "Overview" },
  { href: "/payments", label: "Payments" },
  { href: "/team", label: "Team" },
  { href: "/activity", label: "Activity" },
] as const

export interface ProjectNavProps {
  projectId: string
}

export function ProjectNav({ projectId }: ProjectNavProps) {
  const pathname = usePathname()
  const base = `/projects/${projectId}`

  const activeHref =
    PROJECT_TABS.find((tab) => {
      const full = `${base}${tab.href}`
      if (tab.href === "") return pathname === base
      return pathname.startsWith(full)
    })?.href ?? ""

  return (
    <TabScrollArea>
      <nav
        aria-label="Project sections"
        className="relative flex min-w-max gap-x-1 rounded-lg py-1"
      >
        {PROJECT_TABS.map((tab) => {
          const href = `${base}${tab.href}`
          const isActive = tab.href === activeHref
          return (
            <Link
              key={tab.href}
              href={href}
              className={twMerge(
                "relative rounded-lg px-2.5 py-1.5 font-medium text-sm/6 no-underline transition",
                isActive
                  ? "bg-primary-subtle text-primary-subtle-fg"
                  : "text-muted-fg hover:bg-secondary hover:text-fg"
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </TabScrollArea>
  )
}
