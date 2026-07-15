import { getDemoStore, ORG_ID } from "@/lib/data/demo-store"
import { generateDemoId, touch } from "@/lib/data/demo-utils"
import { isDemoMode } from "@/lib/data/mode"
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { AppRole, Profile } from "@/types"

export interface ProfileFilters {
  organizationId?: string
  roles?: AppRole[]
  excludeRoles?: AppRole[]
  activeOnly?: boolean
  search?: string
}

export async function listProfiles(
  filters?: ProfileFilters
): Promise<Profile[]> {
  const orgId = filters?.organizationId ?? ORG_ID
  const excludeRoles = filters?.excludeRoles ?? ["client"]
  const activeOnly = filters?.activeOnly ?? true
  const search = filters?.search?.trim().toLowerCase()

  if (isDemoMode()) {
    return getDemoStore()
      .profiles.filter((p) => {
        if (p.organization_id !== orgId) return false
        if (excludeRoles.includes(p.role)) return false
        if (filters?.roles?.length && !filters.roles.includes(p.role)) return false
        if (activeOnly && !p.is_active) return false
        if (
          search &&
          !p.full_name.toLowerCase().includes(search) &&
          !p.email.toLowerCase().includes(search) &&
          !(p.title?.toLowerCase().includes(search) ?? false)
        ) {
          return false
        }
        return true
      })
      .sort((a, b) => a.full_name.localeCompare(b.full_name))
  }

  const supabase = await createClient()
  let query = supabase.from("profiles").select("*").eq("organization_id", orgId)

  if (filters?.roles?.length) {
    query = query.in("role", filters.roles)
  } else if (excludeRoles.length) {
    for (const role of excludeRoles) {
      query = query.neq("role", role)
    }
  }
  if (activeOnly) query = query.eq("is_active", true)
  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,title.ilike.%${search}%`
    )
  }

  const { data, error } = await query.order("full_name")
  if (error) throw error
  return (data ?? []) as Profile[]
}

export async function getProfile(id: string): Promise<Profile | null> {
  if (isDemoMode()) {
    return getDemoStore().profiles.find((p) => p.id === id) ?? null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  return data as Profile | null
}

export interface CreateDeveloperInput {
  organization_id: string
  email: string
  full_name: string
  phone?: string | null
  title?: string | null
  role?: Extract<AppRole, "developer" | "designer" | "manager" | "accountant">
  password: string
}

export async function createDeveloper(
  input: CreateDeveloperInput,
  actorId?: string | null
): Promise<Profile> {
  const role = input.role ?? "developer"

  if (isDemoMode()) {
    const store = getDemoStore()
    const exists = store.profiles.some(
      (p) =>
        p.organization_id === input.organization_id &&
        p.email.toLowerCase() === input.email.toLowerCase()
    )
    if (exists) {
      throw new Error("A team member with this email already exists")
    }

    const profile: Profile = {
      id: generateDemoId(),
      organization_id: input.organization_id,
      email: input.email.trim().toLowerCase(),
      full_name: input.full_name.trim(),
      avatar_url: null,
      phone: input.phone ?? null,
      role,
      title: input.title ?? null,
      is_active: true,
      availability_status: "available",
      last_seen_at: null,
      preferences: {},
      created_at: touch(),
      updated_at: touch(),
    }
    store.profiles.push(profile)
    return profile
  }

  if (!hasAdminClient()) {
    throw new Error(
      "Set SUPABASE_SERVICE_ROLE_KEY in .env.local to create developers with login access."
    )
  }

  const admin = createAdminClient()
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.full_name.trim(),
      role,
      organization_id: input.organization_id,
    },
  })

  if (createError) throw new Error(createError.message)
  if (!created.user) throw new Error("Failed to create user")

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .update({
      organization_id: input.organization_id,
      full_name: input.full_name.trim(),
      phone: input.phone ?? null,
      title: input.title ?? null,
      role,
      is_active: true,
    })
    .eq("id", created.user.id)
    .select("*")
    .single()

  if (profileError) throw new Error(profileError.message)
  return profile as Profile
}

export interface CreateClientPortalUserInput {
  organization_id: string
  client_id: string
  email: string
  full_name: string
  phone?: string | null
  password: string
}

/** Create an auth user with role=client and link them via clients.portal_user_id. */
export async function createClientPortalUser(
  input: CreateClientPortalUserInput
): Promise<{ profile: Profile; clientId: string }> {
  const email = input.email.trim().toLowerCase()
  const fullName = input.full_name.trim()

  if (isDemoMode()) {
    const store = getDemoStore()
    const client = store.clients.find((c) => c.id === input.client_id)
    if (!client) throw new Error("Client not found")
    if (client.portal_user_id) {
      throw new Error("This client already has portal login access")
    }
    if (
      store.profiles.some(
        (p) =>
          p.organization_id === input.organization_id &&
          p.email.toLowerCase() === email
      )
    ) {
      throw new Error("A user with this email already exists")
    }

    const profile: Profile = {
      id: generateDemoId(),
      organization_id: input.organization_id,
      email,
      full_name: fullName,
      avatar_url: null,
      phone: input.phone ?? null,
      role: "client",
      title: "Client portal",
      is_active: true,
      availability_status: "available",
      last_seen_at: null,
      preferences: {},
      created_at: touch(),
      updated_at: touch(),
    }
    store.profiles.push(profile)
    client.portal_user_id = profile.id
    client.updated_at = touch()
    return { profile, clientId: client.id }
  }

  if (!hasAdminClient()) {
    throw new Error(
      "Set SUPABASE_SERVICE_ROLE_KEY in .env.local to create client portal logins."
    )
  }

  const admin = createAdminClient()

  const { data: existingClient, error: clientFetchError } = await admin
    .from("clients")
    .select("id, portal_user_id, organization_id")
    .eq("id", input.client_id)
    .maybeSingle()

  if (clientFetchError) throw new Error(clientFetchError.message)
  if (!existingClient) throw new Error("Client not found")
  if (existingClient.portal_user_id) {
    throw new Error("This client already has portal login access")
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: "client",
      organization_id: input.organization_id,
    },
  })

  if (createError) throw new Error(createError.message)
  if (!created.user) throw new Error("Failed to create portal user")

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .update({
      organization_id: input.organization_id,
      full_name: fullName,
      phone: input.phone ?? null,
      title: "Client portal",
      role: "client",
      is_active: true,
    })
    .eq("id", created.user.id)
    .select("*")
    .single()

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id).catch(() => undefined)
    throw new Error(profileError.message)
  }

  const { error: linkError } = await admin
    .from("clients")
    .update({
      portal_user_id: created.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.client_id)

  if (linkError) {
    await admin.auth.admin.deleteUser(created.user.id).catch(() => undefined)
    throw new Error(linkError.message)
  }

  return { profile: profile as Profile, clientId: input.client_id }
}

export interface UpdateDeveloperInput {
  full_name?: string
  phone?: string | null
  title?: string | null
  role?: Extract<AppRole, "developer" | "designer" | "manager" | "accountant">
  is_active?: boolean
}

export async function updateDeveloper(
  id: string,
  input: UpdateDeveloperInput
): Promise<Profile | null> {
  if (isDemoMode()) {
    const store = getDemoStore()
    const profile = store.profiles.find((p) => p.id === id)
    if (!profile) return null
    Object.assign(profile, {
      ...input,
      updated_at: touch(),
    })
    return profile
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single()

  if (error) throw error
  return data as Profile
}

export async function deactivateDeveloper(id: string): Promise<boolean> {
  const updated = await updateDeveloper(id, { is_active: false })
  return Boolean(updated)
}
