"use client"

import { AreaChart } from "@/components/ui/area-chart"
import { BarChart } from "@/components/ui/bar-chart"
import { PieChart } from "@/components/ui/pie-chart"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { PROJECT_STATUSES } from "@/lib/constants"
import { formatCurrency } from "@/lib/utils"
import type { DashboardStats } from "@/types"

function statusLabel(status: string) {
  return PROJECT_STATUSES.find((s) => s.value === status)?.label ?? status.replace(/_/g, " ")
}

interface DashboardChartsProps {
  stats: Pick<
    DashboardStats,
    "revenueSeries" | "projectsSeries" | "teamWorkload" | "paymentTrend"
  >
}

function ChartEmpty({ title }: { title: string }) {
  return (
    <Card className="shadow-sm">
      <CardHeader title={title} />
      <CardContent>
        <div className="flex h-64 items-center justify-center text-muted-fg text-sm">
          No chart data available yet
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardCharts({ stats }: DashboardChartsProps) {
  const { revenueSeries, projectsSeries, teamWorkload, paymentTrend } = stats

  const projectsPieData = projectsSeries.map((item) => ({
    name: statusLabel(item.status),
    code: item.status,
    count: item.count,
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {revenueSeries.length > 0 ? (
        <Card className="shadow-sm lg:col-span-2 xl:col-span-2">
          <CardHeader title="Revenue" description="Verified payments over time" />
          <CardContent>
            <AreaChart
              className="h-72 w-full"
              data={revenueSeries}
              dataKey="month"
              config={{ revenue: { label: "Revenue", color: "chart-1" } }}
              valueFormatter={(value) => formatCurrency(value)}
              legend={false}
            />
          </CardContent>
        </Card>
      ) : (
        <ChartEmpty title="Revenue" />
      )}

      {projectsPieData.length > 0 ? (
        <Card className="shadow-sm">
          <CardHeader title="Projects by status" description="Current portfolio breakdown" />
          <CardContent>
            <PieChart
              className="mx-auto h-72 w-full max-w-sm"
              data={projectsPieData}
              dataKey="count"
              nameKey="name"
              variant="donut"
              showLabel
              valueFormatter={(value) => String(value)}
              config={Object.fromEntries(
                projectsPieData.map((item, index) => [
                  item.code,
                  { label: item.name, color: `chart-${(index % 5) + 1}` },
                ])
              )}
            />
          </CardContent>
        </Card>
      ) : (
        <ChartEmpty title="Projects by status" />
      )}

      {teamWorkload.length > 0 ? (
        <Card className="shadow-sm">
          <CardHeader title="Team assignments" description="Active projects per team member" />
          <CardContent>
            <BarChart
              className="h-64 w-full"
              data={teamWorkload}
              dataKey="name"
              layout="vertical"
              config={{ projects: { label: "Projects", color: "chart-2" } }}
              valueFormatter={(value) => String(value)}
            />
          </CardContent>
        </Card>
      ) : (
        <ChartEmpty title="Team assignments" />
      )}

      {paymentTrend.length > 0 ? (
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader title="Payment trend" description="Received vs pending amounts" />
          <CardContent>
            <AreaChart
              className="h-64 w-full"
              data={paymentTrend}
              dataKey="month"
              type="stacked"
              config={{
                received: { label: "Received", color: "chart-1" },
                pending: { label: "Pending", color: "chart-4" },
              }}
              valueFormatter={(value) => formatCurrency(value)}
            />
          </CardContent>
        </Card>
      ) : (
        <ChartEmpty title="Payment trend" />
      )}
    </div>
  )
}
