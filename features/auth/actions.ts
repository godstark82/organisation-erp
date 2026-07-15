"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import {
  DEFAULT_DEMO_LOGIN_USER_ID,
  type DemoSessionPayload,
} from "@/lib/data/demo-session"
import { isDemoMode, SESSION_COOKIE } from "@/lib/data/mode"
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
} from "./schemas"

export type AuthActionState = {
  error?: string
  success?: string
  fieldErrors?: Record<string, string[]>
}

function fieldErrorsFromZod(
  error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }
): Record<string, string[]> {
  const flattened = error.flatten().fieldErrors
  return Object.fromEntries(
    Object.entries(flattened)
      .filter(([, value]) => value && value.length > 0)
      .map(([key, value]) => [key, value as string[]])
  )
}

async function setDemoSession(payload: DemoSessionPayload) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function login(
  _prev: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) }
  }

  const { email, password } = parsed.data

  if (isDemoMode()) {
    await setDemoSession({
      userId: DEFAULT_DEMO_LOGIN_USER_ID,
      email,
      full_name: email.split("@")[0] ?? "Demo User",
      role: "manager",
    })
    redirect("/dashboard")
  }

  const { createClient } = await import("@/lib/supabase/server")
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  redirect("/dashboard")
}

export async function register(
  _prev: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    organizationName: formData.get("organizationName"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) }
  }

  const { organizationName, fullName, email, password } = parsed.data

  if (isDemoMode()) {
    await setDemoSession({
      email,
      full_name: fullName,
      role: "manager",
      organization_name: organizationName,
    })
    redirect("/dashboard")
  }

  const { createClient } = await import("@/lib/supabase/server")
  const supabase = await createClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
      data: {
        full_name: fullName,
        organization_name: organizationName,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Email confirmation may be required — no session until confirmed
  if (!data.session) {
    return {
      success:
        "Account created. Check your email to confirm, then sign in.",
    }
  }

  redirect("/dashboard")
}

export async function forgotPassword(
  _prev: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  })

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) }
  }

  const { email } = parsed.data

  if (isDemoMode()) {
    return {
      success: "Demo mode: password reset link would be sent to your email.",
    }
  }

  const { createClient } = await import("@/lib/supabase/server")
  const supabase = await createClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/login`,
  })

  if (error) {
    return { error: error.message }
  }

  return {
    success: "If an account exists, a reset link has been sent to your email.",
  }
}

export async function logout() {
  if (isDemoMode()) {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE)
    redirect("/login")
  }

  const { createClient } = await import("@/lib/supabase/server")
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
