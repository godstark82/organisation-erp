"use client"

import { usePathname } from "next/navigation"
import { twMerge } from "tailwind-merge"
import { Link } from "@/components/ui/link"
import { TabScrollArea } from "@/components/ui/tabs"

export const SETTINGS_NAV = [
  { href: "/settings/organization", label: "Organization" },
  { href: "/settings/categories", label: "Project types" },
  { href: "/settings/branding", label: "Branding" },
  { href: "/settings/roles", label: "Roles & Permissions" },
  { href: "/settings/notifications", label: "Notifications" },
  { href: "/settings/security", label: "Security" },
] as const

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Settings" className="min-w-0 shrink-0 lg:w-52">
      <TabScrollArea className="lg:overflow-x-visible">
        <div className="flex min-w-max gap-1 pb-1 lg:min-w-0 lg:flex-col lg:gap-0.5 lg:border-border lg:border-r lg:pb-0 lg:pr-6">
          {SETTINGS_NAV.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={twMerge(
                  "whitespace-nowrap rounded-lg px-3 py-2 font-medium text-sm/6 no-underline transition",
                  isActive
                    ? "bg-primary-subtle text-primary-subtle-fg"
                    : "text-muted-fg hover:bg-secondary hover:text-fg"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </TabScrollArea>
    </nav>
  )
}
