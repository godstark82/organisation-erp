import { Suspense } from "react"
import { ProjectsList } from "@/features/projects/components/projects-list"
import { requireSession } from "@/lib/auth/session"
import { ORG_ID } from "@/lib/data/demo-store"
import { listClients } from "@/lib/repositories/clients.repository"
import { listPayments } from "@/lib/repositories/payments.repository"
import {
  listProjectCategories,
  listProjects,
  seedDefaultProjectCategories,
} from "@/lib/repositories/projects.repository"
import { listProfiles } from "@/lib/repositories/profiles.repository"
import { hasPermission } from "@/lib/rbac"
import { LoadingSkeleton } from "@/components/shared/loading-skeleton"
import { Note } from "@/components/ui/note"
import type { Client, Payment, Profile, Project, ProjectCategory } from "@/types"

export default async function ProjectsPage() {
  const session = await requireSession()
  const orgId = session.organization?.id ?? session.profile.organization_id ?? ORG_ID
  const canManage = hasPermission(session.permissions, "projects.create")

  let categories: ProjectCategory[] = []
  let projects: Project[] = []
  let clients: Client[] = []
  let payments: Payment[] = []
  let developers: Profile[] = []
  let error: string | null = null

  try {
    categories = await listProjectCategories(orgId)
    if (categories.length === 0 && canManage) {
      categories = await seedDefaultProjectCategories(orgId)
    }

    ;[projects, clients, payments, developers] = await Promise.all([
      listProjects({ organizationId: orgId }),
      listClients({ organizationId: orgId }),
      listPayments({ organizationId: orgId }),
      listProfiles({ organizationId: orgId, excludeRoles: ["client"] }),
    ])
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "Unable to load projects. Please try again."
  }

  return (
    <Suspense fallback={<LoadingSkeleton variant="table" className="p-4 sm:p-6" />}>
      {error ? (
        <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
          <Note intent="danger" className="text-sm break-words">
            {error}
          </Note>
        </div>
      ) : (
        <ProjectsList
          projects={projects}
          clients={clients}
          categories={categories}
          payments={payments}
          developers={developers}
          canManage={canManage}
        />
      )}
    </Suspense>
  )
}
