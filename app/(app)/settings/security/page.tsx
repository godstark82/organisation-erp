import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Note } from "@/components/ui/note"
import { requireSession } from "@/lib/auth/session"
import { ROLE_LABELS } from "@/lib/rbac"
import { formatDate, formatRelative } from "@/lib/utils"

export default async function SecuritySettingsPage() {
  const session = await requireSession()

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader
          title="Security"
          description="Session and account security settings."
        />
        <CardContent className="space-y-6 py-0">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="font-medium text-muted-fg text-xs uppercase tracking-wide">
                Email
              </dt>
              <dd className="mt-1 text-sm">{session.email}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-fg text-xs uppercase tracking-wide">
                Role
              </dt>
              <dd className="mt-1">
                <Badge intent="secondary">
                  {ROLE_LABELS[session.profile.role]}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted-fg text-xs uppercase tracking-wide">
                Last seen
              </dt>
              <dd className="mt-1 text-sm">
                {session.profile.last_seen_at
                  ? formatRelative(session.profile.last_seen_at)
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted-fg text-xs uppercase tracking-wide">
                Account created
              </dt>
              <dd className="mt-1 text-sm">
                {formatDate(session.profile.created_at)}
              </dd>
            </div>
          </dl>

          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Two-factor authentication</p>
                <p className="text-muted-fg text-xs">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Badge intent="warning">Not enabled</Badge>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Active sessions</p>
                <p className="text-muted-fg text-xs">
                  Devices currently signed in to your account
                </p>
              </div>
              <Badge intent="success">1 active</Badge>
            </div>
          </div>

          <Note intent="default" className="text-sm">
            Password changes and session management require Supabase Auth in
            production.
          </Note>
        </CardContent>
      </Card>
    </div>
  )
}
