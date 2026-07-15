import { redirect } from "next/navigation"
import { getDemoSessionFromCookie } from "@/lib/data/demo-session"
import { isDemoMode } from "@/lib/data/mode"
import { hasPermission, ROLE_PERMISSIONS } from "@/lib/rbac"
import type { AppRole, Organization, Profile, SessionUser } from "@/types"

export async function getSession(): Promise<SessionUser | null> {
  if (isDemoMode()) {
    return getDemoSessionFromCookie()
  }

  const { createClient } = await import("@/lib/supabase/server")
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) return null

  let organization: Organization | null = null
  if (profile.organization_id) {
    const { data: org } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", profile.organization_id)
      .single()
    organization = org as Organization | null
  }

  const role = profile.role as AppRole
  const permissions = ROLE_PERMISSIONS[role] ?? []

  return {
    id: user.id,
    email: user.email ?? profile.email,
    profile: profile as Profile,
    organization,
    permissions,
  }
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }
  return session
}

export async function requirePermission(
  perm: string | string[]
): Promise<SessionUser> {
  const session = await requireSession()
  if (!hasPermission(session.permissions, perm)) {
    redirect("/dashboard?error=unauthorized")
  }
  return session
}
