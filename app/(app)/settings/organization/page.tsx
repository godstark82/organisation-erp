import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Note } from "@/components/ui/note"
import { requireSession } from "@/lib/auth/session"
import { formatDate } from "@/lib/utils"

export default async function OrganizationSettingsPage() {
  const session = await requireSession()
  const org = session.organization

  if (!org) {
    return (
      <Note intent="warning">
        No organization linked to your account.
      </Note>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader
        title="Organization"
        description="Your agency profile and workspace identity."
      />
      <CardContent className="space-y-6 py-0">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="font-medium text-muted-fg text-xs uppercase tracking-wide">
              Name
            </dt>
            <dd className="mt-1 text-sm">{org.name}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-fg text-xs uppercase tracking-wide">
              Slug
            </dt>
            <dd className="mt-1 font-mono text-sm">{org.slug}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-fg text-xs uppercase tracking-wide">
              Plan
            </dt>
            <dd className="mt-1 text-sm capitalize">{org.subscription_plan}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-fg text-xs uppercase tracking-wide">
              Status
            </dt>
            <dd className="mt-1 text-sm capitalize">
              {org.subscription_status.replace(/_/g, " ")}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-muted-fg text-xs uppercase tracking-wide">
              Logo
            </dt>
            <dd className="mt-1 text-sm">
              {org.logo_url ? (
                <span className="text-primary">{org.logo_url}</span>
              ) : (
                "Not set"
              )}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-muted-fg text-xs uppercase tracking-wide">
              Created
            </dt>
            <dd className="mt-1 text-sm">{formatDate(org.created_at)}</dd>
          </div>
        </dl>
        <Note intent="default" className="text-sm">
          Organization settings are read-only in demo mode. Connect Supabase to
          enable editing.
        </Note>
      </CardContent>
    </Card>
  )
}
