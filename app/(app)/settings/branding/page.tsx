import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Note } from "@/components/ui/note"
import { requireSession } from "@/lib/auth/session"

export default async function BrandingSettingsPage() {
  const session = await requireSession()
  const org = session.organization
  const branding = (org?.branding ?? {}) as Record<string, string>

  return (
    <Card className="shadow-sm">
      <CardHeader
        title="Branding"
        description="Colors and visual identity for client-facing materials."
      />
      <CardContent className="space-y-6 py-0">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="font-medium text-muted-fg text-xs uppercase tracking-wide">
              Primary color
            </dt>
            <dd className="mt-2 flex items-center gap-2">
              <span
                className="size-8 rounded-lg border border-border"
                style={{
                  backgroundColor: branding.primary_color ?? "#2563eb",
                }}
              />
              <span className="font-mono text-sm">
                {branding.primary_color ?? "#2563eb"}
              </span>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-muted-fg text-xs uppercase tracking-wide">
              Accent color
            </dt>
            <dd className="mt-2 flex items-center gap-2">
              <span
                className="size-8 rounded-lg border border-border"
                style={{ backgroundColor: branding.accent ?? "#0ea5e9" }}
              />
              <span className="font-mono text-sm">
                {branding.accent ?? "#0ea5e9"}
              </span>
            </dd>
          </div>
        </dl>
        <Note intent="default" className="text-sm">
          Branding customisation will apply to the portal and email
          templates when connected to production.
        </Note>
      </CardContent>
    </Card>
  )
}
