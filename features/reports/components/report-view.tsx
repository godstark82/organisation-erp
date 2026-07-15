"use client"

import {
  AreaChart,
} from "@/components/ui/area-chart"
import { BarChart } from "@/components/ui/bar-chart"
import { PieChart } from "@/components/ui/pie-chart"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/utils"
import type {
  ClientRevenueRow,
  PendingPaymentsData,
  ProjectProfitabilityRow,
  ReportData,
  RevenueReportData,
} from "../lib/report-data"

interface ReportViewProps {
  report: ReportData
}

export function ReportView({ report }: ReportViewProps) {
  switch (report.type) {
    case "revenue":
      return <RevenueReport data={report.data} />
    case "client-revenue":
      return <ClientRevenueReport data={report.data} />
    case "project-profitability":
      return <ProjectProfitabilityReport data={report.data} />
    case "pending-payments":
      return <PendingPaymentsReport data={report.data} />
    default:
      return null
  }
}

function RevenueReport({ data }: { data: RevenueReportData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total revenue" value={formatCurrency(data.totalRevenue)} />
        <StatCard label="Pending" value={formatCurrency(data.pendingPayments)} />
        <StatCard label="Overdue" value={formatCurrency(data.overduePayments)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {data.revenueSeries.length > 0 ? (
          <Card className="shadow-sm">
            <CardHeader title="Revenue trend" description="Verified payments by month" />
            <CardContent>
              <AreaChart
                className="h-72 w-full"
                data={data.revenueSeries}
                dataKey="month"
                config={{ revenue: { label: "Revenue", color: "chart-1" } }}
                valueFormatter={(v) => formatCurrency(v)}
                legend={false}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm">
            <CardHeader title="Revenue trend" />
            <CardContent>
              <p className="py-16 text-center text-muted-fg text-sm">No data available</p>
            </CardContent>
          </Card>
        )}

        {data.paymentTrend.length > 0 ? (
          <Card className="shadow-sm">
            <CardHeader title="Payment trend" description="Received vs pending" />
            <CardContent>
              <AreaChart
                className="h-72 w-full"
                data={data.paymentTrend}
                dataKey="month"
                type="stacked"
                config={{
                  received: { label: "Received", color: "chart-1" },
                  pending: { label: "Pending", color: "chart-4" },
                }}
                valueFormatter={(v) => formatCurrency(v)}
              />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

function ClientRevenueReport({ data }: { data: ClientRevenueRow[] }) {
  const pieData = data.filter((r) => r.revenue > 0).slice(0, 8)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        {pieData.length > 0 ? (
          <Card className="shadow-sm">
            <CardHeader title="Revenue by client" />
            <CardContent>
              <PieChart
                className="mx-auto h-72 w-full max-w-sm"
                data={pieData}
                dataKey="revenue"
                nameKey="clientName"
                variant="donut"
                showLabel
                valueFormatter={(v) => formatCurrency(v)}
                config={Object.fromEntries(
                  pieData.map((item, i) => [
                    item.clientId,
                    { label: item.clientName, color: `chart-${(i % 5) + 1}` },
                  ])
                )}
              />
            </CardContent>
          </Card>
        ) : null}

        <Card className="shadow-sm lg:col-span-2">
          <CardHeader title="Client revenue table" />
          <Table aria-label="Client revenue">
            <TableHeader>
              <TableColumn isRowHeader>Client</TableColumn>
              <TableColumn>Revenue</TableColumn>
              <TableColumn>Projects</TableColumn>
              <TableColumn>Payments</TableColumn>
            </TableHeader>
            <TableBody items={data}>
              {(row) => (
                <TableRow id={row.clientId}>
                  <TableCell>{row.clientName}</TableCell>
                  <TableCell>{formatCurrency(row.revenue)}</TableCell>
                  <TableCell>{row.projectCount}</TableCell>
                  <TableCell>{row.paymentCount}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}

function ProjectProfitabilityReport({ data }: { data: ProjectProfitabilityRow[] }) {
  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader
          title="Project profitability"
          description="Budget vs verified payments collected"
        />
        <Table aria-label="Project profitability">
          <TableHeader>
            <TableColumn isRowHeader>Project</TableColumn>
            <TableColumn>Budget</TableColumn>
            <TableColumn>Collected</TableColumn>
            <TableColumn>Margin</TableColumn>
            <TableColumn>Margin %</TableColumn>
          </TableHeader>
          <TableBody items={data}>
            {(row) => (
              <TableRow id={row.projectId}>
                <TableCell>{row.projectName}</TableCell>
                <TableCell>{formatCurrency(row.budget)}</TableCell>
                <TableCell>{formatCurrency(row.collected)}</TableCell>
                <TableCell
                  className={
                    row.margin >= 0 ? "text-success-subtle-fg" : "text-danger-subtle-fg"
                  }
                >
                  {formatCurrency(row.margin)}
                </TableCell>
                <TableCell>{row.marginPercent}%</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {data.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader title="Collected vs budget" />
          <CardContent>
            <BarChart
              className="h-80 w-full"
              data={data.slice(0, 8)}
              dataKey="projectName"
              config={{
                budget: { label: "Budget", color: "chart-3" },
                collected: { label: "Collected", color: "chart-1" },
              }}
              valueFormatter={(v) => formatCurrency(v)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function PendingPaymentsReport({ data }: { data: PendingPaymentsData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Pending total" value={formatCurrency(data.pendingTotal)} />
        <StatCard label="Overdue total" value={formatCurrency(data.overdueTotal)} />
      </div>

      {data.awaitingVerification.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader
            title="Awaiting verification"
            description={`${data.awaitingVerification.length} payment(s) need review`}
          />
          <Table aria-label="Payments awaiting verification">
            <TableHeader>
              <TableColumn isRowHeader>Project</TableColumn>
              <TableColumn>Amount</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn>Updated</TableColumn>
            </TableHeader>
            <TableBody items={data.awaitingVerification}>
              {(row) => (
                <TableRow id={row.id}>
                  <TableCell>{row.project?.name ?? "—"}</TableCell>
                  <TableCell>{formatCurrency(row.amount)}</TableCell>
                  <TableCell>
                    <StatusBadge type="payment" status={row.status} />
                  </TableCell>
                  <TableCell>{formatDate(row.updated_at)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardHeader title="All pending payments" />
        <Table aria-label="Pending payments">
          <TableHeader>
            <TableColumn isRowHeader>Project</TableColumn>
            <TableColumn>Client</TableColumn>
            <TableColumn>Amount</TableColumn>
            <TableColumn>Status</TableColumn>
          </TableHeader>
          <TableBody items={data.payments}>
            {(row) => (
              <TableRow id={row.id}>
                <TableCell>{row.project?.name ?? "—"}</TableCell>
                <TableCell>{row.client?.company_name ?? "—"}</TableCell>
                <TableCell>{formatCurrency(row.amount)}</TableCell>
                <TableCell>
                  <StatusBadge type="payment" status={row.status} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
