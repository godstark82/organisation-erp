import {
  addDemoActivityLog,
  enrichProject,
  getDemoProfile,
  getDemoStore,
  nextProjectCode,
  ORG_ID,
} from "@/lib/data/demo-store"
import { generateDemoId, touch } from "@/lib/data/demo-utils"
import { isDemoMode } from "@/lib/data/mode"
import { createClient } from "@/lib/supabase/server"
import type {
  Milestone,
  MilestoneStatus,
  Profile,
  Project,
  ProjectCategory,
  ProjectMember,
  ProjectStatus,
} from "@/types"

/** Members are loaded separately — avoid ambiguous profiles embeds. */
const PROJECT_BASE_SELECT =
  "*, client:clients(*), category:project_categories(*)"

function throwDbError(error: {
  message: string
  details?: string
  hint?: string
  code?: string
}) {
  const parts = [error.message, error.details, error.hint].filter(Boolean)
  throw new Error(parts.join(" — "))
}

async function attachProjectMembers(projects: Project[]): Promise<Project[]> {
  if (projects.length === 0) return projects

  const supabase = await createClient()
  const ids = projects.map((p) => p.id)

  const { data: plain, error: plainError } = await supabase
    .from("project_members")
    .select("*")
    .in("project_id", ids)
  if (plainError) throwDbError(plainError)

  const userIds = [
    ...new Set((plain ?? []).map((m) => m.user_id as string).filter(Boolean)),
  ]

  let profilesById = new Map<string, Profile>()
  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds)
    if (profilesError) throwDbError(profilesError)
    profilesById = new Map(
      (profiles ?? []).map((p) => [p.id as string, p as Profile])
    )
  }

  const byProject = new Map<string, ProjectMember[]>()
  for (const row of plain ?? []) {
    const member = {
      ...(row as ProjectMember),
      user: profilesById.get(row.user_id as string),
    }
    const list = byProject.get(member.project_id) ?? []
    list.push(member)
    byProject.set(member.project_id, list)
  }

  return projects.map((p) => ({
    ...p,
    members: byProject.get(p.id) ?? [],
  }))
}

async function allocateProjectCode(organizationId: string): Promise<string> {
  if (isDemoMode()) {
    return nextProjectCode()
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("projects")
    .select("project_code")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) throwDbError(error)

  const year = new Date().getFullYear()
  const prefix = `PRJ-${year}-`
  let max = 0
  for (const row of data ?? []) {
    const code = row.project_code as string
    if (!code.startsWith(prefix)) continue
    const n = Number.parseInt(code.slice(prefix.length), 10)
    if (!Number.isNaN(n) && n > max) max = n
  }

  return `${prefix}${String(max + 1).padStart(3, "0")}`
}

export interface ProjectFilters {
  organizationId?: string
  clientId?: string
  status?: ProjectStatus | ProjectStatus[]
  search?: string
  memberUserId?: string
  sortBy?: "name" | "deadline" | "created_at" | "updated_at"
  sortOrder?: "asc" | "desc"
}

function filterProjects(
  projects: Project[],
  filters?: ProjectFilters
): Project[] {
  let result = projects.map(enrichProject)
  const orgId = filters?.organizationId ?? ORG_ID

  result = result.filter((p) => p.organization_id === orgId)

  if (filters?.clientId) {
    result = result.filter((p) => p.client_id === filters.clientId)
  }

  if (filters?.status) {
    const statuses = Array.isArray(filters.status)
      ? filters.status
      : [filters.status]
    result = result.filter((p) => statuses.includes(p.status))
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase()
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.project_code.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false)
    )
  }

  if (filters?.memberUserId) {
    const store = getDemoStore()
    const projectIds = new Set(
      store.projectMembers
        .filter((m) => m.user_id === filters.memberUserId)
        .map((m) => m.project_id)
    )
    result = result.filter((p) => projectIds.has(p.id))
  }

  const sortBy = filters?.sortBy ?? "updated_at"
  const sortOrder = filters?.sortOrder ?? "desc"
  result.sort((a, b) => {
    const av = a[sortBy] ?? ""
    const bv = b[sortBy] ?? ""
    const cmp = String(av).localeCompare(String(bv))
    return sortOrder === "asc" ? cmp : -cmp
  })

  return result
}

