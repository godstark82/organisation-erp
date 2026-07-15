"use server"

import { requireSession } from "@/lib/auth/session"
import { ORG_ID } from "@/lib/data/demo-store"
import { listProfiles } from "@/lib/repositories/profiles.repository"
import type { AppRole } from "@/types"

export async function fetchDevelopersQuery(filters?: {
  search?: string
  role?: string
}) {
  const session = await requireSession()
  const orgId = session.organization?.id ?? session.profile.organization_id ?? ORG_ID
  const roles =
    filters?.role &&
    ["developer", "designer", "manager", "accountant"].includes(filters.role)
      ? ([filters.role] as AppRole[])
      : undefined

  return listProfiles({
    organizationId: orgId,
    roles,
    excludeRoles: ["client"],
    activeOnly: false,
    search: filters?.search,
  })
}
