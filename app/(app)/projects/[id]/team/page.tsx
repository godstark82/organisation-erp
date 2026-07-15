import { notFound, redirect } from "next/navigation"
import { EmptyState } from "@/components/shared/empty-state"
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

  if (session.profile.role === "client") {
    redirect(`/projects/${id}`)
  }

  const orgId = project.organization_id ?? ORG_ID
  const canManageDevelopers = hasPermission(session.permissions, "users.manage")

  const [members, availableUsers] = await Promise.all([
    listProjectMembers(id),
    canManageDevelopers
      ? listProfiles({ organizationId: orgId, excludeRoles: ["client"] })
      : Promise.resolve([]),
  ])

  if (!canManageDevelopers && members.length === 0) {
    return (
      <EmptyState
        title="Team managed by agency admins"
        description="Only managers can assign developers to this project."
      />
    )
  }

  return (
    <MembersManager
      projectId={id}
      members={members}
      availableUsers={availableUsers}
      canManageDevelopers={canManageDevelopers}
    />
  )
}
