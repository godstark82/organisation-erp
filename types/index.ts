export type AppRole =
  | "super_admin"
  | "manager"
  | "developer"
  | "designer"
  | "accountant"
  | "client"

export type SubscriptionPlan = "free" | "starter" | "pro" | "enterprise"
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired"

export type ClientStatus = "active" | "inactive" | "lead" | "archived"

export type ProjectStatus =
  | "lead"
  | "discussion"
  | "planning"
  | "in_progress"
  | "testing"
  | "client_review"
  | "completed"
  | "on_hold"
  | "cancelled"

export type PriorityLevel = "low" | "medium" | "high" | "urgent"

export type TaskStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "in_review"
  | "blocked"
  | "done"
  | "cancelled"

export type MilestoneStatus = "pending" | "in_progress" | "completed" | "overdue"

export type InvoiceStatus =
  | "draft"
  | "pending"
  | "sent"
  | "client_marked_paid"
  | "under_review"
  | "verified"
  | "rejected"
  | "disputed"
  | "overdue"

export type PaymentStatus =
  | "pending"
  | "client_marked_paid"
  | "under_review"
  | "verified"
  | "rejected"
  | "disputed"

export type DisputeStatus =
  | "open"
  | "awaiting_client"
  | "awaiting_admin"
  | "resolved"
  | "closed"

export type DocumentFolderType =
  | "contracts"
  | "invoices"
  | "deliverables"
  | "designs"
  | "source_code"
  | "payment_proofs"
  | "other"

export type NotificationType =
  | "task_assigned"
  | "deadline_tomorrow"
  | "invoice_paid"
  | "payment_under_review"
  | "comment_added"
  | "mentioned"
  | "project_update"
  | "dispute_raised"
  | "dispute_reply"
  | "general"

export type ActivityAction =
  | "created"
  | "updated"
  | "deleted"
  | "status_changed"
  | "assigned"
  | "commented"
  | "uploaded"
  | "paid"
  | "verified"
  | "rejected"
  | "disputed"
  | "mentioned"

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  owner_id: string | null
  subscription_plan: SubscriptionPlan
  subscription_status: SubscriptionStatus
  branding: Record<string, unknown>
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  organization_id: string | null
  email: string
  full_name: string
  avatar_url: string | null
  phone: string | null
  role: AppRole
  title: string | null
  is_active: boolean
  availability_status: string
  last_seen_at: string | null
  preferences: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  organization_id: string
  company_name: string
  client_name: string
  email: string
  phone: string | null
  gst: string | null
  address: string | null
  country: string | null
  notes: string | null
  status: ClientStatus
  portal_user_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ClientContact {
  id: string
  organization_id: string
  client_id: string
  name: string
  email: string | null
  phone: string | null
  title: string | null
  is_primary: boolean
  created_at: string
}

export interface ProjectCategory {
  id: string
  organization_id: string
  name: string
  color: string | null
  created_at: string
}

export interface Tag {
  id: string
  organization_id: string
  name: string
  color: string | null
  created_at: string
}

export interface Project {
  id: string
  organization_id: string
  project_code: string
  name: string
  client_id: string | null
  description: string | null
  category_id: string | null
  priority: PriorityLevel
  budget: number
  currency: string
  status: ProjectStatus
  start_date: string | null
  deadline: string | null
  delivery_date: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  client?: Client | null
  category?: ProjectCategory | null
  members?: ProjectMember[]
}

export interface ProjectMember {
  id: string
  organization_id: string
  project_id: string
  user_id: string
  role: string
  assigned_by: string | null
  assigned_at: string
  estimated_hours: number
  actual_hours: number
  user?: Profile
}

export interface Task {
  id: string
  organization_id: string
  project_id: string
  title: string
  description: string | null
  priority: PriorityLevel
  status: TaskStatus
  due_date: string | null
  position: number
  created_by: string | null
  parent_task_id: string | null
  created_at: string
  updated_at: string
  project?: Project
  assignees?: Profile[]
  checklist?: TaskChecklist[]
}

export interface TaskChecklist {
  id: string
  organization_id: string
  task_id: string
  title: string
  is_completed: boolean
  position: number
  created_at: string
}

export interface TimeLog {
  id: string
  organization_id: string
  project_id: string
  task_id: string | null
  user_id: string
  description: string | null
  started_at: string | null
  ended_at: string | null
  duration_seconds: number
  is_running: boolean
  is_paused: boolean
  paused_at: string | null
  accumulated_seconds: number
  is_manual: boolean
  created_at: string
  updated_at: string
  project?: Project
  task?: Task
  user?: Profile
}

export interface Milestone {
  id: string
  organization_id: string
  project_id: string
  title: string
  description: string | null
  amount: number
  due_date: string | null
  status: MilestoneStatus
  created_at: string
  updated_at: string
}

export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
}

export interface Invoice {
  id: string
  organization_id: string
  project_id: string | null
  client_id: string
  invoice_number: string
  amount: number
  gst_rate: number
  gst_amount: number
  total_amount: number
  currency: string
  due_date: string | null
  issue_date: string
  status: InvoiceStatus
  notes: string | null
  line_items: InvoiceLineItem[]
  pdf_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  client?: Client
  project?: Project | null
}

