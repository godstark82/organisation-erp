import { notFound } from "next/navigation"
import { requireSession } from "@/lib/auth/session"
import { ORG_ID } from "@/lib/data/demo-store"
import { listActivityLogs } from "@/lib/repositories/activity.repository"
import { getProject } from "@/lib/repositories/projects.repository"
import { ActivityFeed } from "@/components/shared/activity-feed"

export default async function ProjectActivityPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSession()
  const { id } = await params
  const project = await getProject(id)
  if (!project) notFound()

  const orgId = project.organization_id ?? ORG_ID

  const activity = await listActivityLogs({
    organizationId: orgId,
    entityType: "project",
    entityId: id,
    limit: 50,
  })

  return (
    <div className="rounded-xl border border-border p-5">
      <h2 className="mb-4 font-medium text-fg text-sm/6">Activity</h2>
      <ActivityFeed items={activity} />
    </div>
  )
}
