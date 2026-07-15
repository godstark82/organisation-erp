"use server"

import { revalidatePath } from "next/cache"
import { requireSession } from "@/lib/auth/session"
import { ORG_ID } from "@/lib/data/demo-store"
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/repositories/notifications.repository"

export async function markNotificationReadAction(id: string) {
  const session = await requireSession()
  const orgId = session.profile.organization_id ?? ORG_ID

  await markNotificationAsRead(id)
  revalidatePath("/notifications")
  revalidatePath("/", "layout")
  return { success: true }
}

export async function markAllNotificationsReadAction() {
  const session = await requireSession()
  const orgId = session.profile.organization_id ?? ORG_ID

  const count = await markAllNotificationsAsRead(session.id, orgId)
  revalidatePath("/notifications")
  revalidatePath("/", "layout")
  return { success: true, count }
}
