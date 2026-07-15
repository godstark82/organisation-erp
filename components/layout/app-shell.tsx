"use client"

import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import {
  CommandPalette,
  useCommandPalette,
} from "@/components/layout/command-palette"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import type { Notification, SessionUser } from "@/types"

interface AppShellProps {
  user: SessionUser
  unreadCount?: number
  notifications?: Notification[]
  children: React.ReactNode
}

export function AppShell({
  user,
  unreadCount = 0,
  notifications = [],
  children,
}: AppShellProps) {
  const { open, setOpen } = useCommandPalette()

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <AppHeader
          user={user}
          unreadCount={unreadCount}
          notifications={notifications}
          onOpenCommandPalette={() => setOpen(true)}
        />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </SidebarInset>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </SidebarProvider>
  )
}
