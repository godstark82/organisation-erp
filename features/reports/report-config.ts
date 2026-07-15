import {
  BanknotesIcon,
  ChartBarIcon,
  ClockIcon,
  ReceiptPercentIcon,
} from "@heroicons/react/24/outline"
import type { ComponentType, SVGProps } from "react"

export type ReportType =
  | "revenue"
  | "client-revenue"
  | "project-profitability"
  | "pending-payments"

export interface ReportDefinition {
  type: ReportType
  title: string
  description: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    type: "revenue",
    title: "Revenue Report",
    description: "Verified payments and revenue trends over time.",
    icon: BanknotesIcon,
  },
  {
    type: "client-revenue",
    title: "Client Revenue",
    description: "Revenue breakdown by client and engagement.",
    icon: ChartBarIcon,
  },
  {
    type: "project-profitability",
    title: "Project Profitability",
    description: "Budget vs collected revenue per project.",
    icon: ReceiptPercentIcon,
  },
  {
    type: "pending-payments",
    title: "Pending Payments",
    description: "Outstanding and under-review payment requests.",
    icon: ClockIcon,
  },
]

export function isValidReportType(type: string): type is ReportType {
  return REPORT_DEFINITIONS.some((r) => r.type === type)
}

export function getReportDefinition(type: ReportType) {
  return REPORT_DEFINITIONS.find((r) => r.type === type)!
}
