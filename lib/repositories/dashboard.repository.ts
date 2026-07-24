import {
  enrichActivityLog,
  enrichComment,
  getDemoStore,
  ORG_ID,
} from "@/lib/data/demo-store"
import { dateOnly } from "@/lib/data/demo-utils"
import { isDemoMode } from "@/lib/data/mode"
import { createClient } from "@/lib/supabase/server"
import type {
  AgencyDashboardStats,
  ClientDashboardStats,
  DashboardStats,
  Payment,
  Project,
  ProjectStatus,
} from "@/types"
import {
  hasClientAccepted,
  hasStaffAccepted,
} from "@/features/payments/lib/acceptance"
import { listPaymentsAwaitingVerification } from "./payments.repository"
import { listProjects } from "./projects.repository"
import { isTimestampInDateRange } from "@/lib/date-range"

/** Pre-delivery / waiting statuses */
const PENDING_PROJECT_STATUSES: ProjectStatus[] = [
  "lead",
  "discussion",
  "planning",
  "on_hold",
]
/** Delivery in flight */
const ACTIVE_PROJECT_STATUSES: ProjectStatus[] = [
  "in_progress",
  "testing",
  "client_review",
]

function countByStatuses(projects: Project[], statuses: ProjectStatus[]) {
  return projects.filter((p) => statuses.includes(p.status)).length
}

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

function buildClientDashboardStats(
  clientName: string,
  projects: Project[],
  payments: Payment[]
): ClientDashboardStats {
  const clientProjects = projects
  const projectIds = new Set(clientProjects.map((p) => p.id))
  const clientPayments = payments.filter(
    (p) =>
      projectIds.has(p.project_id) ||
      clientProjects.some((proj) => proj.id === p.project_id)
  )

  const paidByProject = new Map<string, number>()
  for (const payment of clientPayments) {
    if (payment.status !== "verified") continue
    paidByProject.set(
      payment.project_id,
      (paidByProject.get(payment.project_id) ?? 0) + payment.amount
    )
  }

  let amountPaid = 0
  let totalBudget = 0
  let amountDue = 0
  const projectsWithBalance: ClientDashboardStats["projectsWithBalance"] = []

  for (const project of clientProjects) {
    const paid = paidByProject.get(project.id) ?? 0
    const remaining = Math.max(project.budget - paid, 0)
    amountPaid += paid
    totalBudget += project.budget
    amountDue += remaining
    if (remaining > 0 && project.status !== "cancelled") {
      projectsWithBalance.push({
        id: project.id,
        name: project.name,
        status: project.status,
        budget: project.budget,
        paid,
        remaining,
        currency: project.currency ?? "INR",
      })
    }
  }

  projectsWithBalance.sort((a, b) => b.remaining - a.remaining)

  const awaiting = clientPayments.filter(
    (p) =>
      p.status !== "verified" &&
      p.status !== "disputed" &&
      hasStaffAccepted(p) &&
      !hasClientAccepted(p)
  )

  const projectNameById = new Map(clientProjects.map((p) => [p.id, p.name]))

  return {
    clientName,
    amountDue,
    amountPaid,
    totalBudget,
    pendingProjects: countByStatuses(clientProjects, PENDING_PROJECT_STATUSES),
    activeProjects: countByStatuses(clientProjects, ACTIVE_PROJECT_STATUSES),
    completedProjects: clientProjects.filter((p) => p.status === "completed")
      .length,
    awaitingYourAcceptanceCount: awaiting.length,
    awaitingYourAcceptanceAmount: awaiting.reduce((s, p) => s + p.amount, 0),
    awaitingYourAcceptance: awaiting
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 8)
      .map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency ?? "INR",
        projectName: projectNameById.get(p.project_id) ?? "Project",
        createdAt: p.created_at,
      })),
    projectsWithBalance: projectsWithBalance.slice(0, 8),
  }
}

export async function getClientDashboardStats(
  clientId: string,
  organizationId?: string
): Promise<ClientDashboardStats> {
  const orgId = organizationId ?? ORG_ID

  if (isDemoMode()) {
    const store = getDemoStore()
    const client = store.clients.find((c) => c.id === clientId)
    const projects = store.projects.filter(
      (p) => p.organization_id === orgId && p.client_id === clientId
    )
    const payments = store.payments
      .filter((p) => p.organization_id === orgId && p.client_id === clientId)
      .map((p) => enrichPaymentIfNeeded(p))

    return buildClientDashboardStats(
      client?.company_name ?? "Client",
      projects,
      payments
    )
  }

  const supabase = await createClient()

  const [{ data: client }, { data: projects }, { data: payments }] =
    await Promise.all([
      supabase
        .from("clients")
        .select("company_name")
        .eq("id", clientId)
        .maybeSingle(),
      supabase
        .from("projects")
        .select("*")
        .eq("organization_id", orgId)
        .eq("client_id", clientId),
      supabase
        .from("payments")
        .select("*")
        .eq("organization_id", orgId)
        .eq("client_id", clientId),
    ])

  return buildClientDashboardStats(
    client?.company_name ?? "Client",
    (projects ?? []) as Project[],
    (payments ?? []) as Payment[]
  )
}

