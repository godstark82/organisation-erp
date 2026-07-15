import { redirect } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { SettingsNav } from "@/features/settings/components/settings-nav"
import { requirePermission } from "@/lib/auth/session"

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requirePermission("settings.view")

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Settings"
        description="Manage your organization, branding, and preferences."
      />
      <div className="flex flex-col gap-8 lg:flex-row">
        <SettingsNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
