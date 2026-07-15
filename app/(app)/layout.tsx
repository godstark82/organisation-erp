import { redirect } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { getSession } from "@/lib/auth/session"
import { ORG_ID } from "@/lib/data/demo-store"
import {
  getUnreadCount,
  listNotifications,
} from "@/lib/repositories/notifications.repository"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const orgId = session.profile.organization_id ?? ORG_ID

  const [unreadCount, notifications] = await Promise.all([
    getUnreadCount(session.id, orgId),
    listNotifications({ userId: session.id, organizationId: orgId, limit: 8 }),
  ])

  return (
    <AppShell
      user={session}
      unreadCount={unreadCount}
      notifications={notifications}
    >
      {children}
    </AppShell>
  )
}
