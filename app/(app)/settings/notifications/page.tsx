import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Note } from "@/components/ui/note"
import { requireSession } from "@/lib/auth/session"

const NOTIFICATION_PREFS = [
  {
    id: "deadline_tomorrow",
    label: "Deadline reminders",
    description: "Upcoming project deadlines and milestones",
    defaultOn: true,
  },
  {
    id: "payment_under_review",
    label: "Payment reviews",
    description: "Payments awaiting verification",
    defaultOn: true,
  },
  {
    id: "comment_added",
    label: "Comments & mentions",
    description: "New comments and @mentions on your work",
    defaultOn: true,
  },
  {
    id: "project_update",
    label: "Project updates",
    description: "Status changes on projects you follow",
    defaultOn: false,
  },
  {
    id: "dispute_raised",
    label: "Payment disputes",
    description: "Disputes raised on payments",
    defaultOn: true,
  },
] as const

export default async function NotificationSettingsPage() {
  const session = await requireSession()
  const prefs = (session.profile.preferences?.notifications ?? {}) as Record<
    string,
    boolean
  >

  return (
    <Card className="shadow-sm">
      <CardHeader
        title="Notification preferences"
        description="Choose which events trigger in-app notifications."
      />
      <CardContent className="divide-y divide-border py-0">
        {NOTIFICATION_PREFS.map((pref) => {
          const isOn = prefs[pref.id] ?? pref.defaultOn
          return (
            <div
              key={pref.id}
              className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="font-medium text-sm">{pref.label}</p>
                <p className="text-muted-fg text-xs">{pref.description}</p>
              </div>
              <span
                className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-muted-fg text-xs"
                aria-label={pref.label}
              >
                {isOn ? "On" : "Off"}
              </span>
            </div>
          )
        })}
        <Note intent="default" className="mt-4 text-sm">
          Preferences are display-only in demo mode. Saving will be enabled with
          profile updates in production.
        </Note>
      </CardContent>
    </Card>
  )
}
