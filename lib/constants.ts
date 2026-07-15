import type {
  ClientStatus,
  InvoiceStatus,
  PaymentStatus,
  PriorityLevel,
  ProjectStatus,
  TaskStatus,
} from "@/types"

export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "discussion", label: "Discussion" },
  { value: "planning", label: "Planning" },
  { value: "in_progress", label: "In Progress" },
  { value: "testing", label: "Testing" },
  { value: "client_review", label: "Client Review" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
  { value: "cancelled", label: "Cancelled" },
]

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
]

export const PRIORITIES: { value: PriorityLevel; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
]

export const INVOICE_STATUSES: { value: InvoiceStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "sent", label: "Sent" },
  { value: "client_marked_paid", label: "Client Marked Paid" },
  { value: "under_review", label: "Under Review" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "disputed", label: "Disputed" },
  { value: "overdue", label: "Overdue" },
]

export const PAYMENT_STATUSES: { value: PaymentStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "client_marked_paid", label: "Client Marked Paid" },
  { value: "under_review", label: "Under Review" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "disputed", label: "Disputed" },
]

export const CLIENT_STATUSES: { value: ClientStatus; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
]

export const FOLDER_TYPES = [
  { value: "contracts", label: "Contracts" },
  { value: "invoices", label: "Invoices" },
  { value: "deliverables", label: "Deliverables" },
  { value: "designs", label: "Designs" },
  { value: "source_code", label: "Source Code" },
  { value: "payment_proofs", label: "Payment Proofs" },
  { value: "other", label: "Other" },
] as const

export const APP_NAME = "AgencyOS"
