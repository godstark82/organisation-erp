import Link from "next/link"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { Note } from "@/components/ui/note"
import { ReportView } from "@/features/reports/components/report-view"
import { getReportData } from "@/features/reports/lib/report-data"
import {
  getReportDefinition,
  isValidReportType,
} from "@/features/reports/report-config"
import { requirePermission } from "@/lib/auth/session"

interface ReportTypePageProps {
  params: Promise<{ type: string }>
}

export default async function ReportTypePage({ params }: ReportTypePageProps) {
  const session = await requirePermission("reports.view")
  const { type } = await params

  if (!isValidReportType(type)) {
    notFound()
  }

  const definition = getReportDefinition(type)
  const orgId = session.profile.organization_id ?? undefined

  let report
  let error: string | null = null

  try {
    report = await getReportData(type, orgId)
  } catch {
    error = "Unable to load report data. Please try again shortly."
    report = null
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title={definition.title}
        description={definition.description}
        breadcrumbs={
          <Link href="/reports" className="text-muted-fg text-sm hover:text-fg">
            ← All reports
          </Link>
        }
        actions={
          <Link
            href="/reports"
            className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 font-medium text-sm no-underline transition hover:bg-secondary"
          >
            Back to reports
          </Link>
        }
      />

      {error && (
        <Note intent="danger" className="text-sm">
          {error}
        </Note>
      )}

      {report && <ReportView report={report} />}
    </div>
  )
}
