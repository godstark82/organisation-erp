import { PageHeader } from "@/components/shared/page-header"
import { NotificationsList } from "@/features/notifications/components/notifications-list"
import { requireSession } from "@/lib/auth/session"
import { ORG_ID } from "@/lib/data/demo-store"
import { listNotifications } from "@/lib/repositories/notifications.repository"

export default async function NotificationsPage() {
  const session = await requireSession()
  const orgId = session.profile.organization_id ?? ORG_ID

  const notifications = await listNotifications({
    userId: session.id,
    organizationId: orgId,
    limit: 100,
  })

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Notifications"
        description="All activity and alerts for your account."
      />
      <NotificationsList notifications={notifications} />
    </div>
  )
}
