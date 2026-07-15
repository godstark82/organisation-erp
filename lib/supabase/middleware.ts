import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { isDemoMode, SESSION_COOKIE } from "@/lib/data/mode"

function clearStaleDemoCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    path: "/",
    maxAge: 0,
  })
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const path = request.nextUrl.pathname
  const isAuthRoute =
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/forgot-password")
  const isPublic =
    isAuthRoute ||
    path === "/" ||
    path.startsWith("/auth/callback") ||
    path.startsWith("/api/health")

  if (isDemoMode()) {
    const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value)

    if (!hasSession && !isPublic) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/login"
      redirectUrl.searchParams.set("next", path)
      return NextResponse.redirect(redirectUrl)
    }

    if (hasSession && isAuthRoute) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/dashboard"
      return NextResponse.redirect(redirectUrl)
    }

    return supabaseResponse
  }

  // Leftover demo sessions inflate Cookie headers and can trigger HTTP 431
  if (request.cookies.has(SESSION_COOKIE)) {
    clearStaleDemoCookie(supabaseResponse)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return supabaseResponse
  }

  const supabase = createServerClient(url, key, {
    cookieEncoding: "raw",
    cookies: {
      encode: "tokens-only",
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({ request })
        if (request.cookies.has(SESSION_COOKIE)) {
          clearStaleDemoCookie(supabaseResponse)
        }
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !isPublic && path.startsWith("/")) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    redirectUrl.searchParams.set("next", path)
    return NextResponse.redirect(redirectUrl)
  }

  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/dashboard"
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}
