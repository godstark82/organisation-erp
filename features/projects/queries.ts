"use server"

import { requireSession } from "@/lib/auth/session"
import { ORG_ID } from "@/lib/data/demo-store"
import { getClientByPortalUserId } from "@/lib/repositories/clients.repository"
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
import { hasPermission, isAdminRole } from "@/lib/rbac"

export async function fetchProjectsPageQuery() {
  const session = await requireSession()
  const orgId = session.organization?.id ?? session.profile.organization_id ?? ORG_ID
  const isClient = session.profile.role === "client"
  const canManage = hasPermission(session.permissions, "projects.create")
  const canAssignDevelopers = hasPermission(session.permissions, "users.manage")
  const canFilterMembers = isAdminRole(session.profile.role)

  let categories = await listProjectCategories(orgId)
  if (categories.length === 0 && canManage && !isClient) {
    categories = await seedDefaultProjectCategories(orgId)
  }

  const linkedClient = isClient
    ? await getClientByPortalUserId(session.id)
    : null

  const [projects, clients, payments, developers] = await Promise.all([
    listProjects({ organizationId: orgId }),
    listClients({ organizationId: orgId }),
    listPayments({ organizationId: orgId }),
    canFilterMembers || canAssignDevelopers
      ? listProfiles({ organizationId: orgId, excludeRoles: ["client"] })
      : Promise.resolve([]),
  ])

  return {
    projects,
    clients,
    payments,
    developers,
    categories,
    canManage,
    canAssignDevelopers,
    canFilterMembers,
    currentUserId: session.id,
    orgId,
    isClient,
    lockedClientId: linkedClient?.id ?? null,
  }
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
