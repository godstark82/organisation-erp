import { notFound } from "next/navigation"
import { MembersManager } from "@/features/projects/components/members-manager"
import { requireSession } from "@/lib/auth/session"
import { ORG_ID } from "@/lib/data/demo-store"
import {
  getProject,
  listProjectMembers,
} from "@/lib/repositories/projects.repository"
import { listProfiles } from "@/lib/repositories/profiles.repository"
import { hasPermission } from "@/lib/rbac"

export default async function ProjectTeamPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireSession()
  const { id } = await params
  const project = await getProject(id)
  if (!project) notFound()

  const orgId = project.organization_id ?? ORG_ID

  const [members, availableUsers] = await Promise.all([
    listProjectMembers(id),
    listProfiles({ organizationId: orgId, excludeRoles: ["client"] }),
  ])

  return (
    <MembersManager
      projectId={id}
      members={members}
      availableUsers={availableUsers}
      canManageDevelopers={hasPermission(session.permissions, "users.manage")}
    />
  )
}
