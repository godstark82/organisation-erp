"use server"

import { requireSession } from "@/lib/auth/session"
import { ORG_ID } from "@/lib/data/demo-store"
import { listClients, getClient } from "@/lib/repositories/clients.repository"
import type { ClientStatus } from "@/types"

export async function fetchClientsQuery(filters?: {
  search?: string
  status?: string
}) {
  const session = await requireSession()
  const orgId = session.profile.organization_id ?? ORG_ID
  const status =
    filters?.status &&
    ["active", "inactive", "lead", "archived"].includes(filters.status)
      ? (filters.status as ClientStatus)
      : undefined

  return listClients({
    organizationId: orgId,
    search: filters?.search,
    status,
  })
}

export async function fetchClientQuery(id: string) {
  await requireSession()
  const client = await getClient(id)
  if (!client) throw new Error("Client not found")
  return client
}
