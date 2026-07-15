export function isDemoMode() {
  if (process.env.NEXT_PUBLIC_USE_DEMO_DATA === "true") return true
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return true
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return true
  return false
}

export const SESSION_COOKIE = "agencyos_session"
