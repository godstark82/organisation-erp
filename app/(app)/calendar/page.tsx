import { PageHeader } from "@/components/shared/page-header"
import { Note } from "@/components/ui/note"
import { CalendarView } from "@/features/calendar/components/calendar-view"
import {
  getUnifiedCalendarEvents,
  type UnifiedCalendarEvent,
} from "@/features/calendar/lib/unified-events"
import { requireSession } from "@/lib/auth/session"
import { hasPermission } from "@/lib/rbac"

export default async function CalendarPage() {
  const session = await requireSession()
  const orgId = session.profile.organization_id ?? undefined

  if (!hasPermission(session.permissions, "calendar.view")) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        <PageHeader title="Calendar" description="You do not have access to the calendar." />
        <Note intent="danger">Unauthorized</Note>
      </div>
    )
  }

  let events: UnifiedCalendarEvent[] = []
  let error: string | null = null

  try {
    events = await getUnifiedCalendarEvents(orgId)
  } catch {
    error = "Unable to load calendar events. Please try again shortly."
    events = []
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Calendar"
        description="Project deadlines, payments, meetings, and milestones in one view."
      />

      {error && (
        <Note intent="danger" className="text-sm">
          {error}
        </Note>
      )}

      <CalendarView events={events} />
    </div>
  )
}