export interface Payment {
  id: string
  organization_id: string
  invoice_id: string | null
  client_id: string
  project_id: string
  amount: number
  currency: string
  status: PaymentStatus
  transaction_id: string | null
  utr: string | null
  notes: string | null
  paid_at: string | null
  verified_by: string | null
  verified_at: string | null
  rejection_reason: string | null
  /** Client has accepted this payment record */
  client_accepted_at: string | null
  client_accepted_by: string | null
  /** Project developer / super admin (staff) has accepted */
  staff_accepted_at: string | null
  staff_accepted_by: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  invoice?: Invoice | null
  client?: Client
  project?: Project | null
  proofs?: PaymentProof[]
}

export interface PaymentProof {
  id: string
  organization_id: string
  payment_id: string
  file_name: string
  file_url: string
  file_type: string | null
  file_size: number | null
  uploaded_by: string | null
  created_at: string
}

export interface PaymentDispute {
  id: string
  organization_id: string
  payment_id: string
  invoice_id: string | null
  reason: string
  expected_amount: number | null
  received_amount: number | null
  status: DisputeStatus
  raised_by: string
  created_at: string
  updated_at: string
  resolved_at: string | null
  messages?: PaymentDisputeMessage[]
}

export interface PaymentDisputeMessage {
  id: string
  organization_id: string
  dispute_id: string
  author_id: string
  message: string
  attachments: { name: string; url: string }[]
  created_at: string
  author?: Profile
}

export interface Comment {
  id: string
  organization_id: string
  entity_type: "project" | "task" | "payment" | "invoice" | "dispute"
  entity_id: string
  parent_id: string | null
  author_id: string
  body: string
  is_internal: boolean
  created_at: string
  updated_at: string
  author?: Profile
  replies?: Comment[]
}

export interface InternalNote {
  id: string
  organization_id: string
  entity_type: string
  entity_id: string
  author_id: string
  body: string
  created_at: string
  updated_at: string
  author?: Profile
}

export interface Folder {
  id: string
  organization_id: string
  project_id: string | null
  client_id: string | null
  parent_id: string | null
  name: string
  folder_type: DocumentFolderType
  created_at: string
}

export interface Document {
  id: string
  organization_id: string
  folder_id: string | null
  project_id: string | null
  client_id: string | null
  name: string
  file_url: string
  file_type: string | null
  file_size: number | null
  mime_type: string | null
  uploaded_by: string | null
  is_client_visible: boolean
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  organization_id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  entity_type: string | null
  entity_id: string | null
  is_read: boolean
  created_at: string
}

export interface ActivityLog {
  id: string
  organization_id: string
  actor_id: string | null
  action: ActivityAction
  entity_type: string
  entity_id: string | null
  entity_label: string | null
  metadata: Record<string, unknown>
  created_at: string
  actor?: Profile | null
}

export interface CalendarEvent {
  id: string
  organization_id: string
  title: string
  description: string | null
  event_type: string
  starts_at: string
  ends_at: string | null
  all_day: boolean
  project_id: string | null
  related_type: string | null
  related_id: string | null
  created_by: string | null
  created_at: string
}

export interface DashboardStats {
  revenue: number
  pendingPayments: number
  overduePayments: number
  activeProjects: number
  completedProjects: number
  awaitingVerification: number
  teamAvailability: { available: number; busy: number; offline: number }
  upcomingDeadlines: Array<{
    id: string
    title: string
    type: "project" | "milestone" | "payment"
    due_date: string
  }>
  recentActivities: ActivityLog[]
  clientMessages: Comment[]
  paymentRequests: Payment[]
  revenueSeries: { month: string; revenue: number }[]
  projectsSeries: { status: string; count: number }[]
  teamWorkload: { name: string; projects: number }[]
  paymentTrend: { month: string; received: number; pending: number }[]
}

export interface ClientDashboardStats {
  clientName: string
  /** Sum of max(0, budget − verified paid) across the client's projects */
  amountDue: number
  /** Total verified payments received from this client */
  amountPaid: number
  /** Total project budgets */
  totalBudget: number
  /** lead / discussion / planning / on_hold */
  pendingProjects: number
  /** in_progress / testing / client_review */
  activeProjects: number
  completedProjects: number
  /** Payments recorded by team waiting for client acceptance */
  awaitingYourAcceptanceCount: number
  awaitingYourAcceptanceAmount: number
  awaitingYourAcceptance: Array<{
    id: string
    amount: number
    currency: string
    projectName: string
    createdAt: string
  }>
  /** Projects that still have remaining budget balance */
  projectsWithBalance: Array<{
    id: string
    name: string
    status: ProjectStatus
    budget: number
    paid: number
    remaining: number
    currency: string
  }>
}

/** Agency / staff dashboard — mirror of client view from the receivable side */
export interface AgencyDashboardStats {
  /** Sum of max(0, budget − verified paid) still to collect */
  amountLeft: number
  /** Total verified payments received */
  amountReceived: number
  totalBudget: number
  pendingProjects: number
  activeProjects: number
  completedProjects: number
  /** Payments waiting for staff acceptance */
  awaitingYourAcceptanceCount: number
  awaitingYourAcceptanceAmount: number
  awaitingYourAcceptance: Array<{
    id: string
    amount: number
    currency: string
    projectName: string
    clientName: string
    createdAt: string
  }>
  projectsWithBalance: Array<{
    id: string
    name: string
    status: ProjectStatus
    clientName: string
    budget: number
    paid: number
    remaining: number
    currency: string
  }>
}

export interface SessionUser {
  id: string
  email: string
  profile: Profile
  organization: Organization | null
  permissions: string[]
}
