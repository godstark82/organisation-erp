"use client"

import Link from "next/link"
import {
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  HandRaisedIcon,
  PauseCircleIcon,
  Square3Stack3DIcon,
} from "@heroicons/react/24/outline"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { buttonStyles } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { ClientDashboardStats, ProjectStatus } from "@/types"

interface ClientDashboardViewProps {
  firstName: string
  stats: ClientDashboardStats
}

export function ClientDashboardView({
  firstName,
  stats,
}: ClientDashboardViewProps) {
  return (
    <div className="flex flex-1 flex-col gap-8 p-4 sm:p-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${firstName}. Here’s your payment and project overview for ${stats.clientName}.`}
        actions={
          <Link href="/payments" className={buttonStyles({ intent: "primary" })}>
            Go to payments
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Balance due"
          value={formatCurrency(stats.amountDue)}
          icon={<BanknotesIcon />}
          delta={{
            value: 0,
            label:
              stats.totalBudget > 0
                ? `${formatCurrency(stats.amountPaid)} paid of ${formatCurrency(stats.totalBudget)} budget`
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
                ? "Nothing waiting on you"
                : `${stats.awaitingYourAcceptanceCount} payment${stats.awaitingYourAcceptanceCount === 1 ? "" : "s"} recorded by the team`,
          }}
        />
        <StatCard
          label="Paid to date"
          value={formatCurrency(stats.amountPaid)}
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
            title="Needs your acceptance"
            description="Payments recorded by the project team — confirm to verify"
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
                You’re all caught up — no payments waiting for your acceptance.
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
                        Recorded {formatDate(payment.createdAt)}
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
            title="Outstanding by project"
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
                No outstanding balances — budgets are fully covered or not set.
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
