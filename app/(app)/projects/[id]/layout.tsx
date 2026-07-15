import { notFound } from "next/navigation"
import { ProjectNav } from "@/features/projects/components/project-nav"
import { StatusBadge } from "@/components/shared/status-badge"
import { requireSession } from "@/lib/auth/session"
import { getProject } from "@/lib/repositories/projects.repository"
import type { ProjectStatus } from "@/types"

export default async function ProjectLayout({
  children,
  params,
}: LayoutProps<"/projects/[id]">) {
  await requireSession()
  const { id } = await params
  const project = await getProject(id)

  if (!project) notFound()

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="sticky top-14 z-20 border-b border-border bg-bg/90 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-muted-fg text-xs/5">{project.project_code}</p>
            <h1 className="truncate font-display font-semibold text-lg tracking-tight sm:text-xl/8">
              {project.name}
            </h1>
            {project.client && (
              <p className="mt-0.5 truncate text-muted-fg text-sm/6">
                {project.client.company_name}
              </p>
            )}
          </div>
          <StatusBadge type="project" status={project.status as ProjectStatus} />
        </div>
        <div className="mt-4">
          <ProjectNav projectId={id} />
        </div>
      </div>
      <div className="min-w-0 flex-1 p-4 sm:p-6">{children}</div>
    </div>
  )
}
