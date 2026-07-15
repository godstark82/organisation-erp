import {
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  Square3Stack3DIcon,
} from "@heroicons/react/24/outline"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Note } from "@/components/ui/note"
import { DashboardCharts } from "@/features/dashboard/components/dashboard-charts"
import { DashboardSidePanels } from "@/features/dashboard/components/dashboard-side-panels"
import { requireSession } from "@/lib/auth/session"
import { getDashboardStats } from "@/lib/repositories/dashboard.repository"
import { formatCurrency } from "@/lib/utils"

export default async function DashboardPage() {
  const session = await requireSession()
  const orgId = session.profile.organization_id ?? undefined

  let stats
  let error: string | null = null

  try {
    stats = await getDashboardStats(orgId)
  } catch {
    error = "Unable to load dashboard data. Please try again shortly."
    stats = null
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 sm:p-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${session.profile.full_name.split(" ")[0]}. Here is your agency overview.`}
      />

      {error && (
        <Note intent="danger" className="text-sm">
          {error}
        </Note>
      )}

      {stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Revenue"
              value={formatCurrency(stats.revenue)}
              icon={<BanknotesIcon />}
            />
            <StatCard
              label="Pending payments"
              value={formatCurrency(stats.pendingPayments)}
              icon={<ClockIcon />}
            />
            <StatCard
              label="Overdue"
              value={formatCurrency(stats.overduePayments)}
              icon={<ExclamationTriangleIcon />}
            />
            <StatCard
              label="Active projects"
              value={stats.activeProjects}
              icon={<Square3Stack3DIcon />}
            />
            <StatCard
              label="Completed projects"
              value={stats.completedProjects}
              icon={<CheckCircleIcon />}
            />
            <StatCard
              label="Awaiting verification"
              value={stats.awaitingVerification}
              icon={<ShieldCheckIcon />}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
            <div className="min-w-0 space-y-6">
              <DashboardCharts stats={stats} />
            </div>
            <aside className="min-w-0">
              <DashboardSidePanels stats={stats} />
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
