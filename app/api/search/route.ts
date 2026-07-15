import { getSession } from "@/lib/auth/session"
import { globalSearch } from "@/lib/repositories/search.repository"

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") ?? ""

  if (!q.trim()) {
    return Response.json({ results: [] })
  }

  const results = await globalSearch(
    q,
    session.profile.organization_id ?? undefined,
    15
  )

  return Response.json({ results })
}
