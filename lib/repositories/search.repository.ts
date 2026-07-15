import { getDemoStore, ORG_ID } from "@/lib/data/demo-store"
import { isDemoMode } from "@/lib/data/mode"
import { createClient } from "@/lib/supabase/server"

export interface SearchResult {
  type: "client" | "project" | "payment"
  id: string
  title: string
  subtitle: string | null
  link: string
  score: number
}

function scoreMatch(text: string, query: string): number {
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  if (lower === q) return 100
  if (lower.startsWith(q)) return 80
  if (lower.includes(q)) return 50
  return 0
}

export async function globalSearch(
  query: string,
  organizationId?: string,
  limit = 20
): Promise<SearchResult[]> {
  const orgId = organizationId ?? ORG_ID
  const q = query.trim()
  if (!q) return []

  if (isDemoMode()) {
    const store = getDemoStore()
    const results: SearchResult[] = []

    for (const c of store.clients) {
      if (c.organization_id !== orgId) continue
      const score = Math.max(
        scoreMatch(c.company_name, q),
        scoreMatch(c.client_name, q),
        scoreMatch(c.email, q),
        c.gst ? scoreMatch(c.gst, q) : 0
      )
      if (score > 0) {
        results.push({
          type: "client",
          id: c.id,
          title: c.company_name,
          subtitle: c.client_name,
          link: `/clients/${c.id}`,
          score,
        })
      }
    }

    for (const p of store.projects) {
      if (p.organization_id !== orgId) continue
      const score = Math.max(
        scoreMatch(p.name, q),
        scoreMatch(p.project_code, q),
        p.description ? scoreMatch(p.description, q) : 0
      )
      if (score > 0) {
        results.push({
          type: "project",
          id: p.id,
          title: p.name,
          subtitle: p.project_code,
          link: `/projects/${p.id}`,
          score,
        })
      }
    }

    for (const pay of store.payments) {
      if (pay.organization_id !== orgId) continue
      const project = store.projects.find((p) => p.id === pay.project_id)
      const score = Math.max(
        project ? scoreMatch(project.name, q) : 0,
        pay.utr ? scoreMatch(pay.utr, q) : 0,
        pay.transaction_id ? scoreMatch(pay.transaction_id, q) : 0,
        scoreMatch(String(pay.amount), q)
      )
      if (score > 0) {
        results.push({
          type: "payment",
          id: pay.id,
          title: `${pay.currency} ${pay.amount.toLocaleString()}`,
          subtitle: project?.name ?? null,
          link: `/payments/${pay.id}`,
          score,
        })
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  const supabase = await createClient()
  const pattern = `%${q}%`
  const results: SearchResult[] = []

  const [clients, projects, payments] = await Promise.all([
    supabase
      .from("clients")
      .select("id, company_name, client_name")
      .eq("organization_id", orgId)
      .or(`company_name.ilike.${pattern},client_name.ilike.${pattern},email.ilike.${pattern}`)
      .limit(10),
    supabase
      .from("projects")
      .select("id, name, project_code")
      .eq("organization_id", orgId)
      .or(`name.ilike.${pattern},project_code.ilike.${pattern}`)
      .limit(10),
    supabase
      .from("payments")
      .select("id, amount, currency, project_id, utr, transaction_id")
      .eq("organization_id", orgId)
      .or(`utr.ilike.${pattern},transaction_id.ilike.${pattern},notes.ilike.${pattern}`)
      .limit(10),
  ])

  for (const c of clients.data ?? []) {
    results.push({
      type: "client",
      id: c.id,
      title: c.company_name,
      subtitle: c.client_name,
      link: `/clients/${c.id}`,
      score: scoreMatch(c.company_name, q),
    })
  }
  for (const p of projects.data ?? []) {
    results.push({
      type: "project",
      id: p.id,
      title: p.name,
      subtitle: p.project_code,
      link: `/projects/${p.id}`,
      score: scoreMatch(p.name, q),
    })
  }
  for (const pay of payments.data ?? []) {
    results.push({
      type: "payment",
      id: pay.id,
      title: `${pay.currency} ${Number(pay.amount).toLocaleString()}`,
      subtitle: pay.utr ?? pay.transaction_id,
      link: `/payments/${pay.id}`,
      score: 50,
    })
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit)
}

export async function searchByType(
  type: SearchResult["type"],
  query: string,
  organizationId?: string,
  limit = 10
): Promise<SearchResult[]> {
  const all = await globalSearch(query, organizationId, 100)
  return all.filter((r) => r.type === type).slice(0, limit)
}
