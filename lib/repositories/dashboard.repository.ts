import {
  enrichActivityLog,
  enrichComment,
  getDemoStore,
  ORG_ID,
} from "@/lib/data/demo-store"
import { dateOnly } from "@/lib/data/demo-utils"
import { isDemoMode } from "@/lib/data/mode"
import { createClient } from "@/lib/supabase/server"
import type { DashboardStats } from "@/types"
import { listPaymentsAwaitingVerification } from "./payments.repository"

export async function getDashboardStats(
  organizationId?: string
): Promise<DashboardStats> {
  const orgId = organizationId ?? ORG_ID

  if (isDemoMode()) {
    const store = getDemoStore()
    const projectMap = new Map(store.projects.map((p) => [p.id, p]))

    const verifiedPayments = store.payments.filter((p) => p.status === "verified")
    const revenue = verifiedPayments.reduce((sum, p) => sum + p.amount, 0)

    const pendingPayments = store.payments
      .filter((p) => ["pending", "client_marked_paid", "under_review"].includes(p.status))
      .reduce((sum, p) => sum + p.amount, 0)

    const today = dateOnly(0)
    const overduePayments = store.payments
      .filter((p) => {
        if (!["pending", "client_marked_paid", "under_review", "disputed"].includes(p.status)) {
          return false
        }
        const project = projectMap.get(p.project_id)
        return Boolean(project?.deadline && project.deadline < today)
      })
      .reduce((sum, p) => sum + p.amount, 0)

    const activeProjects = store.projects.filter((p) =>
      ["in_progress", "testing", "client_review", "planning"].includes(p.status)
    ).length

    const completedProjects = store.projects.filter(
      (p) => p.status === "completed"
    ).length

    const staff = store.profiles.filter(
      (p) => p.organization_id === orgId && p.role !== "client" && p.is_active
    )
    const teamAvailability = {
      available: staff.filter((p) => p.availability_status === "available").length,
      busy: staff.filter((p) => p.availability_status === "busy").length,
      offline: staff.filter((p) => p.availability_status === "offline").length,
    }

    const upcomingDeadlines: DashboardStats["upcomingDeadlines"] = []

    for (const p of store.projects) {
      if (p.deadline && p.deadline >= today && p.deadline <= dateOnly(30)) {
        upcomingDeadlines.push({
          id: p.id,
          title: p.name,
          type: "project",
          due_date: p.deadline,
        })
      }
    }
    for (const m of store.milestones) {
      if (m.due_date && m.due_date >= today && m.status !== "completed") {
        upcomingDeadlines.push({
          id: m.id,
          title: m.title,
          type: "milestone",
          due_date: m.due_date,
        })
      }
    }
    for (const payment of store.payments) {
      if (!["pending", "client_marked_paid", "under_review"].includes(payment.status)) {
        continue
      }
      const project = projectMap.get(payment.project_id)
      const due = project?.deadline
      if (due && due >= today && due <= dateOnly(30)) {
        upcomingDeadlines.push({
          id: payment.id,
          title: `${project?.name ?? "Project"} payment`,
          type: "payment",
          due_date: due,
        })
      }
    }
    upcomingDeadlines.sort((a, b) => a.due_date.localeCompare(b.due_date))

    const recentActivities = store.activityLogs
      .slice(0, 10)
      .map(enrichActivityLog)

    const clientMessages = store.comments
      .filter((c) => !c.is_internal && c.entity_type === "project")
      .slice(-5)
      .map(enrichComment)

    const paymentRequests = await listPaymentsAwaitingVerification(orgId)

    const revenueSeries = [
      { month: "Feb 2026", revenue: 280000 },
      { month: "Mar 2026", revenue: 365800 },
      { month: "Apr 2026", revenue: 195000 },
      { month: "May 2026", revenue: 401200 },
      { month: "Jun 2026", revenue: 0 },
      { month: "Jul 2026", revenue: 0 },
    ]

    const statusCounts = new Map<string, number>()
    for (const p of store.projects) {
      statusCounts.set(p.status, (statusCounts.get(p.status) ?? 0) + 1)
    }
    const projectsSeries = Array.from(statusCounts.entries()).map(
      ([status, count]) => ({ status, count })
    )

    const workloadMap = new Map<string, number>()
    for (const m of store.projectMembers) {
      const profile = store.profiles.find((p) => p.id === m.user_id)
      if (!profile || profile.role === "client") continue
      workloadMap.set(
        profile.full_name,
        (workloadMap.get(profile.full_name) ?? 0) + 1
      )
    }
    const teamWorkload = Array.from(workloadMap.entries()).map(([name, projects]) => ({
      name,
      projects,
    }))

    const paymentTrend = [
      { month: "Mar 2026", received: 365800, pending: 0 },
      { month: "Apr 2026", received: 0, pending: 115050 },
      { month: "May 2026", received: 401200, pending: 0 },
      { month: "Jun 2026", received: 0, pending: 135759 },
      { month: "Jul 2026", received: 0, pending: 401200 },
    ]

    return {
      revenue,
      pendingPayments,
      overduePayments,
      activeProjects,
      completedProjects,
      awaitingVerification: paymentRequests.length,
      teamAvailability,
      upcomingDeadlines: upcomingDeadlines.slice(0, 8),
      recentActivities,
      clientMessages,
      paymentRequests,
      revenueSeries,
      projectsSeries,
      teamWorkload,
      paymentTrend,
    }
  }

  const supabase = await createClient()

  const { data: payments } = await supabase
    .from("payments")
    .select("amount, status, project_id")
    .eq("organization_id", orgId)

  const { data: projects } = await supabase
    .from("projects")
    .select("status, name, deadline, id")
    .eq("organization_id", orgId)

  const { data: profiles } = await supabase
    .from("profiles")
    .select("availability_status, role, is_active")
    .eq("organization_id", orgId)

  const { data: activities } = await supabase
    .from("activity_logs")
    .select("*, actor:profiles(*)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(10)

  const paymentList = payments ?? []
  const projectList = projects ?? []
  const projectMap = new Map(projectList.map((p) => [p.id, p]))
  const today = dateOnly(0)

  const revenue = paymentList
    .filter((p) => p.status === "verified")
    .reduce((s, p) => s + Number(p.amount), 0)
  const pendingPayments = paymentList
    .filter((p) => ["pending", "client_marked_paid", "under_review"].includes(p.status))
    .reduce((s, p) => s + Number(p.amount), 0)
  const overduePayments = paymentList
    .filter((p) => {
      if (!["pending", "client_marked_paid", "under_review", "disputed"].includes(p.status)) {
        return false
      }
      const project = projectMap.get(p.project_id)
      return Boolean(project?.deadline && project.deadline < today)
    })
    .reduce((s, p) => s + Number(p.amount), 0)

  const activeProjects = projectList.filter((p) =>
    ["in_progress", "testing", "client_review", "planning"].includes(p.status)
  ).length
  const completedProjects = projectList.filter((p) => p.status === "completed").length

  const staff = (profiles ?? []).filter((p) => p.role !== "client" && p.is_active)
  const teamAvailability = {
    available: staff.filter((p) => p.availability_status === "available").length,
    busy: staff.filter((p) => p.availability_status === "busy").length,
    offline: staff.filter((p) => p.availability_status === "offline").length,
  }

  const paymentRequests = await listPaymentsAwaitingVerification(orgId)

  return {
    revenue,
    pendingPayments,
    overduePayments,
    activeProjects,
    completedProjects,
    awaitingVerification: paymentRequests.length,
    teamAvailability,
    upcomingDeadlines: [],
    recentActivities: (activities ?? []) as DashboardStats["recentActivities"],
    clientMessages: [],
    paymentRequests,
    revenueSeries: [],
    projectsSeries: [],
    teamWorkload: [],
    paymentTrend: [],
  }
}
