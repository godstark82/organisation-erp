import { getDemoStore, ORG_ID } from "@/lib/data/demo-store"
import { generateDemoId, touch } from "@/lib/data/demo-utils"
import { isDemoMode } from "@/lib/data/mode"
import { createClient } from "@/lib/supabase/server"
import type { Notification, NotificationType } from "@/types"

export interface NotificationFilters {
  userId: string
  organizationId?: string
  isRead?: boolean
  type?: NotificationType
  limit?: number
}

export async function listNotifications(
  filters: NotificationFilters
): Promise<Notification[]> {
  const orgId = filters.organizationId ?? ORG_ID
  const limit = filters.limit ?? 50

  if (isDemoMode()) {
    let result = getDemoStore().notifications.filter(
      (n) => n.user_id === filters.userId && n.organization_id === orgId
    )
    if (filters.isRead !== undefined) {
      result = result.filter((n) => n.is_read === filters.isRead)
    }
    if (filters.type) {
      result = result.filter((n) => n.type === filters.type)
    }
    return result
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit)
  }

  const supabase = await createClient()
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", filters.userId)
    .eq("organization_id", orgId)

  if (filters.isRead !== undefined) query = query.eq("is_read", filters.isRead)
  if (filters.type) query = query.eq("type", filters.type)

  query = query.order("created_at", { ascending: false }).limit(limit)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Notification[]
}

export async function getNotification(
  id: string
): Promise<Notification | null> {
  if (isDemoMode()) {
    return getDemoStore().notifications.find((n) => n.id === id) ?? null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("id", id)
    .single()

  if (error) return null
  return data as Notification
}

export async function createNotification(
  input: Omit<Notification, "id" | "created_at">
): Promise<Notification> {
  if (isDemoMode()) {
    const notification: Notification = {
      id: generateDemoId(),
      ...input,
      created_at: touch(),
    }
    getDemoStore().notifications.unshift(notification)
    return notification
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("notifications")
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as Notification
}

export async function markNotificationAsRead(
  id: string
): Promise<Notification | null> {
  if (isDemoMode()) {
    const store = getDemoStore()
    const idx = store.notifications.findIndex((n) => n.id === id)
    if (idx === -1) return null
    store.notifications[idx] = { ...store.notifications[idx], is_read: true }
    return store.notifications[idx]
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Notification
}

export async function markAllNotificationsAsRead(
  userId: string,
  organizationId?: string
): Promise<number> {
  const orgId = organizationId ?? ORG_ID

  if (isDemoMode()) {
    const store = getDemoStore()
    let count = 0
    for (const n of store.notifications) {
      if (
        n.user_id === userId &&
        n.organization_id === orgId &&
        !n.is_read
      ) {
        n.is_read = true
        count++
      }
    }
    return count
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("organization_id", orgId)
    .eq("is_read", false)
    .select()

  if (error) throw error
  return data?.length ?? 0
}

export async function deleteNotification(id: string): Promise<boolean> {
  if (isDemoMode()) {
    const store = getDemoStore()
    const idx = store.notifications.findIndex((n) => n.id === id)
    if (idx === -1) return false
    store.notifications.splice(idx, 1)
    return true
  }

  const supabase = await createClient()
  const { error } = await supabase.from("notifications").delete().eq("id", id)
  if (error) throw error
  return true
}

export async function getUnreadCount(
  userId: string,
  organizationId?: string
): Promise<number> {
  const notifications = await listNotifications({
    userId,
    organizationId,
    isRead: false,
    limit: 1000,
  })
  return notifications.length
}
