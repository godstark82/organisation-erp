import { getDemoStore, ORG_ID } from "@/lib/data/demo-store"
import { isDemoMode } from "@/lib/data/mode"
import { listCalendarEvents } from "@/lib/repositories/activity.repository"
import { listPayments } from "@/lib/repositories/payments.repository"
import { listProjects } from "@/lib/repositories/projects.repository"
import { createClient } from "@/lib/supabase/server"
import type { CalendarEvent, Milestone } from "@/types"

export type UnifiedEventKind =
  | "event"
  | "meeting"
  | "deadline"
  | "milestone"
  | "payment"
  | "project_deadline"

export interface UnifiedCalendarEvent {
  id: string
  title: string
  description: string | null
  startsAt: string
  endsAt: string | null
  allDay: boolean
  kind: UnifiedEventKind
  link: string | null
  projectName: string | null
  source: "calendar" | "derived"
}

async function listOrgMilestones(organizationId: string): Promise<Milestone[]> {
  if (isDemoMode()) {
    return getDemoStore().milestones.filter(
      (m) => m.organization_id === organizationId
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("organization_id", organizationId)

  if (error) throw error
  return (data ?? []) as Milestone[]
}

function mapCalendarEvent(
  event: CalendarEvent,
  projectName: string | null
): UnifiedCalendarEvent {
  const meetingTypes = ["meeting", "client_meeting", "sales", "internal"]
  const kind: UnifiedEventKind = event.event_type === "deadline"
    ? "deadline"
    : event.event_type === "milestone"
      ? "milestone"
      : meetingTypes.includes(event.event_type)
        ? "meeting"
        : "event"

  let link: string | null = null
  if (event.project_id) link = `/projects/${event.project_id}`

  return {
    id: `cal-${event.id}`,
    title: event.title,
    description: event.description,
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    allDay: event.all_day,
    kind,
    link,
    projectName,
    source: "calendar",
  }
}

export async function getUnifiedCalendarEvents(
  organizationId?: string
): Promise<UnifiedCalendarEvent[]> {
  const orgId = organizationId ?? ORG_ID

  const [calendarEvents, projects, payments, milestones] = await Promise.all([
    listCalendarEvents({ organizationId: orgId }),
    listProjects({ organizationId: orgId }),
    listPayments({ organizationId: orgId }),
    listOrgMilestones(orgId),
  ])

  const projectMap = new Map(projects.map((p) => [p.id, p]))
  const events: UnifiedCalendarEvent[] = []
  const seen = new Set<string>()

  for (const event of calendarEvents) {
    const projectName = event.project_id
      ? (projectMap.get(event.project_id)?.name ?? null)
      : null
    events.push(mapCalendarEvent(event, projectName))
    seen.add(`${event.event_type}-${event.related_id ?? event.id}-${event.starts_at.slice(0, 10)}`)
  }

  for (const project of projects) {
    if (!project.deadline) continue
    const key = `project_deadline-${project.id}-${project.deadline}`
    if (seen.has(key)) continue
    events.push({
      id: `proj-deadline-${project.id}`,
      title: `${project.name} deadline`,
      description: null,
      startsAt: project.deadline,
      endsAt: null,
      allDay: true,
      kind: "project_deadline",
      link: `/projects/${project.id}`,
      projectName: project.name,
      source: "derived",
    })
  }

  for (const milestone of milestones) {
    if (!milestone.due_date || milestone.status === "completed") continue
    const key = `milestone-${milestone.id}-${milestone.due_date}`
    if (seen.has(key)) continue
    const project = projectMap.get(milestone.project_id)
    events.push({
      id: `milestone-${milestone.id}`,
      title: milestone.title,
      description: milestone.description,
      startsAt: milestone.due_date,
      endsAt: null,
      allDay: true,
      kind: "milestone",
      link: `/projects/${milestone.project_id}`,
      projectName: project?.name ?? null,
      source: "derived",
    })
  }

  for (const payment of payments) {
    const date = payment.paid_at ?? payment.created_at
    if (!date) continue
    if (!["verified", "client_marked_paid", "under_review", "pending"].includes(payment.status)) {
      continue
    }
    const day = date.slice(0, 10)
    const key = `payment-${payment.id}-${day}`
    if (seen.has(key)) continue
    const project = projectMap.get(payment.project_id)
    const label =
      payment.status === "verified"
        ? "Payment received"
        : payment.status === "pending"
          ? "Payment due"
          : "Payment update"
    events.push({
      id: `payment-${payment.id}`,
      title: `${label} · ${project?.name ?? "Project"}`,
      description: payment.client?.company_name ?? null,
      startsAt: day,
      endsAt: null,
      allDay: true,
      kind: "payment",
      link: `/payments/${payment.id}`,
      projectName: project?.name ?? null,
      source: "derived",
    })
  }

  return events.sort((a, b) => a.startsAt.localeCompare(b.startsAt))
}
