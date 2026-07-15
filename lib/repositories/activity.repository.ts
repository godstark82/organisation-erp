import {
  addDemoActivityLog,
  enrichActivityLog,
  getDemoStore,
  ORG_ID,
} from "@/lib/data/demo-store"
import { generateDemoId, touch } from "@/lib/data/demo-utils"
import { isDemoMode } from "@/lib/data/mode"
import { createClient } from "@/lib/supabase/server"
import type { ActivityAction, ActivityLog, CalendarEvent } from "@/types"

export interface ActivityFilters {
  organizationId?: string
  entityType?: string
  entityId?: string
  actorId?: string
  action?: ActivityAction
  limit?: number
}

export interface CalendarFilters {
  organizationId?: string
  projectId?: string
  from?: string
  to?: string
}

export async function listActivityLogs(
  filters?: ActivityFilters
): Promise<ActivityLog[]> {
  const orgId = filters?.organizationId ?? ORG_ID
  const limit = filters?.limit ?? 50

  if (isDemoMode()) {
    let result = getDemoStore().activityLogs.filter(
      (l) => l.organization_id === orgId
    )
    if (filters?.entityType) {
      result = result.filter((l) => l.entity_type === filters.entityType)
    }
    if (filters?.entityId) {
      result = result.filter((l) => l.entity_id === filters.entityId)
    }
    if (filters?.actorId) {
      result = result.filter((l) => l.actor_id === filters.actorId)
    }
    if (filters?.action) {
      result = result.filter((l) => l.action === filters.action)
    }
    return result
      .slice(0, limit)
      .map(enrichActivityLog)
  }

  const supabase = await createClient()
  let query = supabase
    .from("activity_logs")
    .select("*, actor:profiles(*)")
    .eq("organization_id", orgId)

  if (filters?.entityType) query = query.eq("entity_type", filters.entityType)
  if (filters?.entityId) query = query.eq("entity_id", filters.entityId)
  if (filters?.actorId) query = query.eq("actor_id", filters.actorId)
  if (filters?.action) query = query.eq("action", filters.action)

  query = query.order("created_at", { ascending: false }).limit(limit)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as ActivityLog[]
}

export async function createActivityLog(
  input: Omit<ActivityLog, "id" | "created_at">
): Promise<ActivityLog> {
  if (isDemoMode()) {
    return addDemoActivityLog(input)
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("activity_logs")
    .insert(input)
    .select("*, actor:profiles(*)")
    .single()

  if (error) throw error
  return data as ActivityLog
}

export async function listCalendarEvents(
  filters?: CalendarFilters
): Promise<CalendarEvent[]> {
  const orgId = filters?.organizationId ?? ORG_ID

  if (isDemoMode()) {
    let result = getDemoStore().calendarEvents.filter(
      (e) => e.organization_id === orgId
    )
    if (filters?.projectId) {
      result = result.filter((e) => e.project_id === filters.projectId)
    }
    if (filters?.from) {
      result = result.filter((e) => e.starts_at >= filters.from!)
    }
    if (filters?.to) {
      result = result.filter((e) => e.starts_at <= filters.to!)
    }
    return result.sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  }

  const supabase = await createClient()
  let query = supabase
    .from("calendar_events")
    .select("*")
    .eq("organization_id", orgId)

  if (filters?.projectId) query = query.eq("project_id", filters.projectId)
  if (filters?.from) query = query.gte("starts_at", filters.from)
  if (filters?.to) query = query.lte("starts_at", filters.to)

  query = query.order("starts_at", { ascending: true })

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as CalendarEvent[]
}

export async function getCalendarEvent(
  id: string
): Promise<CalendarEvent | null> {
  if (isDemoMode()) {
    return getDemoStore().calendarEvents.find((e) => e.id === id) ?? null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("id", id)
    .single()

  if (error) return null
  return data as CalendarEvent
}

export async function createCalendarEvent(
  input: Omit<CalendarEvent, "id" | "created_at">,
  actorId?: string | null
): Promise<CalendarEvent> {
  if (isDemoMode()) {
    const event: CalendarEvent = {
      id: generateDemoId(),
      ...input,
      created_at: touch(),
    }
    getDemoStore().calendarEvents.push(event)
    addDemoActivityLog({
      organization_id: input.organization_id,
      actor_id: actorId ?? input.created_by,
      action: "created",
      entity_type: "calendar_event",
      entity_id: event.id,
      entity_label: event.title,
      metadata: {},
    })
    return event
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("calendar_events")
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as CalendarEvent
}

export async function updateCalendarEvent(
  id: string,
  input: Partial<Omit<CalendarEvent, "id" | "organization_id" | "created_at">>
): Promise<CalendarEvent | null> {
  if (isDemoMode()) {
    const store = getDemoStore()
    const idx = store.calendarEvents.findIndex((e) => e.id === id)
    if (idx === -1) return null
    store.calendarEvents[idx] = { ...store.calendarEvents[idx], ...input }
    return store.calendarEvents[idx]
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("calendar_events")
    .update(input)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as CalendarEvent
}

export async function deleteCalendarEvent(id: string): Promise<boolean> {
  if (isDemoMode()) {
    const store = getDemoStore()
    const idx = store.calendarEvents.findIndex((e) => e.id === id)
    if (idx === -1) return false
    store.calendarEvents.splice(idx, 1)
    return true
  }

  const supabase = await createClient()
  const { error } = await supabase.from("calendar_events").delete().eq("id", id)
  if (error) throw error
  return true
}
