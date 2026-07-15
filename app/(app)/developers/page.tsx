import { Suspense } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { LoadingSkeleton } from "@/components/shared/loading-skeleton"
import { DevelopersTable } from "@/features/developers/components/developers-table"
import { requireSession } from "@/lib/auth/session"
import { ORG_ID } from "@/lib/data/demo-store"
import { listProfiles } from "@/lib/repositories/profiles.repository"
import { hasPermission } from "@/lib/rbac"
import type { AppRole, Profile } from "@/types"

interface DevelopersPageProps {
  searchParams: Promise<{
    search?: string
    role?: string
  }>
}

export default async function DevelopersPage({ searchParams }: DevelopersPageProps) {
  const session = await requireSession()
  const params = await searchParams
  const orgId = session.organization?.id ?? session.profile.organization_id ?? ORG_ID
  const canManage = hasPermission(session.permissions, "users.manage")

  const roleParam = params.role
  const roles =
    roleParam &&
    ["developer", "designer", "manager", "accountant"].includes(roleParam)
      ? ([roleParam] as AppRole[])
      : undefined

  let developers: Profile[] = []
  let error: string | null = null

  try {
    developers = await listProfiles({
      organizationId: orgId,
      roles,
      excludeRoles: ["client"],
      activeOnly: false,
      search: params.search,
    })
  } catch {
    error = "Unable to load developers. Please try again."
    developers = []
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Developers"
        description="Manage your team and assign them to projects."
      />

      {error && (
        <p className="rounded-lg border border-danger/30 bg-danger-subtle px-4 py-3 text-danger-subtle-fg text-sm">
          {error}
        </p>
      )}

      <Suspense fallback={<LoadingSkeleton variant="table" />}>
        <DevelopersTable initialDevelopers={developers} canManage={canManage} />
      </Suspense>
    </div>
  )
}