export async function listProjects(
  filters?: ProjectFilters
): Promise<Project[]> {
  if (isDemoMode()) {
    return filterProjects(getDemoStore().projects, filters)
  }

  const supabase = await createClient()
  let query = supabase.from("projects").select(PROJECT_BASE_SELECT)

  if (filters?.organizationId) {
    query = query.eq("organization_id", filters.organizationId)
  }
  if (filters?.clientId) query = query.eq("client_id", filters.clientId)
  if (filters?.status) {
    const statuses = Array.isArray(filters.status)
      ? filters.status
      : [filters.status]
    query = query.in("status", statuses)
  }
  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,project_code.ilike.%${filters.search}%`
    )
  }

  const sortBy = filters?.sortBy ?? "updated_at"
  const ascending = (filters?.sortOrder ?? "desc") === "asc"
  query = query.order(sortBy, { ascending })

  const { data, error } = await query
  if (error) throwDbError(error)

  let projects = await attachProjectMembers((data ?? []) as Project[])

  if (filters?.memberUserId) {
    projects = projects.filter((project) =>
      (project.members ?? []).some((m) => m.user_id === filters.memberUserId)
    )
  }

  return projects
}

export async function getProject(id: string): Promise<Project | null> {
  if (isDemoMode()) {
    const project = getDemoStore().projects.find((p) => p.id === id)
    return project ? enrichProject(project) : null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_BASE_SELECT)
    .eq("id", id)
    .maybeSingle()

  if (error || !data) return null
  const [project] = await attachProjectMembers([data as Project])
  return project ?? null
}

export async function createProject(
  input: Omit<
    Project,
    "id" | "project_code" | "created_at" | "updated_at"
  > & { project_code?: string },
  actorId?: string | null
): Promise<Project> {
  const projectCode =
    input.project_code ?? (await allocateProjectCode(input.organization_id))

  if (isDemoMode()) {
    const now = touch()
    const project: Project = {
      id: generateDemoId(),
      project_code: projectCode,
      ...input,
      created_at: now,
      updated_at: now,
    }
    getDemoStore().projects.push(project)
    addDemoActivityLog({
      organization_id: input.organization_id,
      actor_id: actorId ?? input.created_by,
      action: "created",
      entity_type: "project",
      entity_id: project.id,
      entity_label: project.name,
      metadata: {},
    })
    return enrichProject(project)
  }

  const supabase = await createClient()
  const payload = {
    organization_id: input.organization_id,
    project_code: projectCode,
    name: input.name,
    client_id: input.client_id || null,
    description: input.description || null,
    category_id: input.category_id || null,
    priority: input.priority,
    budget: input.budget ?? 0,
    currency: input.currency || "INR",
    status: input.status,
    start_date: input.start_date || null,
    deadline: input.deadline || null,
    delivery_date: input.delivery_date || null,
    created_by: input.created_by,
  }

  const { data, error } = await supabase
    .from("projects")
    .insert(payload)
    .select(PROJECT_BASE_SELECT)
    .single()

  if (error) throwDbError(error)
  const [project] = await attachProjectMembers([data as Project])
  return project
}

export async function updateProject(
  id: string,
  input: Partial<
    Omit<Project, "id" | "organization_id" | "project_code" | "created_at">
  >,
  actorId?: string | null
): Promise<Project | null> {
  if (isDemoMode()) {
    const store = getDemoStore()
    const idx = store.projects.findIndex((p) => p.id === id)
    if (idx === -1) return null

    const prev = store.projects[idx]
    const updated: Project = { ...prev, ...input, updated_at: touch() }
    store.projects[idx] = updated

    if (input.status && input.status !== prev.status) {
      addDemoActivityLog({
        organization_id: updated.organization_id,
        actor_id: actorId ?? null,
        action: "status_changed",
        entity_type: "project",
        entity_id: id,
        entity_label: updated.name,
        metadata: { from: prev.status, to: input.status },
      })
    } else {
      addDemoActivityLog({
        organization_id: updated.organization_id,
        actor_id: actorId ?? null,
        action: "updated",
        entity_type: "project",
        entity_id: id,
        entity_label: updated.name,
        metadata: input,
      })
    }
    return enrichProject(updated)
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("projects")
    .update(input)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Project
}

export async function deleteProject(
  id: string,
  actorId?: string | null
): Promise<boolean> {
  if (isDemoMode()) {
    const store = getDemoStore()
    const idx = store.projects.findIndex((p) => p.id === id)
    if (idx === -1) return false

    const [removed] = store.projects.splice(idx, 1)
    store.projectMembers = store.projectMembers.filter(
      (m) => m.project_id !== id
    )
    store.tasks = store.tasks.filter((t) => t.project_id !== id)
    store.milestones = store.milestones.filter((m) => m.project_id !== id)
    addDemoActivityLog({
      organization_id: removed.organization_id,
      actor_id: actorId ?? null,
      action: "deleted",
      entity_type: "project",
      entity_id: id,
      entity_label: removed.name,
      metadata: {},
    })
    return true
  }

  const supabase = await createClient()
  const { error } = await supabase.from("projects").delete().eq("id", id)
  if (error) throw error
  return true
}

export async function listProjectMembers(
  projectId: string
): Promise<ProjectMember[]> {
  if (isDemoMode()) {
    return getDemoStore()
      .projectMembers.filter((m) => m.project_id === projectId)
      .map((m) => ({ ...m, user: getDemoProfile(m.user_id) }))
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("project_members")
    .select("*")
    .eq("project_id", projectId)

  if (error) throwDbError(error)

  const rows = (data ?? []) as ProjectMember[]
  const userIds = [...new Set(rows.map((m) => m.user_id).filter(Boolean))]
  let profilesById = new Map<string, Profile>()
  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds)
    if (profilesError) throwDbError(profilesError)
    profilesById = new Map(
      (profiles ?? []).map((p) => [p.id as string, p as Profile])
    )
  }

  return rows.map((m) => ({
    ...m,
    user: profilesById.get(m.user_id),
  }))
}

export async function isProjectMember(
  projectId: string,
  userId: string
): Promise<boolean> {
  if (isDemoMode()) {
    return getDemoStore().projectMembers.some(
      (m) => m.project_id === projectId && m.user_id === userId
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throwDbError(error)
  return Boolean(data)
}

export async function addProjectMember(
  input: Omit<ProjectMember, "id" | "assigned_at">,
  actorId?: string | null
): Promise<ProjectMember> {
  if (isDemoMode()) {
    const store = getDemoStore()
    const existing = store.projectMembers.find(
      (m) => m.project_id === input.project_id && m.user_id === input.user_id
    )
    if (existing) return existing

    const member: ProjectMember = {
      id: generateDemoId(),
      ...input,
      assigned_at: touch(),
    }
    store.projectMembers.push(member)
    addDemoActivityLog({
      organization_id: input.organization_id,
      actor_id: actorId ?? input.assigned_by,
      action: "assigned",
      entity_type: "project",
      entity_id: input.project_id,
      entity_label: store.projects.find((p) => p.id === input.project_id)?.name ?? null,
      metadata: { user_id: input.user_id },
    })
    return member
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("project_members")
    .insert(input)
    .select("*")
    .single()

  if (error) throwDbError(error)

  const member = data as ProjectMember
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", member.user_id)
    .maybeSingle()

  return { ...member, user: (profile as Profile) ?? undefined }
}

export async function removeProjectMember(
  projectId: string,
  userId: string
): Promise<boolean> {
  if (isDemoMode()) {
    const store = getDemoStore()
    const idx = store.projectMembers.findIndex(
      (m) => m.project_id === projectId && m.user_id === userId
    )
    if (idx === -1) return false
    store.projectMembers.splice(idx, 1)
    return true
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId)

  if (error) throw error
  return true
}

export async function listMilestones(projectId: string): Promise<Milestone[]> {
  if (isDemoMode()) {
    return getDemoStore()
      .milestones.filter((m) => m.project_id === projectId)
      .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("project_id", projectId)
    .order("due_date", { ascending: true })

  if (error) throw error
  return (data ?? []) as Milestone[]
}

export async function createMilestone(
  input: Omit<Milestone, "id" | "created_at" | "updated_at">
): Promise<Milestone> {
  if (isDemoMode()) {
    const now = touch()
    const milestone: Milestone = { id: generateDemoId(), ...input, created_at: now, updated_at: now }
    getDemoStore().milestones.push(milestone)
    return milestone
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("milestones")
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as Milestone
}

export async function updateMilestone(
  id: string,
  input: Partial<Omit<Milestone, "id" | "organization_id" | "created_at">>
): Promise<Milestone | null> {
  if (isDemoMode()) {
    const store = getDemoStore()
    const idx = store.milestones.findIndex((m) => m.id === id)
    if (idx === -1) return null
    const updated = { ...store.milestones[idx], ...input, updated_at: touch() }
    store.milestones[idx] = updated
    return updated
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("milestones")
    .update(input)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Milestone
}

export async function listProjectCategories(
  organizationId?: string
): Promise<ProjectCategory[]> {
  const orgId = organizationId ?? ORG_ID

  if (isDemoMode()) {
    return getDemoStore().projectCategories.filter(
      (c) => c.organization_id === orgId
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("project_categories")
    .select("*")
    .eq("organization_id", orgId)
    .order("name")

  if (error) throw error
  return (data ?? []) as ProjectCategory[]
}

export async function createProjectCategory(
  input: Omit<ProjectCategory, "id" | "created_at">
): Promise<ProjectCategory> {
  if (isDemoMode()) {
    const category: ProjectCategory = {
      id: generateDemoId(),
      ...input,
      created_at: touch(),
    }
    getDemoStore().projectCategories.push(category)
    return category
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("project_categories")
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as ProjectCategory
}

export async function updateProjectCategory(
  id: string,
  input: Partial<Pick<ProjectCategory, "name" | "color">>
): Promise<ProjectCategory | null> {
  if (isDemoMode()) {
    const store = getDemoStore()
    const idx = store.projectCategories.findIndex((c) => c.id === id)
    if (idx === -1) return null
    store.projectCategories[idx] = {
      ...store.projectCategories[idx],
      ...input,
    }
    return store.projectCategories[idx]
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("project_categories")
    .update(input)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as ProjectCategory
}

export async function deleteProjectCategory(id: string): Promise<boolean> {
  if (isDemoMode()) {
    const store = getDemoStore()
    const idx = store.projectCategories.findIndex((c) => c.id === id)
    if (idx === -1) return false
    store.projectCategories.splice(idx, 1)
    for (const project of store.projects) {
      if (project.category_id === id) project.category_id = null
    }
    return true
  }

  const supabase = await createClient()
  const { error } = await supabase.from("project_categories").delete().eq("id", id)
  if (error) throw error
  return true
}

export async function seedDefaultProjectCategories(
  organizationId: string
): Promise<ProjectCategory[]> {
  const defaults = [
    { name: "Website", color: "#2563eb" },
    { name: "Mobile App", color: "#7c3aed" },
    { name: "Ecommerce", color: "#db2777" },
    { name: "Branding", color: "#ea580c" },
    { name: "SaaS / Product", color: "#059669" },
    { name: "Consulting", color: "#64748b" },
  ]

  if (isDemoMode()) {
    const existing = await listProjectCategories(organizationId)
    if (existing.length > 0) return existing
    const created: ProjectCategory[] = []
    for (const item of defaults) {
      created.push(
        await createProjectCategory({
          organization_id: organizationId,
          name: item.name,
          color: item.color,
        })
      )
    }
    return created
  }

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from("project_categories")
    .select("*")
    .eq("organization_id", organizationId)

  if (existing && existing.length > 0) {
    return existing as ProjectCategory[]
  }

  const { data, error } = await supabase
    .from("project_categories")
    .insert(
      defaults.map((item) => ({
        organization_id: organizationId,
        name: item.name,
        color: item.color,
      }))
    )
    .select()

  if (error) throw error
  return (data ?? []) as ProjectCategory[]
}

export async function updateMilestoneStatus(
  id: string,
  status: MilestoneStatus
): Promise<Milestone | null> {
  return updateMilestone(id, { status })
}
