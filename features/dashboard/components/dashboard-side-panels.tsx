import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ActivityFeed } from "@/components/shared/activity-feed"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardAction, CardContent, CardHeader } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { DashboardStats } from "@/types"

interface DashboardSidePanelsProps {
  stats: Pick<
    DashboardStats,
    | "upcomingDeadlines"
    | "recentActivities"
    | "clientMessages"
    | "paymentRequests"
    | "teamAvailability"
  >
}

const deadlineTypeLabels: Record<
  DashboardStats["upcomingDeadlines"][number]["type"],
  string
> = {
  project: "Project",
  milestone: "Milestone",
  payment: "Payment",
}

export function DashboardSidePanels({ stats }: DashboardSidePanelsProps) {
  const {
    upcomingDeadlines,
    recentActivities,
    clientMessages,
    paymentRequests,
    teamAvailability,
  } = stats

  const totalTeam =
    teamAvailability.available + teamAvailability.busy + teamAvailability.offline

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-1">
      <Card className="shadow-sm">
        <CardHeader title="Upcoming deadlines" description="Next 30 days" />
        <CardContent>
          {upcomingDeadlines.length === 0 ? (
            <p className="py-6 text-center text-muted-fg text-sm">No upcoming deadlines</p>
          ) : (
            <ul className="divide-y divide-border">
              {upcomingDeadlines.map((item) => (
                <li key={`${item.type}-${item.id}`} className="flex items-start gap-3 py-3 first:pt-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">{item.title}</p>
                    <p className="text-muted-fg text-xs">
                      {deadlineTypeLabels[item.type]} · {formatDate(item.due_date)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader title="Recent activity" />
        <CardContent>
          <ActivityFeed items={recentActivities} emptyMessage="No recent activity" />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader title="Client messages" description="Latest project comments" />
        <CardContent>
          {clientMessages.length === 0 ? (
            <p className="py-6 text-center text-muted-fg text-sm">No client messages</p>
          ) : (
            <ul className="divide-y divide-border">
              {clientMessages.map((message) => (
                <li key={message.id} className="space-y-1 py-3 first:pt-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm">
                      {message.author?.full_name ?? "Client"}
                    </p>
                    <time
                      className="shrink-0 text-muted-fg text-xs tabular-nums"
                      dateTime={message.created_at}
                    >
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </time>
                  </div>
                  <p className="line-clamp-2 text-muted-fg text-sm">{message.body}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader title="Payment requests" description="Awaiting verification">
          {paymentRequests.length > 0 && (
            <CardAction>
              <Link
                href="/payments"
                className="font-medium text-primary text-xs hover:underline"
              >
                View all
              </Link>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          {paymentRequests.length === 0 ? (
            <p className="py-6 text-center text-muted-fg text-sm">No pending verifications</p>
          ) : (
            <ul className="divide-y divide-border">
              {paymentRequests.slice(0, 5).map((payment) => (
                <li key={payment.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">
                      {payment.project?.name ??
                        payment.client?.company_name ??
                        "Payment"}
                    </p>
                    <p className="text-muted-fg text-xs">
                      {payment.client?.company_name ?? "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-medium text-sm tabular-nums">
                      {formatCurrency(payment.amount, payment.currency)}
                    </span>
                    <StatusBadge type="payment" status={payment.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader title="Team availability" />
        <CardContent>
          {totalTeam === 0 ? (
            <p className="py-6 text-center text-muted-fg text-sm">No team members online</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <AvailabilityStat
                label="Available"
                count={teamAvailability.available}
                total={totalTeam}
                intent="success"
              />
              <AvailabilityStat
                label="Busy"
                count={teamAvailability.busy}
                total={totalTeam}
                intent="warning"
              />
              <AvailabilityStat
                label="Offline"
                count={teamAvailability.offline}
                total={totalTeam}
                intent="muted"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AvailabilityStat({
  label,
  count,
  total,
  intent,
}: {
  label: string
  count: number
  total: number
  intent: "success" | "warning" | "muted"
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  const barColor =
    intent === "success"
      ? "bg-success"
      : intent === "warning"
        ? "bg-warning"
        : "bg-muted-fg/40"

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-center">
      <p className="font-display font-semibold text-2xl tabular-nums">{count}</p>
      <p className="mt-0.5 text-muted-fg text-xs">{label}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
