import { redirect } from "next/navigation"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; next?: string }>
}) {
  const params = await searchParams

  // Supabase email confirm / OAuth often lands on Site URL with ?code=
  if (params.code) {
    const qs = new URLSearchParams({ code: params.code })
    if (params.next) qs.set("next", params.next)
    redirect(`/auth/callback?${qs.toString()}`)
  }

  redirect("/dashboard")
}
