"use client"

import { PencilSquareIcon } from "@heroicons/react/20/solid"
import {
  CheckCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import type {
  Client,
  Payment,
  Profile,
  Project,
  ProjectCategory,
  ProjectStatus,
} from "@/types"
import { PROJECT_STATUSES, PRIORITIES } from "@/lib/constants"
import {
  isNonDefaultDateRange,
  isTimestampInDateRange,
  resolveDateRangeFromParams,
} from "@/lib/date-range"
import { EmptyState } from "@/components/shared/empty-state"
import { DateRangeFilters } from "@/components/shared/date-range-filters"
import { FilterBar } from "@/components/shared/filter-bar"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "@/components/ui/link"
import { NativeSelect, NativeSelectContent } from "@/components/ui/native-select"
import {
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ProjectForm } from "@/features/projects/components/project-form"
import { useProjectsPageQuery } from "@/features/projects/hooks"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { fetchProjectsPageQuery } from "@/features/projects/queries"

export interface ProjectsListProps {
  initialData: Awaited<ReturnType<typeof fetchProjectsPageQuery>>
}

function projectPaymentSummary(project: Project, payments: Payment[]) {
  const related = payments.filter((p) => p.project_id === project.id)
  const paid = related
    .filter((p) => p.status === "verified")
    .reduce((sum, p) => sum + p.amount, 0)
  const pending = related
    .filter((p) =>
      ["pending", "client_marked_paid", "under_review"].includes(p.status)
    )
    .reduce((sum, p) => sum + p.amount, 0)
  return { paid, pending, remaining: Math.max(project.budget - paid, 0) }
}

type ProjectPaymentStatus = "pending" | "partial" | "completed" | "no_budget"

function projectPaymentStatus(
  project: Project,
  summary: ReturnType<typeof projectPaymentSummary>
): ProjectPaymentStatus {
  if (project.budget <= 0) return "no_budget"
  if (summary.paid >= project.budget) return "completed"
  if (summary.paid > 0) return "partial"
  return "pending"
}

const PROJECT_PAYMENT_STATUS_BADGE: Record<
  ProjectPaymentStatus,
  { label: string; intent: "warning" | "info" | "success" | "outline" }
> = {
  pending: { label: "Pending", intent: "warning" },
  partial: { label: "Partial", intent: "info" },
  completed: { label: "Completed", intent: "success" },
  no_budget: { label: "No budget", intent: "outline" },
}

/** Open work — remaining budget counted as potential */
const OPEN_PROJECT_STATUSES: ProjectStatus[] = [
  "lead",
  "discussion",
  "planning",
  "on_hold",
  "in_progress",
  "testing",
  "client_review",
]

export function ProjectsList({ initialData }: ProjectsListProps) {
  const { data = initialData } = useProjectsPageQuery(initialData)
  const {
    projects,
    clients,
    categories,
    payments,
    developers = [],
    canManage = false,
    canAssignDevelopers = false,
    canFilterMembers = false,
    currentUserId = "",
    isClient = false,
    lockedClientId = null,
  } = data

  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("q") ?? "")
  const [createOpen, setCreateOpen] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)

  const statusFilter = searchParams.get("status") ?? ""
  const priorityFilter = searchParams.get("priority") ?? ""
  const clientFilter = searchParams.get("client") ?? ""
  const categoryFilter = searchParams.get("category") ?? ""
  const developerParam = searchParams.get("developer")
  /** Non-admins stay on their projects; admins default to self but can change */
  const lockedMemberId =
    !isClient && !canFilterMembers ? currentUserId : null
  const developerFilter = isClient
    ? ""
    : lockedMemberId ??
      (developerParam === "all"
        ? ""
        : developerParam || currentUserId)
  const dateRange = resolveDateRangeFromParams({
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    range: searchParams.get("range"),
  })

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value)
        else params.delete(key)
      }
      router.replace(`/projects?${params.toString()}`)
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

  const filtered = useMemo(() => {
    let result = projects
    if (statusFilter) result = result.filter((p) => p.status === statusFilter)
    if (priorityFilter) result = result.filter((p) => p.priority === priorityFilter)
    if (clientFilter) result = result.filter((p) => p.client_id === clientFilter)
    if (categoryFilter) result = result.filter((p) => p.category_id === categoryFilter)
    if (developerFilter) {
      result = result.filter((p) =>
        (p.members ?? []).some((m) => m.user_id === developerFilter)
      )
    }
    if (dateRange.from || dateRange.to) {
      result = result.filter((p) =>
        isTimestampInDateRange(p.created_at, dateRange.from, dateRange.to)
      )
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.project_code.toLowerCase().includes(q) ||
          (p.category?.name.toLowerCase().includes(q) ?? false)
      )
    }
    return result
  }, [
    projects,
    statusFilter,
    priorityFilter,
    clientFilter,
    categoryFilter,
    developerFilter,
    dateRange.from,
    dateRange.to,
    search,
  ])

  const hasActiveFilters = Boolean(
    statusFilter ||
      priorityFilter ||
      clientFilter ||
      categoryFilter ||
      (!isClient &&
        developerParam != null &&
        developerParam !== currentUserId) ||
      isNonDefaultDateRange(dateRange) ||
      search
  )

  const moneySummary = useMemo(() => {
    let pendingCount = 0
    let pendingPotential = 0
    let completedCount = 0
    let completedExpected = 0

    for (const project of filtered) {
      const remaining = projectPaymentSummary(project, payments).remaining
      if (OPEN_PROJECT_STATUSES.includes(project.status as ProjectStatus)) {
        pendingCount += 1
        pendingPotential += remaining
      } else if (project.status === "completed") {
        completedCount += 1
        completedExpected += remaining
      }
    }

    return {
      pendingCount,
      pendingPotential,
      completedCount,
      completedExpected,
    }
  }, [filtered, payments])

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Projects"
        description="Track assignment, status, type, and payment progress."
        actions={
          canManage ? (
            <div className="flex flex-wrap gap-2">
              <Button
                intent="outline"
                size="sm"
                className="sm:size-auto"
                onPress={() => router.push("/settings/categories")}
              >
                Manage types
              </Button>
              <Button intent="primary" onPress={() => setCreateOpen(true)}>
                New project
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-bg p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-muted-fg text-sm">Pending projects</p>
              <p className="mt-1 font-semibold text-3xl tabular-nums tracking-tight">
                {moneySummary.pendingCount}
              </p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary-subtle/40 text-primary">
              <SparklesIcon className="size-5" />
            </span>
          </div>
          <p className="mt-4 text-muted-fg text-sm">Potential</p>
          <p className="font-semibold text-2xl tabular-nums tracking-tight">
            {formatCurrency(moneySummary.pendingPotential)}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-bg p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-muted-fg text-sm">Completed projects</p>
              <p className="mt-1 font-semibold text-3xl tabular-nums tracking-tight">
                {moneySummary.completedCount}
              </p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-lg bg-success/15 text-success">
              <CheckCircleIcon className="size-5" />
            </span>
          </div>
          <p className="mt-4 text-muted-fg text-sm">Expected</p>
          <p className="font-semibold text-2xl tabular-nums tracking-tight">
            {formatCurrency(moneySummary.completedExpected)}
          </p>
        </div>
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search projects…"
        hasActiveFilters={hasActiveFilters}
        collapsibleFilters
        onClear={() => {
          setSearch("")
          router.replace("/projects")
        }}
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
                value={statusFilter}
                onChange={(event) =>
                  updateParams({ status: event.target.value })
                }
                aria-label="Filter by status"
              >
                <option value="">All statuses</option>
                {PROJECT_STATUSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </NativeSelectContent>
            </NativeSelect>

            <NativeSelect className="w-full min-w-0">
              <NativeSelectContent
                value={priorityFilter}
                onChange={(event) =>
                  updateParams({ priority: event.target.value })
                }
                aria-label="Filter by priority"
              >
                <option value="">All priorities</option>
                {PRIORITIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </NativeSelectContent>
            </NativeSelect>

            <NativeSelect className="w-full min-w-0">
              <NativeSelectContent
                value={categoryFilter}
                onChange={(event) =>
                  updateParams({ category: event.target.value })
                }
                aria-label="Filter by type"
              >
                <option value="">All types</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </NativeSelectContent>
            </NativeSelect>

            {!isClient && (
              <NativeSelect className="w-full min-w-0">
                <NativeSelectContent
                  value={clientFilter}
                  onChange={(event) =>
                    updateParams({ client: event.target.value })
                  }
                  aria-label="Filter by client"
                >
                  <option value="">All clients</option>
                  {clients.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.company_name}
                    </option>
                  ))}
                </NativeSelectContent>
              </NativeSelect>
            )}

            {canFilterMembers && !lockedMemberId ? (
              <NativeSelect className="w-full min-w-0">
                <NativeSelectContent
                  value={developerFilter}
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

      {filtered.length === 0 ? (
        <EmptyState
          title={
            hasActiveFilters ? "No projects match your filters" : "No projects yet"
          }
          description={
            hasActiveFilters
              ? "Try adjusting your filters or search query."
              : "Create your first project to get started."
          }
          action={
            canManage
              ? {
                  label: "Create project",
                  intent: "primary",
                  onPress: () => setCreateOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <Table aria-label="Projects">
          <TableHeader>
            <TableColumn isRowHeader>Name</TableColumn>
            <TableColumn className="hidden md:table-cell">Type</TableColumn>
            <TableColumn>Status</TableColumn>
            <TableColumn>Payment</TableColumn>
            <TableColumn className="hidden md:table-cell">Assignees</TableColumn>
            <TableColumn className="hidden sm:table-cell">Paid / Budget</TableColumn>
            <TableColumn className="hidden md:table-cell">Deadline</TableColumn>
            {canManage ? <TableColumn> </TableColumn> : null}
          </TableHeader>
          <TableBody items={filtered}>
            {(project) => {
              const summary = projectPaymentSummary(project, payments)
              const paymentStatus = PROJECT_PAYMENT_STATUS_BADGE[
                projectPaymentStatus(project, summary)
              ]
              const members = project.members ?? []
              return (
                <TableRow id={project.id} href={`/projects/${project.id}`}>
                  <TableCell>
                    <div>
                      <Link
                        href={`/projects/${project.id}`}
                        className="font-medium text-fg hover:text-primary"
                      >
                        {project.name}
                      </Link>
                      <p className="text-muted-fg text-xs/5">
                        {project.client?.company_name ?? project.project_code}
                      </p>
                      <p className="mt-1 text-muted-fg text-xs sm:hidden">
                        {formatCurrency(summary.paid, project.currency)} /{" "}
                        {formatCurrency(project.budget, project.currency)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {project.category ? (
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor: project.category.color ?? "#64748b",
                          }}
                        />
                        {project.category.name}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      type="project"
                      status={project.status as ProjectStatus}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge intent={paymentStatus.intent} isCircle={false}>
                      {paymentStatus.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {members.length === 0 ? (
                      <Link
                        href={`/projects/${project.id}/team`}
                        className="text-muted-fg text-sm hover:text-primary hover:underline"
                      >
                        Unassigned
                      </Link>
                    ) : (
                      <div className="flex -space-x-1.5">
                        {members.slice(0, 3).map((m) => (
                          <UserAvatar
                            key={m.id}
                            profile={m.user}
                            size="sm"
                            className="ring-2 ring-bg"
                          />
                        ))}
                        {members.length > 3 && (
                          <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs ring-2 ring-bg">
                            +{members.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="text-sm">
                      <p className="tabular-nums">
                        {formatCurrency(summary.paid, project.currency)}
                        <span className="text-muted-fg">
                          {" "}
                          / {formatCurrency(project.budget, project.currency)}
                        </span>
                      </p>
                      {summary.pending > 0 && (
                        <p className="text-muted-fg text-xs">
                          {formatCurrency(summary.pending, project.currency)} pending
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(project.deadline)}
                  </TableCell>
                  {canManage ? (
                    <TableCell>
                      <Button
                        intent="plain"
                        size="sq-sm"
                        aria-label="Edit project"
                        onPress={() => setEditProject(project)}
                      >
                        <PencilSquareIcon />
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              )
            }}
          </TableBody>
        </Table>
      )}

      <SheetContent
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        side="right"
        className="w-full sm:max-w-md md:max-w-lg"
        aria-label="New project"
      >
        <SheetHeader>
          <SheetTitle>New project</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <ProjectForm
            clients={clients}
            categories={categories}
            developers={developers}
            mode="create"
            lockClientId={lockedClientId}
            allowDeveloperAssignment={canAssignDevelopers}
            onSuccess={() => setCreateOpen(false)}
          />
        </SheetBody>
      </SheetContent>

      <SheetContent
        isOpen={!!editProject}
        onOpenChange={(open) => {
          if (!open) setEditProject(null)
        }}
        side="right"
        className="w-full sm:max-w-md md:max-w-lg"
        aria-label="Edit project"
      >
        <SheetHeader>
          <SheetTitle>Edit project</SheetTitle>
        </SheetHeader>
        <SheetBody>
          {editProject && (
            <ProjectForm
              key={editProject.id}
              clients={clients}
              categories={categories}
              developers={developers}
              mode="edit"
              projectId={editProject.id}
              lockClientId={lockedClientId}
              allowDeveloperAssignment={false}
              defaultValues={{
                name: editProject.name,
                client_id: editProject.client_id ?? "",
                description: editProject.description ?? "",
                category_id: editProject.category_id ?? "",
                priority: editProject.priority,
                budget: editProject.budget,
                status: editProject.status,
                start_date: editProject.start_date?.slice(0, 10) ?? "",
                deadline: editProject.deadline?.slice(0, 10) ?? "",
              }}
              onSuccess={() => setEditProject(null)}
            />
          )}
        </SheetBody>
      </SheetContent>
    </div>
  )
}
