import { notFound } from "next/navigation"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { UserAvatar } from "@/components/shared/user-avatar"
import { PriorityIndicator } from "@/components/shared/priority-indicator"
import { requireSession } from "@/lib/auth/session"
import { ORG_ID } from "@/lib/data/demo-store"
import {
  getProject,
  listProjectMembers,
} from "@/lib/repositories/projects.repository"
import {
  listPayments,
} from "@/lib/repositories/payments.repository"
import { summarizePayments } from "@/features/payments/lib/summary"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { PriorityLevel, ProjectStatus } from "@/types"

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSession()
  const { id } = await params
  const project = await getProject(id)

  if (!project) notFound()

  const orgId = project.organization_id ?? ORG_ID

  const [payments, members] = await Promise.all([
    listPayments({ projectId: id, organizationId: orgId }),
    listProjectMembers(id),
  ])

  const summary = summarizePayments(payments)
  const remaining = Math.max(project.budget - summary.verifiedAmount, 0)

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Budget" value={formatCurrency(project.budget, project.currency)} />
        <StatCard
          label="Collected"
          value={formatCurrency(summary.verifiedAmount, project.currency)}
        />
        <StatCard
          label="Pending"
          value={formatCurrency(summary.pendingAmount, project.currency)}
        />
        <StatCard
          label="Remaining"
          value={formatCurrency(remaining, project.currency)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-xl border border-border p-5 lg:col-span-2">
          <h2 className="font-medium text-fg text-sm/6">Project details</h2>
          {project.description ? (
            <p className="whitespace-pre-wrap text-pretty text-muted-fg text-sm/6">
              {project.description}
            </p>
          ) : (
            <p className="text-muted-fg text-sm/6">No description provided.</p>
          )}

          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-muted-fg text-xs/5">Status</dt>
              <dd className="mt-1">
                <StatusBadge type="project" status={project.status as ProjectStatus} />
              </dd>
            </div>
            <div>
              <dt className="text-muted-fg text-xs/5">Type</dt>
              <dd className="mt-1 text-fg text-sm/6">
                {project.category?.name ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-fg text-xs/5">Priority</dt>
              <dd className="mt-1">
                <PriorityIndicator
                  priority={project.priority as PriorityLevel}
                  showLabel
                />
              </dd>
            </div>
            <div>
              <dt className="text-muted-fg text-xs/5">Client</dt>
              <dd className="mt-1 text-fg text-sm/6">
                {project.client?.company_name ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-fg text-xs/5">Start date</dt>
              <dd className="mt-1 text-fg text-sm/6">{formatDate(project.start_date)}</dd>
            </div>
            <div>
              <dt className="text-muted-fg text-xs/5">Deadline</dt>
              <dd className="mt-1 text-fg text-sm/6">{formatDate(project.deadline)}</dd>
            </div>
            <div>
              <dt className="text-muted-fg text-xs/5">Last payment</dt>
              <dd className="mt-1 text-fg text-sm/6">
                {summary.lastPaidAt ? formatDate(summary.lastPaidAt) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-fg text-xs/5">Payment records</dt>
              <dd className="mt-1 text-fg text-sm/6">{summary.totalCount}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-border p-5">
          <h2 className="mb-4 font-medium text-fg text-sm/6">Assigned team</h2>
          {members.length === 0 ? (
            <p className="text-muted-fg text-sm">No assignees yet.</p>
          ) : (
            <ul className="space-y-3">
              {members.map((member) => (
                <li key={member.id} className="flex items-center gap-3">
                  <UserAvatar profile={member.user} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">
                      {member.user?.full_name ?? "Member"}
                    </p>
                    <p className="truncate text-muted-fg text-xs">{member.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
