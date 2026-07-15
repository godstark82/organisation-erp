"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import {
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  HandRaisedIcon,
  PauseCircleIcon,
  Square3Stack3DIcon,
} from "@heroicons/react/24/outline"
import { FilterBar } from "@/components/shared/filter-bar"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { buttonStyles } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader } from "@/components/ui/card"
import { NativeSelect, NativeSelectContent } from "@/components/ui/native-select"
import { formatCurrency, formatDate } from "@/lib/utils"
import type {
  AgencyDashboardStats,
  Profile,
  ProjectCategory,
  ProjectStatus,
} from "@/types"

interface AgencyDashboardViewProps {
  firstName: string
  stats: AgencyDashboardStats
  categories: ProjectCategory[]
  developers: Profile[]
  /** When set, developer filter is locked to this user (e.g. developer role) */
  lockedDeveloperId?: string | null
  canFilterDevelopers?: boolean
}

export function AgencyDashboardView({
  firstName,
  stats,
  categories,
  developers,
  lockedDeveloperId = null,
  canFilterDevelopers = true,
}: AgencyDashboardViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryFilter = searchParams.get("category") ?? ""
  const developerFilter =
    lockedDeveloperId ?? searchParams.get("developer") ?? ""

  const updateParams = useCallback(
    (patch: Record<string, string>) => {
      const next = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(patch)) {
        if (!value) next.delete(key)
        else next.set(key, value)
      }
      const qs = next.toString()
      router.replace(qs ? `/dashboard?${qs}` : "/dashboard")
    },
    [router, searchParams]
  )

  const hasFilters = Boolean(categoryFilter || (!lockedDeveloperId && developerFilter))

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 sm:p-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${firstName}. Track what’s left to collect and project status.`}
        actions={
          <Link href="/payments" className={buttonStyles({ intent: "primary" })}>
            Go to payments
          </Link>
        }
      />

      <FilterBar
        onClear={() => router.replace("/dashboard")}
        hasActiveFilters={hasFilters}
        filters={
          <>
            <NativeSelect className="w-full sm:w-44">
              <NativeSelectContent
                value={categoryFilter}
                onChange={(event) =>
                  updateParams({ category: event.target.value })
                }
                aria-label="Filter by category"
              >
                <option value="">All categories</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </NativeSelectContent>
            </NativeSelect>

            {canFilterDevelopers && !lockedDeveloperId ? (
              <NativeSelect className="w-full sm:w-48">
                <NativeSelectContent
                  value={developerFilter}
                  onChange={(event) =>
                    updateParams({ developer: event.target.value })
                  }
                  aria-label="Filter by developer"
                >
                  <option value="">All developers</option>
                  {developers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.full_name}
                    </option>
                  ))}
                </NativeSelectContent>
              </NativeSelect>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Amount left"
          value={formatCurrency(stats.amountLeft)}
          icon={<BanknotesIcon />}
          delta={{
            value: 0,
            label:
              stats.totalBudget > 0
                ? `${formatCurrency(stats.amountReceived)} received of ${formatCurrency(stats.totalBudget)} budget`
                : "No project budgets yet",
          }}
          className="sm:col-span-2 xl:col-span-1 border-primary/20 bg-primary-subtle/10"
        />
        <StatCard
          label="Pending projects"
          value={stats.pendingProjects}
          icon={<PauseCircleIcon />}
          delta={{ value: 0, label: "Lead, discussion, planning, or on hold" }}
        />
        <StatCard
          label="Active projects"
          value={stats.activeProjects}
          icon={<Square3Stack3DIcon />}
          delta={{ value: 0, label: "In progress, testing, or review" }}
        />
        <StatCard
          label="Completed projects"
          value={stats.completedProjects}
          icon={<CheckCircleIcon />}
          delta={{ value: 0, label: "Successfully delivered" }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Awaiting your acceptance"
          value={formatCurrency(stats.awaitingYourAcceptanceAmount)}
          icon={<HandRaisedIcon />}
          delta={{
            value: 0,
            label:
              stats.awaitingYourAcceptanceCount === 0
                ? "Nothing waiting on the team"
                : `${stats.awaitingYourAcceptanceCount} payment${stats.awaitingYourAcceptanceCount === 1 ? "" : "s"} accepted by clients`,
          }}
        />
        <StatCard
          label="Received to date"
          value={formatCurrency(stats.amountReceived)}
          icon={<ClockIcon />}
          delta={{
            value: 0,
            label: "Verified payments only",
          }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader
            title="Needs team acceptance"
            description="Client-accepted payments waiting for staff verification"
          >
            <CardAction>
              <Link
                href="/payments"
                className="text-primary text-sm hover:underline"
              >
                View all
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {stats.awaitingYourAcceptance.length === 0 ? (
              <p className="py-8 text-center text-muted-fg text-sm">
                Nothing waiting — no client-accepted payments need review.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {stats.awaitingYourAcceptance.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/payments/${payment.id}`}
                        className="truncate font-medium text-sm hover:text-primary hover:underline"
                      >
                        {payment.projectName}
                      </Link>
                      <p className="text-muted-fg text-xs">
                        {payment.clientName} · {formatDate(payment.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <p className="font-medium tabular-nums text-sm">
                        {formatCurrency(payment.amount, payment.currency)}
                      </p>
                      <Link
                        href={`/payments/${payment.id}`}
                        className={buttonStyles({ intent: "primary", size: "sm" })}
                      >
                        Review
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader
            title="Left to collect by project"
            description="Budget remaining after verified payments"
          >
            <CardAction>
              <Link
                href="/projects"
                className="text-primary text-sm hover:underline"
              >
                Projects
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {stats.projectsWithBalance.length === 0 ? (
              <p className="py-8 text-center text-muted-fg text-sm">
                Nothing left to collect for the current filters.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {stats.projectsWithBalance.map((project) => (
                  <li
                    key={project.id}
                    className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 space-y-1">
                      <Link
                        href={`/projects/${project.id}`}
                        className="truncate font-medium text-sm hover:text-primary hover:underline"
                      >
                        {project.name}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge
                          type="project"
                          status={project.status as ProjectStatus}
                        />
                        <span className="text-muted-fg text-xs">
                          {project.clientName}
                        </span>
                        <span className="text-muted-fg text-xs tabular-nums">
                          {formatCurrency(project.paid, project.currency)} /{" "}
                          {formatCurrency(project.budget, project.currency)}
                        </span>
                      </div>
                    </div>
                    <p className="shrink-0 font-semibold tabular-nums text-sm">
                      {formatCurrency(project.remaining, project.currency)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
