"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { CheckCircleIcon, SparklesIcon } from "@heroicons/react/24/outline"
import { DateRangeFilters } from "@/components/shared/date-range-filters"
import { FilterBar } from "@/components/shared/filter-bar"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { buttonStyles } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader } from "@/components/ui/card"
import { NativeSelect, NativeSelectContent } from "@/components/ui/native-select"
import {
  isNonDefaultDateRange,
  resolveDateRangeFromParams,
} from "@/lib/date-range"
import { formatCurrency } from "@/lib/utils"
import type {
  AgencyDashboardProjectRow,
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
  defaultMemberId: string
  lockedMemberId?: string | null
  canFilterMembers?: boolean
}

function ProjectMoneyList({
  projects,
  emptyMessage,
  amountLabel,
}: {
  projects: AgencyDashboardProjectRow[]
  emptyMessage: string
  amountLabel: string
}) {
  if (projects.length === 0) {
    return (
      <p className="py-8 text-center text-muted-fg text-sm">{emptyMessage}</p>
    )
  }

  return (
    <ul className="divide-y divide-border">
      {projects.map((project) => (
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
              <span className="text-muted-fg text-xs">{project.clientName}</span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-semibold tabular-nums text-sm">
              {formatCurrency(project.amount, project.currency)}
            </p>
            <p className="text-muted-fg text-xs">{amountLabel}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function AgencyDashboardView({
  firstName,
  stats,
  categories,
  developers,
  defaultMemberId,
  lockedMemberId = null,
  canFilterMembers = true,
}: AgencyDashboardViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryFilter = searchParams.get("category") ?? ""
  const developerParam = searchParams.get("developer")
  const memberFilter =
    lockedMemberId ??
    (developerParam === "all"
      ? ""
      : developerParam || defaultMemberId)
  const dateRange = resolveDateRangeFromParams({
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    range: searchParams.get("range"),
  })

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

  const applyDateRange = useCallback(
    (next: { from: string; to: string; range: string }) => {
      if (next.range === "all") {
        updateParams({ from: "", to: "", range: "all" })
        return
      }
      if (next.range === "this_month") {
        updateParams({ from: "", to: "", range: "" })
        return
      }
      updateParams({
        from: next.from,
        to: next.to,
        range: next.range === "custom" ? "custom" : next.range,
      })
    },
    [updateParams]
  )

  const hasFilters = Boolean(
    categoryFilter ||
      isNonDefaultDateRange(dateRange) ||
      (!lockedMemberId &&
        developerParam != null &&
        developerParam !== defaultMemberId)
  )

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 sm:p-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${firstName}. Pending work is potential; completed work is what you can expect.`}
        actions={
          <Link href="/projects" className={buttonStyles({ intent: "primary" })}>
            View projects
          </Link>
        }
      />

      <FilterBar
        onClear={() => {
          if (canFilterMembers && !lockedMemberId) {
            router.replace("/dashboard?developer=all")
          } else {
            router.replace("/dashboard")
          }
        }}
        hasActiveFilters={hasFilters}
        filters={
          <>
            <DateRangeFilters
              from={dateRange.from ?? ""}
              to={dateRange.to ?? ""}
              preset={dateRange.preset}
              onChange={applyDateRange}
            />

            <NativeSelect className="w-full min-w-0">
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

            {canFilterMembers && !lockedMemberId ? (
              <NativeSelect className="w-full min-w-0">
                <NativeSelectContent
                  value={memberFilter}
                  onChange={(event) => {
                    const value = event.target.value
                    updateParams({
                      developer: value ? value : "all",
                    })
                  }}
                  aria-label="Filter by member"
                >
                  <option value="">All members</option>
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-bg p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-muted-fg text-sm">Pending projects</p>
              <p className="mt-1 font-semibold text-3xl tabular-nums tracking-tight">
                {stats.pendingCount}
              </p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary-subtle/40 text-primary">
              <SparklesIcon className="size-5" />
            </span>
          </div>
          <p className="mt-4 text-muted-fg text-sm">Potential</p>
          <p className="font-semibold text-2xl tabular-nums tracking-tight">
            {formatCurrency(stats.pendingPotential)}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-bg p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-muted-fg text-sm">Completed projects</p>
              <p className="mt-1 font-semibold text-3xl tabular-nums tracking-tight">
                {stats.completedCount}
              </p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-lg bg-success/15 text-success">
              <CheckCircleIcon className="size-5" />
            </span>
          </div>
          <p className="mt-4 text-muted-fg text-sm">Expected</p>
          <p className="font-semibold text-2xl tabular-nums tracking-tight">
            {formatCurrency(stats.completedExpected)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader
            title="Pending"
            description="Open projects — remaining budget as potential"
          >
            <CardAction>
              <Link
                href="/projects"
                className="text-primary text-sm hover:underline"
              >
                All projects
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ProjectMoneyList
              projects={stats.pendingProjects}
              emptyMessage="No pending projects for these filters."
              amountLabel="Potential"
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader
            title="Completed"
            description="Delivered projects — remaining budget you can expect"
          >
            <CardAction>
              <Link
                href="/projects?status=completed"
                className="text-primary text-sm hover:underline"
              >
                Completed
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ProjectMoneyList
              projects={stats.completedProjects}
              emptyMessage="No completed projects for these filters."
              amountLabel="Expected"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