function enrichPaymentIfNeeded(payment: Payment): Payment {
  return {
    ...payment,
    client_accepted_at: payment.client_accepted_at ?? null,
    client_accepted_by: payment.client_accepted_by ?? null,
    staff_accepted_at: payment.staff_accepted_at ?? null,
    staff_accepted_by: payment.staff_accepted_by ?? null,
  }
}

export interface AgencyDashboardFilters {
  organizationId?: string
  /** Restrict to projects where this user is a member */
  memberUserId?: string
  categoryId?: string
  /** Inclusive YYYY-MM-DD — filter by project created_at */
  from?: string | null
  to?: string | null
}

function buildAgencyDashboardStats(
  projects: Project[],
  payments: Payment[],
  clientNameById: Map<string, string>
): AgencyDashboardStats {
  const projectIds = new Set(projects.map((p) => p.id))
  const scopedPayments = payments.filter((p) => projectIds.has(p.project_id))

  const paidByProject = new Map<string, number>()
  for (const payment of scopedPayments) {
    if (payment.status !== "verified") continue
    paidByProject.set(
      payment.project_id,
      (paidByProject.get(payment.project_id) ?? 0) + payment.amount
    )
  }

  const clientName = (project: Project) =>
    project.client?.company_name ??
    (project.client_id ? clientNameById.get(project.client_id) : undefined) ??
    "Client"

  const toRow = (project: Project) => {
    const paid = paidByProject.get(project.id) ?? 0
    const amount = Math.max(project.budget - paid, 0)
    return {
      id: project.id,
      name: project.name,
      status: project.status,
      clientName: clientName(project),
      budget: project.budget,
      paid,
      amount,
      currency: project.currency ?? "INR",
    }
  }

  /** Open work = not completed / cancelled — shown as potential */
  const openStatuses: ProjectStatus[] = [
    ...PENDING_PROJECT_STATUSES,
    ...ACTIVE_PROJECT_STATUSES,
  ]
  const pendingList = projects
    .filter((p) => openStatuses.includes(p.status))
    .map(toRow)
    .sort((a, b) => b.amount - a.amount)

  const completedList = projects
    .filter((p) => p.status === "completed")
    .map(toRow)
    .sort((a, b) => b.amount - a.amount)

  return {
    pendingCount: pendingList.length,
    pendingPotential: pendingList.reduce((sum, p) => sum + p.amount, 0),
    pendingProjects: pendingList,
    completedCount: completedList.length,
    completedExpected: completedList.reduce((sum, p) => sum + p.amount, 0),
    completedProjects: completedList,
  }
}

export async function getAgencyDashboardStats(
  filters?: AgencyDashboardFilters
): Promise<AgencyDashboardStats> {
  const orgId = filters?.organizationId ?? ORG_ID

  let projects = await listProjects({
    organizationId: orgId,
    memberUserId: filters?.memberUserId,
  })

  if (filters?.categoryId) {
    projects = projects.filter((p) => p.category_id === filters.categoryId)
  }

  if (filters?.from || filters?.to) {
    projects = projects.filter((p) =>
      isTimestampInDateRange(p.created_at, filters.from ?? null, filters.to ?? null)
    )
  }

  if (isDemoMode()) {
    const store = getDemoStore()
    const projectIds = new Set(projects.map((p) => p.id))
    const payments = store.payments
      .filter((p) => p.organization_id === orgId && projectIds.has(p.project_id))
      .map((p) => enrichPaymentIfNeeded(p))
    const clientNameById = new Map(
      store.clients.map((c) => [c.id, c.company_name])
    )
    return buildAgencyDashboardStats(projects, payments, clientNameById)
  }

  const supabase = await createClient()
  const projectIds = projects.map((p) => p.id)

  if (projectIds.length === 0) {
    return buildAgencyDashboardStats([], [], new Map())
  }

  const [{ data: payments }, { data: clients }] = await Promise.all([
    supabase
      .from("payments")
      .select("*")
      .eq("organization_id", orgId)
      .in("project_id", projectIds),
    supabase
      .from("clients")
      .select("id, company_name")
      .eq("organization_id", orgId),
  ])

  const clientNameById = new Map(
    (clients ?? []).map((c) => [c.id as string, c.company_name as string])
  )

  return buildAgencyDashboardStats(
    projects,
    ((payments ?? []) as Payment[]).map(enrichPaymentIfNeeded),
    clientNameById
  )
}
