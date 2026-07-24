import { Suspense } from "react"
import { Note } from "@/components/ui/note"
import { PageHeader } from "@/components/shared/page-header"
import { LoadingSkeleton } from "@/components/shared/loading-skeleton"
import { AgencyDashboardView } from "@/features/dashboard/components/agency-dashboard-view"
import { ClientDashboardView } from "@/features/dashboard/components/client-dashboard-view"
import { requireSession } from "@/lib/auth/session"
import { isAdminRole } from "@/lib/rbac"
import { getClientByPortalUserId } from "@/lib/repositories/clients.repository"
import {
  getAgencyDashboardStats,
  getClientDashboardStats,
} from "@/lib/repositories/dashboard.repository"
import { listProfiles } from "@/lib/repositories/profiles.repository"
import { listProjectCategories } from "@/lib/repositories/projects.repository"
import { resolveDateRangeFromParams } from "@/lib/date-range"

interface DashboardPageProps {
  searchParams: Promise<{
    category?: string
    developer?: string
    from?: string
    to?: string
    range?: string
  }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await requireSession()
  const orgId = session.profile.organization_id ?? undefined
  const role = session.profile.role
  const isClient = role === "client"
  const firstName = session.profile.full_name.split(" ")[0]
  const params = await searchParams

  if (isClient) {
    let clientStats = null
    let error: string | null = null

    try {
      const linked = await getClientByPortalUserId(session.id)
      if (!linked) {
        error =
          "Your account is not linked to a client profile. Ask your agency to set up portal access."
      } else {
        clientStats = await getClientDashboardStats(linked.id, orgId)
      }
    } catch {
      error = "Unable to load your dashboard. Please try again shortly."
    }

    if (error && !clientStats) {
      return (
        <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
          <PageHeader title="Dashboard" description={`Welcome, ${firstName}.`} />
          <Note intent="danger" className="text-sm">
            {error}
          </Note>
        </div>
      )
    }

    if (clientStats) {
      return <ClientDashboardView firstName={firstName} stats={clientStats} />
    }
  }

  const canFilterMembers = isAdminRole(role)
  /** Non-admins stay on their own projects; admins default to self but can change */
  const lockedMemberId = canFilterMembers ? null : session.id
  const developerParam = params.developer
  const memberUserId =
    lockedMemberId ??
    (developerParam === "all"
      ? undefined
      : developerParam || session.id)
  const categoryId = params.category || undefined
  const dateRange = resolveDateRangeFromParams({
    from: params.from,
    to: params.to,
    range: params.range,
  })

  let stats = null
  let categories: Awaited<ReturnType<typeof listProjectCategories>> = []
  let developers: Awaited<ReturnType<typeof listProfiles>> = []
  let error: string | null = null

  try {
    const [agencyStats, cats, members] = await Promise.all([
      getAgencyDashboardStats({
        organizationId: orgId,
        memberUserId,
        categoryId,
        from: dateRange.from,
        to: dateRange.to,
      }),
      listProjectCategories(orgId),
      canFilterMembers
        ? listProfiles({
            organizationId: orgId,
            excludeRoles: ["client"],
            activeOnly: true,
          })
        : Promise.resolve([]),
    ])
    stats = agencyStats
    categories = cats
    developers = members
  } catch {
    error = "Unable to load dashboard data. Please try again shortly."
  }

  return (
    <Suspense fallback={<LoadingSkeleton variant="card" className="p-4 sm:p-6" />}>
      {error || !stats ? (
        <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
          <PageHeader title="Dashboard" description={`Welcome, ${firstName}.`} />
          <Note intent="danger" className="text-sm">
            {error ?? "Unable to load dashboard data."}
          </Note>
        </div>
      ) : (
        <AgencyDashboardView
          firstName={firstName}
          stats={stats}
          categories={categories}
          developers={developers}
          defaultMemberId={session.id}
          lockedMemberId={lockedMemberId}
          canFilterMembers={canFilterMembers}
        />
      )}
    </Suspense>
  )
}
