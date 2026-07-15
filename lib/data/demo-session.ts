import { cookies } from "next/headers"
import { ROLE_PERMISSIONS } from "@/lib/rbac"
import { SESSION_COOKIE } from "@/lib/data/mode"
import type { AppRole, SessionUser } from "@/types"
import {
  getDemoProfile,
  getDemoStore,
  ORG_ID,
  USER_ADMIN_ID,
  USER_MANAGER_ID,
} from "./demo-store"

export interface DemoSessionPayload {
  userId?: string
  email: string
  full_name: string
  role: AppRole
  organization_name?: string
}

function buildAdHocDemoSession(payload: DemoSessionPayload): SessionUser {
  const store = getDemoStore()
  const orgName = payload.organization_name ?? store.organization.name

  return {
    id: payload.userId ?? `demo-${payload.email}`,
    email: payload.email,
    profile: {
      id: payload.userId ?? `demo-${payload.email}`,
      organization_id: ORG_ID,
      email: payload.email,
      full_name: payload.full_name,
      avatar_url: null,
      phone: null,
      role: payload.role,
      title: null,
      is_active: true,
      availability_status: "available",
      last_seen_at: null,
      preferences: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    organization: {
      ...store.organization,
      name: orgName,
    },
    permissions: ROLE_PERMISSIONS[payload.role],
  }
}

export async function getDemoSessionFromCookie(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(SESSION_COOKIE)?.value
  if (!raw) return null

  try {
    const payload = JSON.parse(raw) as DemoSessionPayload

    if (payload.userId) {
      return getDemoSessionForUser(payload.userId)
    }

    return buildAdHocDemoSession(payload)
  } catch {
    return null
  }
}

export function getDemoSession(): SessionUser {
  const store = getDemoStore()
  const profile = getDemoProfile(USER_ADMIN_ID)!

  return {
    id: USER_ADMIN_ID,
    email: profile.email,
    profile,
    organization: store.organization,
    permissions: ROLE_PERMISSIONS.super_admin,
  }
}

export function getDemoSessionForUser(userId: string): SessionUser | null {
  const store = getDemoStore()
  const profile = getDemoProfile(userId)
  if (!profile || profile.organization_id !== ORG_ID) return null

  return {
    id: profile.id,
    email: profile.email,
    profile,
    organization: store.organization,
    permissions: ROLE_PERMISSIONS[profile.role],
  }
}

export const DEFAULT_DEMO_LOGIN_USER_ID = USER_MANAGER_ID
