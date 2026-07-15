"use client"

import { PencilSquareIcon } from "@heroicons/react/20/solid"
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
import { EmptyState } from "@/components/shared/empty-state"
import { FilterBar } from "@/components/shared/filter-bar"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Button } from "@/components/ui/button"
import { Link } from "@/components/ui/link"
import { ModalBody, ModalContent, ModalHeader, ModalTitle } from "@/components/ui/modal"
import { NativeSelect, NativeSelectContent } from "@/components/ui/native-select"
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
  const developerFilter = searchParams.get("developer") ?? ""

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
    search,
  ])

  const hasActiveFilters = Boolean(
    statusFilter ||
      priorityFilter ||
      clientFilter ||
      categoryFilter ||
      developerFilter ||
      search
  )

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
            <NativeSelect className="w-full sm:w-40">
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

            <NativeSelect className="w-full sm:w-36">
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

            <NativeSelect className="w-full sm:w-40">
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
              <NativeSelect className="w-full sm:w-44">
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

            {canAssignDevelopers && (
              <NativeSelect className="w-full sm:w-44">
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
            )}
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
            <TableColumn className="hidden md:table-cell">Assignees</TableColumn>
            <TableColumn className="hidden sm:table-cell">Paid / Budget</TableColumn>
            <TableColumn className="hidden md:table-cell">Deadline</TableColumn>
            {canManage ? <TableColumn> </TableColumn> : null}
          </TableHeader>
          <TableBody items={filtered}>
            {(project) => {
              const summary = projectPaymentSummary(project, payments)
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

      <ModalContent isOpen={createOpen} onOpenChange={setCreateOpen}>
        <ModalHeader>
          <ModalTitle>New project</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <ProjectForm
            clients={clients}
            categories={categories}
            developers={developers}
            mode="create"
            lockClientId={lockedClientId}
            allowDeveloperAssignment={canAssignDevelopers}
          />
        </ModalBody>
      </ModalContent>

      <ModalContent
        isOpen={!!editProject}
        onOpenChange={(open) => {
          if (!open) setEditProject(null)
        }}
      >
        <ModalHeader>
          <ModalTitle>Edit project</ModalTitle>
        </ModalHeader>
        <ModalBody>
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
        </ModalBody>
      </ModalContent>
    </div>
  )
}
