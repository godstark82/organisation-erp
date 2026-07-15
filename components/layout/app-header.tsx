"use client"

import {
  BellIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline"
import { useTheme } from "@/components/theme-provider"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { logout } from "@/features/auth/actions"
import type { Notification, SessionUser } from "@/types"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Breadcrumbs, BreadcrumbsItem } from "@/components/ui/breadcrumbs"
import { Button } from "@/components/ui/button"
import { Keyboard } from "@/components/ui/keyboard"
import {
  Menu,
  MenuContent,
  MenuHeader,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationsPanel } from "./notifications-panel"

interface AppHeaderProps {
  user: SessionUser
  unreadCount?: number
  notifications?: Notification[]
  onOpenCommandPalette: () => void
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  calendar: "Calendar",
  projects: "Projects",
  clients: "Clients",
  developers: "Developers",
  payments: "Payments",
  reports: "Reports",
  settings: "Settings",
  notifications: "Notifications",
  organization: "Organization",
  categories: "Project types",
  branding: "Branding",
  roles: "Roles",
  security: "Security",
  team: "Team",
  activity: "Activity",
  overview: "Overview",
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function useBreadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0) {
    return [{ href: "/dashboard", label: "Dashboard", isCurrent: true }]
  }

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`
    const isUuid = UUID_RE.test(segment)
    return {
      href,
      label: isUuid
        ? "Details"
        : (ROUTE_LABELS[segment] ?? segment.replace(/-/g, " ")),
      isCurrent: index === segments.length - 1,
      isUuid,
    }
  })

  // On narrow headers keep first + last when path is deep
  if (crumbs.length > 3) {
    return [crumbs[0], { ...crumbs[crumbs.length - 1], label: crumbs[crumbs.length - 1].label }]
  }

  return crumbs
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <Button
      intent="plain"
      size="sq-sm"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      isDisabled={!mounted}
      onPress={() => setTheme(isDark ? "light" : "dark")}
    >
      <SunIcon className="size-4 dark:hidden" />
      <MoonIcon className="hidden size-4 dark:block" />
    </Button>
  )
}

export function AppHeader({
  user,
  unreadCount = 0,
  notifications = [],
  onOpenCommandPalette,
}: AppHeaderProps) {
  const crumbs = useBreadcrumbs()
  const initials = user.profile.full_name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-sidebar-border border-b bg-bg/80 px-3 backdrop-blur-md sm:gap-3 sm:px-4">
      <SidebarTrigger className="shrink-0" />

      <Breadcrumbs className="hidden min-w-0 flex-1 overflow-hidden sm:flex">
        {crumbs.map((crumb) => (
          <BreadcrumbsItem
            key={crumb.href}
            href={crumb.href}
            isDisabled={crumb.isCurrent}
            className={
              crumb.isCurrent
                ? "max-w-[10rem] truncate font-medium text-fg capitalize sm:max-w-none"
                : "max-w-[8rem] truncate capitalize sm:max-w-none"
            }
          >
            {crumb.label}
          </BreadcrumbsItem>
        ))}
      </Breadcrumbs>

      <p className="min-w-0 flex-1 truncate font-medium text-fg text-sm sm:hidden">
        {crumbs[crumbs.length - 1]?.label ?? "AgencyOS"}
      </p>

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <Button
          intent="outline"
          size="sm"
          className="hidden max-w-52 justify-start gap-2 text-muted-fg md:inline-flex"
          onPress={onOpenCommandPalette}
        >
          <MagnifyingGlassIcon className="size-4" />
          <span className="flex-1 text-start">Search…</span>
          <Keyboard className="text-xs">
            <kbd>⌘</kbd>
            <kbd>K</kbd>
          </Keyboard>
        </Button>

        <Button
          intent="plain"
          size="sq-sm"
          className="md:hidden"
          aria-label="Search"
          onPress={onOpenCommandPalette}
        >
          <MagnifyingGlassIcon className="size-4" />
        </Button>

        <NotificationsPanel unreadCount={unreadCount} notifications={notifications}>
          <Button intent="plain" size="sq-sm" aria-label="Notifications">
            <span className="relative">
              <BellIcon className="size-4" />
              {unreadCount > 0 && (
                <Badge
                  intent="primary"
                  className="absolute -top-1.5 -right-1.5 min-w-4 px-1 py-0 text-[10px]"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </span>
          </Button>
        </NotificationsPanel>

        <ThemeToggle />

        <Menu>
          <MenuTrigger aria-label="User menu">
            <Avatar size="sm" initials={initials} alt={user.profile.full_name} />
          </MenuTrigger>
          <MenuContent placement="bottom end" className="min-w-52">
            <MenuHeader separator>
              <div className="px-0.5">
                <p className="font-medium text-sm">{user.profile.full_name}</p>
                <p className="truncate text-muted-fg text-xs">{user.email}</p>
              </div>
            </MenuHeader>
            <MenuItem href="/settings">Settings</MenuItem>
            <MenuSeparator />
            <MenuItem
              intent="danger"
              onAction={() => {
                void logout()
              }}
            >
              Sign out
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>
    </header>
  )
}
