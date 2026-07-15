import {
  addDemoActivityLog,
  getDemoStore,
  ORG_ID,
} from "@/lib/data/demo-store"
import { generateDemoId, touch } from "@/lib/data/demo-utils"
import { isDemoMode } from "@/lib/data/mode"
import { createClient } from "@/lib/supabase/server"
import type { Client, ClientContact, ClientStatus } from "@/types"

export interface ClientFilters {
  organizationId?: string
  status?: ClientStatus | ClientStatus[]
  search?: string
  sortBy?: "company_name" | "created_at" | "updated_at"
  sortOrder?: "asc" | "desc"
}

function filterClients(clients: Client[], filters?: ClientFilters): Client[] {
  let result = [...clients]
  const orgId = filters?.organizationId ?? ORG_ID

  result = result.filter((c) => c.organization_id === orgId)

  if (filters?.status) {
    const statuses = Array.isArray(filters.status)
      ? filters.status
      : [filters.status]
    result = result.filter((c) => statuses.includes(c.status))
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase()
    result = result.filter(
      (c) =>
        c.company_name.toLowerCase().includes(q) ||
        c.client_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.gst?.toLowerCase().includes(q) ?? false)
    )
  }

  const sortBy = filters?.sortBy ?? "company_name"
  const sortOrder = filters?.sortOrder ?? "asc"
  result.sort((a, b) => {
    const av = a[sortBy] ?? ""
    const bv = b[sortBy] ?? ""
    const cmp = String(av).localeCompare(String(bv))
    return sortOrder === "asc" ? cmp : -cmp
  })

  return result
}

export async function listClients(
  filters?: ClientFilters
): Promise<Client[]> {
  if (isDemoMode()) {
    return filterClients(getDemoStore().clients, filters)
  }

  const supabase = await createClient()
  let query = supabase.from("clients").select("*")

  if (filters?.organizationId) {
    query = query.eq("organization_id", filters.organizationId)
  }
  if (filters?.status) {
    const statuses = Array.isArray(filters.status)
      ? filters.status
      : [filters.status]
    query = query.in("status", statuses)
  }
  if (filters?.search) {
    query = query.or(
      `company_name.ilike.%${filters.search}%,client_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    )
  }

  const sortBy = filters?.sortBy ?? "company_name"
  const ascending = (filters?.sortOrder ?? "asc") === "asc"
  query = query.order(sortBy, { ascending })

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Client[]
}

export async function getClient(id: string): Promise<Client | null> {
  if (isDemoMode()) {
    return getDemoStore().clients.find((c) => c.id === id) ?? null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single()

  if (error) return null
  return data as Client
}

export async function createClientRecord(
  input: Omit<Client, "id" | "created_at" | "updated_at">,
  actorId?: string | null
): Promise<Client> {
  if (isDemoMode()) {
    const now = touch()
    const client: Client = {
      id: generateDemoId(),
      ...input,
      created_at: now,
      updated_at: now,
    }
    getDemoStore().clients.push(client)
    addDemoActivityLog({
      organization_id: input.organization_id,
      actor_id: actorId ?? input.created_by,
      action: "created",
      entity_type: "client",
      entity_id: client.id,
      entity_label: client.company_name,
      metadata: {},
    })
    return client
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("clients")
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as Client
}

export async function updateClient(
  id: string,
  input: Partial<Omit<Client, "id" | "organization_id" | "created_at">>,
  actorId?: string | null
): Promise<Client | null> {
  if (isDemoMode()) {
    const store = getDemoStore()
    const idx = store.clients.findIndex((c) => c.id === id)
    if (idx === -1) return null

    const updated: Client = {
      ...store.clients[idx],
      ...input,
      updated_at: touch(),
    }
    store.clients[idx] = updated
    addDemoActivityLog({
      organization_id: updated.organization_id,
      actor_id: actorId ?? null,
      action: "updated",
      entity_type: "client",
      entity_id: id,
      entity_label: updated.company_name,
      metadata: input,
    })
    return updated
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("clients")
    .update(input)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Client
}

export async function deleteClient(
  id: string,
  actorId?: string | null
): Promise<boolean> {
  if (isDemoMode()) {
    const store = getDemoStore()
    const idx = store.clients.findIndex((c) => c.id === id)
    if (idx === -1) return false

    const [removed] = store.clients.splice(idx, 1)
    store.clientContacts = store.clientContacts.filter(
      (cc) => cc.client_id !== id
    )
    addDemoActivityLog({
      organization_id: removed.organization_id,
      actor_id: actorId ?? null,
      action: "deleted",
      entity_type: "client",
      entity_id: id,
      entity_label: removed.company_name,
      metadata: {},
    })
    return true
  }

  const supabase = await createClient()
  const { error } = await supabase.from("clients").delete().eq("id", id)
  if (error) throw error
  return true
}

export async function listClientContacts(
  clientId: string
): Promise<ClientContact[]> {
  if (isDemoMode()) {
    return getDemoStore()
      .clientContacts.filter((c) => c.client_id === clientId)
      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("client_contacts")
    .select("*")
    .eq("client_id", clientId)
    .order("is_primary", { ascending: false })

  if (error) throw error
  return (data ?? []) as ClientContact[]
}

export async function createClientContact(
  input: Omit<ClientContact, "id" | "created_at">
): Promise<ClientContact> {
  if (isDemoMode()) {
    const contact: ClientContact = {
      id: generateDemoId(),
      ...input,
      created_at: touch(),
    }
    getDemoStore().clientContacts.push(contact)
    return contact
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("client_contacts")
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as ClientContact
}
