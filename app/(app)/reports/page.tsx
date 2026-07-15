import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { REPORT_DEFINITIONS } from "@/features/reports/report-config"
import { requirePermission } from "@/lib/auth/session"

export default async function ReportsPage() {
  await requirePermission("reports.view")

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Reports"
        description="Financial and operational insights for your agency."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {REPORT_DEFINITIONS.map((report) => {
          const Icon = report.icon
          return (
            <Link
              key={report.type}
              href={`/reports/${report.type}`}
              className="group no-underline"
            >
              <Card className="h-full shadow-sm transition-shadow group-hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-5">
                      <Icon />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-fg text-sm/6 group-hover:text-primary">
                        {report.title}
                      </h3>
                      <p className="mt-1 text-muted-fg text-xs/5">{report.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <span className="text-primary text-xs font-medium">View report →</span>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
