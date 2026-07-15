"use server"

import { requireSession } from "@/lib/auth/session"
import { ORG_ID } from "@/lib/data/demo-store"
import { listClients } from "@/lib/repositories/clients.repository"
import { listPayments } from "@/lib/repositories/payments.repository"
import { listProfiles } from "@/lib/repositories/profiles.repository"
import {
  listProjectCategories,
  listProjectMembers,
  listProjects,
  seedDefaultProjectCategories,
  getProject,
} from "@/lib/repositories/projects.repository"
import { hasPermission } from "@/lib/rbac"

export async function fetchProjectsPageQuery() {
  const session = await requireSession()
  const orgId = session.organization?.id ?? session.profile.organization_id ?? ORG_ID
  const canManage = hasPermission(session.permissions, "projects.create")

  let categories = await listProjectCategories(orgId)
  if (categories.length === 0 && canManage) {
    categories = await seedDefaultProjectCategories(orgId)
  }

  const [projects, clients, payments, developers] = await Promise.all([
    listProjects({ organizationId: orgId }),
    listClients({ organizationId: orgId }),
    listPayments({ organizationId: orgId }),
    listProfiles({ organizationId: orgId, excludeRoles: ["client"] }),
  ])

  return { projects, clients, payments, developers, categories, canManage, orgId }
}

export async function fetchProjectQuery(id: string) {
  await requireSession()
  const project = await getProject(id)
  if (!project) throw new Error("Project not found")
  return project
}

export async function fetchProjectMembersQuery(projectId: string) {
  await requireSession()
  return listProjectMembers(projectId)
}

export async function fetchProjectCategoriesQuery(orgId?: string) {
  const session = await requireSession()
  const id = orgId ?? session.organization?.id ?? session.profile.organization_id ?? ORG_ID
  return listProjectCategories(id)
}
