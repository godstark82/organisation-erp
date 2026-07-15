import type {
  ActivityLog,
  CalendarEvent,
  Client,
  ClientContact,
  Comment,
  Document,
  Folder,
  InternalNote,
  Invoice,
  Milestone,
  Notification,
  Organization,
  Payment,
  PaymentDispute,
  PaymentDisputeMessage,
  PaymentProof,
  Profile,
  Project,
  ProjectCategory,
  ProjectMember,
  Tag,
  Task,
  TaskChecklist,
  TimeLog,
} from "@/types"
import {
  dateOnly,
  daysAgo,
  daysFromNow,
  demoNow,
  generateDemoId,
  hoursAgo,
  touch,
} from "./demo-utils"

// ─── Consistent UUID constants ───────────────────────────────────────────────

export const ORG_ID = "a0000000-0000-4000-8000-000000000001"

export const USER_ADMIN_ID = "a0000000-0000-4000-8000-000000000010"
export const USER_MANAGER_ID = "a0000000-0000-4000-8000-000000000011"
export const USER_DEV1_ID = "a0000000-0000-4000-8000-000000000012"
export const USER_DEV2_ID = "a0000000-0000-4000-8000-000000000013"
export const USER_DESIGNER_ID = "a0000000-0000-4000-8000-000000000014"
export const USER_ACCOUNTANT_ID = "a0000000-0000-4000-8000-000000000015"
export const USER_CLIENT1_ID = "a0000000-0000-4000-8000-000000000016"
export const USER_CLIENT2_ID = "a0000000-0000-4000-8000-000000000017"

export const CLIENT_1_ID = "b0000000-0000-4000-8000-000000000001"
export const CLIENT_2_ID = "b0000000-0000-4000-8000-000000000002"
export const CLIENT_3_ID = "b0000000-0000-4000-8000-000000000003"
export const CLIENT_4_ID = "b0000000-0000-4000-8000-000000000004"
export const CLIENT_5_ID = "b0000000-0000-4000-8000-000000000005"
export const CLIENT_6_ID = "b0000000-0000-4000-8000-000000000006"

export const CAT_WEB_ID = "c0000000-0000-4000-8000-000000000001"
export const CAT_BRAND_ID = "c0000000-0000-4000-8000-000000000002"
export const CAT_MOBILE_ID = "c0000000-0000-4000-8000-000000000003"

export const PROJECT_1_ID = "d0000000-0000-4000-8000-000000000001"
export const PROJECT_2_ID = "d0000000-0000-4000-8000-000000000002"
export const PROJECT_3_ID = "d0000000-0000-4000-8000-000000000003"
export const PROJECT_4_ID = "d0000000-0000-4000-8000-000000000004"
export const PROJECT_5_ID = "d0000000-0000-4000-8000-000000000005"
export const PROJECT_6_ID = "d0000000-0000-4000-8000-000000000006"
export const PROJECT_7_ID = "d0000000-0000-4000-8000-000000000007"
export const PROJECT_8_ID = "d0000000-0000-4000-8000-000000000008"

export const INVOICE_1_ID = "e0000000-0000-4000-8000-000000000001"
export const INVOICE_2_ID = "e0000000-0000-4000-8000-000000000002"
export const INVOICE_3_ID = "e0000000-0000-4000-8000-000000000003"
export const INVOICE_4_ID = "e0000000-0000-4000-8000-000000000004"
export const INVOICE_5_ID = "e0000000-0000-4000-8000-000000000005"
export const INVOICE_6_ID = "e0000000-0000-4000-8000-000000000006"

export const PAYMENT_1_ID = "f0000000-0000-4000-8000-000000000001"
export const PAYMENT_2_ID = "f0000000-0000-4000-8000-000000000002"
export const PAYMENT_3_ID = "f0000000-0000-4000-8000-000000000003"
export const PAYMENT_4_ID = "f0000000-0000-4000-8000-000000000004"
export const PAYMENT_5_ID = "f0000000-0000-4000-8000-000000000005"

export const DISPUTE_1_ID = "f1000000-0000-4000-8000-000000000001"

export const TIME_RUNNING_ID = "f2000000-0000-4000-8000-000000000001"

// ─── Store shape ───────────────────────────────────────────────────────────

export interface TaskAssignee {
  task_id: string
  user_id: string
  assigned_at: string
}

export interface ProjectTag {
  project_id: string
  tag_id: string
}

export interface DemoStore {
  organization: Organization
  profiles: Profile[]
  clients: Client[]
  clientContacts: ClientContact[]
  projectCategories: ProjectCategory[]
  tags: Tag[]
  projects: Project[]
  projectMembers: ProjectMember[]
  projectTags: ProjectTag[]
  tasks: Task[]
  taskAssignees: TaskAssignee[]
  taskChecklists: TaskChecklist[]
  timeLogs: TimeLog[]
  milestones: Milestone[]
  invoices: Invoice[]
  payments: Payment[]
  paymentProofs: PaymentProof[]
  paymentDisputes: PaymentDispute[]
  paymentDisputeMessages: PaymentDisputeMessage[]
  comments: Comment[]
  internalNotes: InternalNote[]
  folders: Folder[]
  documents: Document[]
  notifications: Notification[]
  activityLogs: ActivityLog[]
  calendarEvents: CalendarEvent[]
}

function buildInitialStore(): DemoStore {
  const now = demoNow()

  const organization: Organization = {
    id: ORG_ID,
    name: "Northline Studio",
    slug: "northline-studio",
    logo_url: null,
    owner_id: USER_ADMIN_ID,
    subscription_plan: "pro",
    subscription_status: "active",
    branding: { primary_color: "#2563eb", accent: "#0ea5e9" },
    settings: {
      currency: "INR",
      gst_rate: 18,
      timezone: "Asia/Kolkata",
      invoice_prefix: "NLS",
    },
    created_at: daysAgo(365),
    updated_at: now,
  }

  const profiles: Profile[] = [
    {
      id: USER_ADMIN_ID,
      organization_id: ORG_ID,
      email: "alex.morgan@northline.studio",
      full_name: "Alex Morgan",
      avatar_url: null,
      phone: "+91 98765 43210",
      role: "super_admin",
      title: "Founder & CEO",
      is_active: true,
      availability_status: "available",
      last_seen_at: hoursAgo(0.5),
      preferences: { theme: "system" },
      created_at: daysAgo(365),
      updated_at: now,
    },
    {
      id: USER_MANAGER_ID,
      organization_id: ORG_ID,
      email: "priya.sharma@northline.studio",
      full_name: "Priya Sharma",
      avatar_url: null,
      phone: "+91 98765 43211",
      role: "manager",
      title: "Operations Manager",
      is_active: true,
      availability_status: "busy",
      last_seen_at: hoursAgo(1),
      preferences: {},
      created_at: daysAgo(300),
      updated_at: now,
    },
    {
      id: USER_DEV1_ID,
      organization_id: ORG_ID,
      email: "rahul.kapoor@northline.studio",
      full_name: "Rahul Kapoor",
      avatar_url: null,
      phone: "+91 98765 43212",
      role: "developer",
      title: "Senior Full-Stack Developer",
      is_active: true,
      availability_status: "busy",
      last_seen_at: hoursAgo(0.25),
      preferences: {},
      created_at: daysAgo(280),
      updated_at: now,
    },
    {
      id: USER_DEV2_ID,
      organization_id: ORG_ID,
      email: "sneha.iyer@northline.studio",
      full_name: "Sneha Iyer",
      avatar_url: null,
      phone: "+91 98765 43213",
      role: "developer",
      title: "Frontend Developer",
      is_active: true,
      availability_status: "available",
      last_seen_at: hoursAgo(2),
      preferences: {},
      created_at: daysAgo(200),
      updated_at: now,
    },
    {
      id: USER_DESIGNER_ID,
      organization_id: ORG_ID,
      email: "meera.desai@northline.studio",
      full_name: "Meera Desai",
      avatar_url: null,
      phone: "+91 98765 43214",
      role: "designer",
      title: "Lead UI/UX Designer",
      is_active: true,
      availability_status: "available",
      last_seen_at: hoursAgo(3),
      preferences: {},
      created_at: daysAgo(250),
      updated_at: now,
    },
    {
      id: USER_ACCOUNTANT_ID,
      organization_id: ORG_ID,
      email: "vikram.joshi@northline.studio",
      full_name: "Vikram Joshi",
      avatar_url: null,
      phone: "+91 98765 43215",
      role: "accountant",
      title: "Finance Manager",
      is_active: true,
      availability_status: "available",
      last_seen_at: hoursAgo(4),
      preferences: {},
      created_at: daysAgo(180),
      updated_at: now,
    },
    {
      id: USER_CLIENT1_ID,
      organization_id: ORG_ID,
      email: "arjun.malhotra@techventures.in",
      full_name: "Arjun Malhotra",
      avatar_url: null,
      phone: "+91 99887 76655",
      role: "client",
      title: "CTO",
      is_active: true,
      availability_status: "offline",
      last_seen_at: daysAgo(1),
      preferences: {},
      created_at: daysAgo(120),
      updated_at: now,
    },
    {
      id: USER_CLIENT2_ID,
      organization_id: ORG_ID,
      email: "kavita.reddy@greenleaf.co.in",
      full_name: "Kavita Reddy",
      avatar_url: null,
      phone: "+91 99887 76656",
      role: "client",
      title: "Marketing Director",
      is_active: true,
      availability_status: "offline",
      last_seen_at: daysAgo(2),
      preferences: {},
      created_at: daysAgo(90),
      updated_at: now,
    },
  ]

  const clients: Client[] = [
    {
      id: CLIENT_1_ID,
      organization_id: ORG_ID,
      company_name: "TechVentures Pvt Ltd",
      client_name: "Arjun Malhotra",
      email: "arjun.malhotra@techventures.in",
      phone: "+91 99887 76655",
      gst: "27AABCT1234F1Z5",
      address: "91 Springboard, Andheri East, Mumbai 400069",
      country: "India",
      notes: "Long-term retainer client. Prefers UPI/NEFT.",
      status: "active",
      portal_user_id: USER_CLIENT1_ID,
      created_by: USER_ADMIN_ID,
      created_at: daysAgo(120),
      updated_at: now,
    },
    {
      id: CLIENT_2_ID,
      organization_id: ORG_ID,
      company_name: "GreenLeaf Organics",
      client_name: "Kavita Reddy",
      email: "kavita.reddy@greenleaf.co.in",
      phone: "+91 99887 76656",
      gst: "29AABCG5678H1Z2",
      address: "HSR Layout, Bengaluru 560102",
      country: "India",
      notes: "D2C brand — seasonal campaign spikes.",
      status: "active",
      portal_user_id: USER_CLIENT2_ID,
      created_by: USER_MANAGER_ID,
      created_at: daysAgo(90),
      updated_at: now,
    },
    {
      id: CLIENT_3_ID,
      organization_id: ORG_ID,
      company_name: "Mumbai Metals Corp",
      client_name: "Sanjay Patil",
      email: "sanjay@mumbaimetals.com",
      phone: "+91 98220 11223",
      gst: "27AABCM9012K1Z8",
      address: "MIDC, Thane 400601",
      country: "India",
      notes: null,
      status: "active",
      portal_user_id: null,
      created_by: USER_MANAGER_ID,
      created_at: daysAgo(60),
      updated_at: now,
    },
    {
      id: CLIENT_4_ID,
      organization_id: ORG_ID,
      company_name: "Bengaluru FinTech Solutions",
      client_name: "Deepa Nair",
      email: "deepa@bfsolutions.in",
      phone: "+91 98450 33445",
      gst: "29AABCB3456L1Z1",
      address: "Koramangala, Bengaluru 560034",
      country: "India",
      notes: "Lead from referral — discovery call scheduled.",
      status: "lead",
      portal_user_id: null,
      created_by: USER_ADMIN_ID,
      created_at: daysAgo(14),
      updated_at: now,
    },
    {
      id: CLIENT_5_ID,
      organization_id: ORG_ID,
      company_name: "Delhi EduTech Academy",
      client_name: "Rohit Verma",
      email: "rohit@edutechdelhi.com",
      phone: "+91 98100 55667",
      gst: "07AABCE7890M1Z3",
      address: "Connaught Place, New Delhi 110001",
      country: "India",
      notes: "LMS + mobile app bundle.",
      status: "active",
      portal_user_id: null,
      created_by: USER_MANAGER_ID,
      created_at: daysAgo(45),
      updated_at: now,
    },
    {
      id: CLIENT_6_ID,
      organization_id: ORG_ID,
      company_name: "Pune Health Systems",
      client_name: "Anita Kulkarni",
      email: "anita@punehealth.in",
      phone: "+91 98230 77889",
      gst: "27AABCP2345N1Z6",
      address: "Baner, Pune 411045",
      country: "India",
      notes: "Project paused — budget review Q3.",
      status: "inactive",
      portal_user_id: null,
      created_by: USER_ADMIN_ID,
      created_at: daysAgo(200),
      updated_at: now,
    },
  ]

  const clientContacts: ClientContact[] = [
    {
      id: generateDemoId(),
      organization_id: ORG_ID,
      client_id: CLIENT_1_ID,
      name: "Arjun Malhotra",
      email: "arjun.malhotra@techventures.in",
      phone: "+91 99887 76655",
      title: "CTO",
      is_primary: true,
      created_at: daysAgo(120),
    },
    {
      id: generateDemoId(),
      organization_id: ORG_ID,
      client_id: CLIENT_1_ID,
      name: "Neha Gupta",
      email: "neha@techventures.in",
      phone: "+91 99887 76657",
      title: "Product Manager",
      is_primary: false,
      created_at: daysAgo(100),
    },
    {
      id: generateDemoId(),
      organization_id: ORG_ID,
      client_id: CLIENT_2_ID,
      name: "Kavita Reddy",
      email: "kavita.reddy@greenleaf.co.in",
      phone: "+91 99887 76656",
      title: "Marketing Director",
      is_primary: true,
      created_at: daysAgo(90),
    },
  ]

  const projectCategories: ProjectCategory[] = [
    { id: CAT_WEB_ID, organization_id: ORG_ID, name: "Web Development", color: "#3b82f6", created_at: daysAgo(365) },
    { id: CAT_BRAND_ID, organization_id: ORG_ID, name: "Branding", color: "#8b5cf6", created_at: daysAgo(365) },
    { id: CAT_MOBILE_ID, organization_id: ORG_ID, name: "Mobile Apps", color: "#10b981", created_at: daysAgo(365) },
  ]

  const tags: Tag[] = [
    { id: generateDemoId(), organization_id: ORG_ID, name: "retainer", color: "#f59e0b", created_at: daysAgo(300) },
    { id: generateDemoId(), organization_id: ORG_ID, name: "urgent", color: "#ef4444", created_at: daysAgo(300) },
    { id: generateDemoId(), organization_id: ORG_ID, name: "e-commerce", color: "#06b6d4", created_at: daysAgo(300) },
  ]

  const projects: Project[] = [
    {
      id: PROJECT_1_ID,
      organization_id: ORG_ID,
      project_code: "NLS-2026-001",
      name: "TechVentures E-commerce Redesign",
      client_id: CLIENT_1_ID,
      description: "Headless Shopify + custom checkout with INR payment gateways.",
      category_id: CAT_WEB_ID,
      priority: "high",
      budget: 850000,
      currency: "INR",
      status: "in_progress",
      start_date: dateOnly(-60),
      deadline: dateOnly(30),
      delivery_date: null,
      created_by: USER_MANAGER_ID,
      created_at: daysAgo(65),
      updated_at: now,
    },
    {
      id: PROJECT_2_ID,
      organization_id: ORG_ID,
      project_code: "NLS-2025-042",
      name: "GreenLeaf Mobile App MVP",
      client_id: CLIENT_2_ID,
      description: "React Native app for organic grocery delivery in Bengaluru.",
      category_id: CAT_MOBILE_ID,
      priority: "medium",
      budget: 620000,
      currency: "INR",
      status: "completed",
      start_date: dateOnly(-180),
      deadline: dateOnly(-15),
      delivery_date: dateOnly(-10),
      created_by: USER_ADMIN_ID,
      created_at: daysAgo(185),
      updated_at: daysAgo(10),
    },
    {
      id: PROJECT_3_ID,
      organization_id: ORG_ID,
      project_code: "NLS-2026-003",
      name: "Mumbai Metals Brand Refresh",
      client_id: CLIENT_3_ID,
      description: "Logo, brand guidelines, and corporate website.",
      category_id: CAT_BRAND_ID,
      priority: "medium",
      budget: 280000,
      currency: "INR",
      status: "planning",
      start_date: dateOnly(-10),
      deadline: dateOnly(45),
      delivery_date: null,
      created_by: USER_MANAGER_ID,
      created_at: daysAgo(12),
      updated_at: now,
    },
    {
      id: PROJECT_4_ID,
      organization_id: ORG_ID,
      project_code: "NLS-2026-004",
      name: "GreenLeaf Marketing Website",
      client_id: CLIENT_2_ID,
      description: "Campaign landing pages and CMS integration.",
      category_id: CAT_WEB_ID,
      priority: "high",
      budget: 195000,
      currency: "INR",
      status: "client_review",
      start_date: dateOnly(-40),
      deadline: dateOnly(5),
      delivery_date: null,
      created_by: USER_MANAGER_ID,
      created_at: daysAgo(42),
      updated_at: now,
    },
    {
      id: PROJECT_5_ID,
      organization_id: ORG_ID,
      project_code: "NLS-2026-005",
      name: "Delhi EduTech CRM Integration",
      client_id: CLIENT_5_ID,
      description: "HubSpot + custom LMS webhooks and lead scoring.",
      category_id: CAT_WEB_ID,
      priority: "urgent",
      budget: 340000,
      currency: "INR",
      status: "testing",
      start_date: dateOnly(-35),
      deadline: dateOnly(10),
      delivery_date: null,
      created_by: USER_ADMIN_ID,
      created_at: daysAgo(38),
      updated_at: now,
    },
    {
      id: PROJECT_6_ID,
      organization_id: ORG_ID,
      project_code: "NLS-2025-038",
      name: "Pune Health Legacy Migration",
      client_id: CLIENT_6_ID,
      description: "Patient portal migration from PHP to Next.js.",
      category_id: CAT_WEB_ID,
      priority: "low",
      budget: 450000,
      currency: "INR",
      status: "on_hold",
      start_date: dateOnly(-120),
      deadline: dateOnly(-30),
      delivery_date: null,
      created_by: USER_MANAGER_ID,
      created_at: daysAgo(125),
      updated_at: daysAgo(20),
    },
    {
      id: PROJECT_7_ID,
      organization_id: ORG_ID,
      project_code: "NLS-2026-007",
      name: "BFS AI Chatbot POC",
      client_id: CLIENT_4_ID,
      description: "RAG-based support bot for fintech onboarding FAQs.",
      category_id: CAT_WEB_ID,
      priority: "medium",
      budget: 150000,
      currency: "INR",
      status: "lead",
      start_date: null,
      deadline: dateOnly(60),
      delivery_date: null,
      created_by: USER_ADMIN_ID,
      created_at: daysAgo(7),
      updated_at: now,
    },
    {
      id: PROJECT_8_ID,
      organization_id: ORG_ID,
      project_code: "NLS-2026-008",
      name: "TechVentures SaaS Dashboard",
      client_id: CLIENT_1_ID,
      description: "Analytics dashboard for internal ops team.",
      category_id: CAT_WEB_ID,
      priority: "medium",
      budget: 420000,
      currency: "INR",
      status: "discussion",
      start_date: null,
      deadline: dateOnly(90),
      delivery_date: null,
      created_by: USER_MANAGER_ID,
      created_at: daysAgo(5),
      updated_at: now,
    },
  ]

  const projectMembers: ProjectMember[] = [
    { id: generateDemoId(), organization_id: ORG_ID, project_id: PROJECT_1_ID, user_id: USER_DEV1_ID, role: "lead", assigned_by: USER_MANAGER_ID, assigned_at: daysAgo(60), estimated_hours: 120, actual_hours: 78 },
    { id: generateDemoId(), organization_id: ORG_ID, project_id: PROJECT_1_ID, user_id: USER_DEV2_ID, role: "contributor", assigned_by: USER_MANAGER_ID, assigned_at: daysAgo(58), estimated_hours: 80, actual_hours: 52 },
    { id: generateDemoId(), organization_id: ORG_ID, project_id: PROJECT_1_ID, user_id: USER_DESIGNER_ID, role: "contributor", assigned_by: USER_MANAGER_ID, assigned_at: daysAgo(60), estimated_hours: 40, actual_hours: 35 },
    { id: generateDemoId(), organization_id: ORG_ID, project_id: PROJECT_2_ID, user_id: USER_DEV2_ID, role: "lead", assigned_by: USER_ADMIN_ID, assigned_at: daysAgo(180), estimated_hours: 200, actual_hours: 195 },
    { id: generateDemoId(), organization_id: ORG_ID, project_id: PROJECT_4_ID, user_id: USER_DEV2_ID, role: "lead", assigned_by: USER_MANAGER_ID, assigned_at: daysAgo(40), estimated_hours: 60, actual_hours: 55 },
    { id: generateDemoId(), organization_id: ORG_ID, project_id: PROJECT_4_ID, user_id: USER_DESIGNER_ID, role: "contributor", assigned_by: USER_MANAGER_ID, assigned_at: daysAgo(40), estimated_hours: 30, actual_hours: 28 },
    { id: generateDemoId(), organization_id: ORG_ID, project_id: PROJECT_5_ID, user_id: USER_DEV1_ID, role: "lead", assigned_by: USER_ADMIN_ID, assigned_at: daysAgo(35), estimated_hours: 90, actual_hours: 70 },
    { id: generateDemoId(), organization_id: ORG_ID, project_id: PROJECT_3_ID, user_id: USER_DESIGNER_ID, role: "lead", assigned_by: USER_MANAGER_ID, assigned_at: daysAgo(10), estimated_hours: 50, actual_hours: 8 },
  ]

  const projectTags: ProjectTag[] = [
    { project_id: PROJECT_1_ID, tag_id: tags[2].id },
    { project_id: PROJECT_1_ID, tag_id: tags[0].id },
    { project_id: PROJECT_5_ID, tag_id: tags[1].id },
  ]

  const taskDefs: Omit<Task, "organization_id">[] = [
    { id: generateDemoId(), project_id: PROJECT_1_ID, title: "Audit existing Shopify theme", description: "Document pain points and performance bottlenecks.", priority: "high", status: "done", due_date: daysAgo(50), position: 0, created_by: USER_MANAGER_ID, parent_task_id: null, created_at: daysAgo(58), updated_at: daysAgo(48) },
    { id: generateDemoId(), project_id: PROJECT_1_ID, title: "Design new product listing page", description: null, priority: "high", status: "done", due_date: daysAgo(35), position: 1, created_by: USER_DESIGNER_ID, parent_task_id: null, created_at: daysAgo(55), updated_at: daysAgo(30) },
    { id: generateDemoId(), project_id: PROJECT_1_ID, title: "Implement headless checkout API", description: "Razorpay + PayU integration with GST line items.", priority: "urgent", status: "in_progress", due_date: daysFromNow(7), position: 2, created_by: USER_DEV1_ID, parent_task_id: null, created_at: daysAgo(40), updated_at: hoursAgo(2) },
    { id: generateDemoId(), project_id: PROJECT_1_ID, title: "Set up CDN for product images", description: null, priority: "medium", status: "in_review", due_date: daysFromNow(3), position: 3, created_by: USER_DEV2_ID, parent_task_id: null, created_at: daysAgo(20), updated_at: daysAgo(1) },
    { id: generateDemoId(), project_id: PROJECT_1_ID, title: "Write E2E tests for checkout flow", description: null, priority: "medium", status: "todo", due_date: daysFromNow(14), position: 4, created_by: USER_DEV1_ID, parent_task_id: null, created_at: daysAgo(15), updated_at: daysAgo(15) },
    { id: generateDemoId(), project_id: PROJECT_1_ID, title: "GST invoice PDF generation", description: "Compliant with Indian tax format.", priority: "high", status: "blocked", due_date: daysFromNow(10), position: 5, created_by: USER_ACCOUNTANT_ID, parent_task_id: null, created_at: daysAgo(10), updated_at: daysAgo(2) },
    { id: generateDemoId(), project_id: PROJECT_4_ID, title: "Hero section animations", description: null, priority: "medium", status: "in_review", due_date: daysFromNow(2), position: 0, created_by: USER_DESIGNER_ID, parent_task_id: null, created_at: daysAgo(30), updated_at: daysAgo(1) },
    { id: generateDemoId(), project_id: PROJECT_4_ID, title: "Blog CMS schema", description: null, priority: "low", status: "done", due_date: daysAgo(10), position: 1, created_by: USER_DEV2_ID, parent_task_id: null, created_at: daysAgo(35), updated_at: daysAgo(8) },
    { id: generateDemoId(), project_id: PROJECT_4_ID, title: "SEO meta tags audit", description: null, priority: "medium", status: "in_progress", due_date: daysFromNow(5), position: 2, created_by: USER_DEV2_ID, parent_task_id: null, created_at: daysAgo(12), updated_at: hoursAgo(5) },
    { id: generateDemoId(), project_id: PROJECT_5_ID, title: "HubSpot webhook handlers", description: null, priority: "urgent", status: "in_progress", due_date: daysFromNow(3), position: 0, created_by: USER_DEV1_ID, parent_task_id: null, created_at: daysAgo(30), updated_at: hoursAgo(1) },
    { id: generateDemoId(), project_id: PROJECT_5_ID, title: "Lead scoring algorithm", description: null, priority: "high", status: "in_review", due_date: daysFromNow(6), position: 1, created_by: USER_DEV1_ID, parent_task_id: null, created_at: daysAgo(25), updated_at: daysAgo(1) },
    { id: generateDemoId(), project_id: PROJECT_5_ID, title: "UAT test plan", description: null, priority: "medium", status: "todo", due_date: daysFromNow(8), position: 2, created_by: USER_MANAGER_ID, parent_task_id: null, created_at: daysAgo(5), updated_at: daysAgo(5) },
    { id: generateDemoId(), project_id: PROJECT_5_ID, title: "Data migration scripts", description: null, priority: "high", status: "backlog", due_date: daysFromNow(20), position: 3, created_by: USER_DEV1_ID, parent_task_id: null, created_at: daysAgo(3), updated_at: daysAgo(3) },
    { id: generateDemoId(), project_id: PROJECT_3_ID, title: "Competitor brand analysis", description: null, priority: "medium", status: "done", due_date: daysAgo(5), position: 0, created_by: USER_DESIGNER_ID, parent_task_id: null, created_at: daysAgo(10), updated_at: daysAgo(4) },
    { id: generateDemoId(), project_id: PROJECT_3_ID, title: "Logo concepts (3 directions)", description: null, priority: "high", status: "in_progress", due_date: daysFromNow(10), position: 1, created_by: USER_DESIGNER_ID, parent_task_id: null, created_at: daysAgo(8), updated_at: daysAgo(1) },
    { id: generateDemoId(), project_id: PROJECT_3_ID, title: "Brand guidelines document", description: null, priority: "medium", status: "backlog", due_date: daysFromNow(30), position: 2, created_by: USER_DESIGNER_ID, parent_task_id: null, created_at: daysAgo(6), updated_at: daysAgo(6) },
    { id: generateDemoId(), project_id: PROJECT_2_ID, title: "App Store submission", description: null, priority: "high", status: "done", due_date: daysAgo(12), position: 0, created_by: USER_DEV2_ID, parent_task_id: null, created_at: daysAgo(20), updated_at: daysAgo(11) },
    { id: generateDemoId(), project_id: PROJECT_2_ID, title: "Play Store listing assets", description: null, priority: "medium", status: "done", due_date: daysAgo(15), position: 1, created_by: USER_DESIGNER_ID, parent_task_id: null, created_at: daysAgo(25), updated_at: daysAgo(14) },
    { id: generateDemoId(), project_id: PROJECT_6_ID, title: "Database schema mapping", description: null, priority: "low", status: "cancelled", due_date: daysAgo(40), position: 0, created_by: USER_DEV1_ID, parent_task_id: null, created_at: daysAgo(100), updated_at: daysAgo(25) },
    { id: generateDemoId(), project_id: PROJECT_7_ID, title: "Discovery workshop notes", description: null, priority: "medium", status: "todo", due_date: daysFromNow(5), position: 0, created_by: USER_ADMIN_ID, parent_task_id: null, created_at: daysAgo(3), updated_at: daysAgo(3) },
    { id: generateDemoId(), project_id: PROJECT_7_ID, title: "RAG architecture proposal", description: null, priority: "medium", status: "backlog", due_date: daysFromNow(15), position: 1, created_by: USER_DEV1_ID, parent_task_id: null, created_at: daysAgo(2), updated_at: daysAgo(2) },
    { id: generateDemoId(), project_id: PROJECT_8_ID, title: "Stakeholder interview summary", description: null, priority: "low", status: "todo", due_date: daysFromNow(7), position: 0, created_by: USER_MANAGER_ID, parent_task_id: null, created_at: daysAgo(4), updated_at: daysAgo(4) },
    { id: generateDemoId(), project_id: PROJECT_8_ID, title: "Wireframes for dashboard v1", description: null, priority: "medium", status: "backlog", due_date: daysFromNow(20), position: 1, created_by: USER_DESIGNER_ID, parent_task_id: null, created_at: daysAgo(3), updated_at: daysAgo(3) },
    { id: generateDemoId(), project_id: PROJECT_1_ID, title: "Performance budget report", description: "Lighthouse scores target 90+.", priority: "medium", status: "todo", due_date: daysFromNow(12), position: 6, created_by: USER_DEV2_ID, parent_task_id: null, created_at: daysAgo(7), updated_at: daysAgo(7) },
    { id: generateDemoId(), project_id: PROJECT_1_ID, title: "Mobile responsive QA", description: null, priority: "high", status: "backlog", due_date: daysFromNow(18), position: 7, created_by: USER_DEV2_ID, parent_task_id: null, created_at: daysAgo(5), updated_at: daysAgo(5) },
    { id: generateDemoId(), project_id: PROJECT_5_ID, title: "Security audit checklist", description: null, priority: "urgent", status: "blocked", due_date: daysFromNow(4), position: 4, created_by: USER_MANAGER_ID, parent_task_id: null, created_at: daysAgo(2), updated_at: daysAgo(1) },
    { id: generateDemoId(), project_id: PROJECT_4_ID, title: "Client feedback round 2", description: "Incorporate Kavita's colour palette changes.", priority: "high", status: "in_review", due_date: daysFromNow(1), position: 3, created_by: USER_DESIGNER_ID, parent_task_id: null, created_at: daysAgo(6), updated_at: hoursAgo(8) },
  ]

  const tasks: Task[] = taskDefs.map((t) => ({ ...t, organization_id: ORG_ID }))

  const checkoutTask = tasks.find((t) => t.title === "Implement headless checkout API")!
  const hubspotTask = tasks.find((t) => t.title === "HubSpot webhook handlers")!
  const logoTask = tasks.find((t) => t.title === "Logo concepts (3 directions)")!
  const seoTask = tasks.find((t) => t.title === "SEO meta tags audit")!

  const taskAssignees: TaskAssignee[] = [
    { task_id: checkoutTask.id, user_id: USER_DEV1_ID, assigned_at: daysAgo(38) },
    { task_id: hubspotTask.id, user_id: USER_DEV1_ID, assigned_at: daysAgo(28) },
    { task_id: logoTask.id, user_id: USER_DESIGNER_ID, assigned_at: daysAgo(7) },
    { task_id: seoTask.id, user_id: USER_DEV2_ID, assigned_at: daysAgo(10) },
    { task_id: tasks.find((t) => t.title === "Set up CDN for product images")!.id, user_id: USER_DEV2_ID, assigned_at: daysAgo(18) },
    { task_id: tasks.find((t) => t.title === "Hero section animations")!.id, user_id: USER_DESIGNER_ID, assigned_at: daysAgo(28) },
    { task_id: tasks.find((t) => t.title === "Lead scoring algorithm")!.id, user_id: USER_DEV1_ID, assigned_at: daysAgo(22) },
    { task_id: tasks.find((t) => t.title === "GST invoice PDF generation")!.id, user_id: USER_DEV1_ID, assigned_at: daysAgo(8) },
  ]

  const taskChecklists: TaskChecklist[] = [
    { id: generateDemoId(), organization_id: ORG_ID, task_id: checkoutTask.id, title: "Razorpay sandbox tested", is_completed: true, position: 0, created_at: daysAgo(30) },
    { id: generateDemoId(), organization_id: ORG_ID, task_id: checkoutTask.id, title: "PayU fallback wired", is_completed: true, position: 1, created_at: daysAgo(28) },
    { id: generateDemoId(), organization_id: ORG_ID, task_id: checkoutTask.id, title: "GST breakdown on receipt", is_completed: false, position: 2, created_at: daysAgo(25) },
    { id: generateDemoId(), organization_id: ORG_ID, task_id: hubspotTask.id, title: "Contact create webhook", is_completed: true, position: 0, created_at: daysAgo(20) },
    { id: generateDemoId(), organization_id: ORG_ID, task_id: hubspotTask.id, title: "Deal stage sync", is_completed: false, position: 1, created_at: daysAgo(18) },
  ]

  const milestones: Milestone[] = [
    { id: generateDemoId(), organization_id: ORG_ID, project_id: PROJECT_1_ID, title: "Design sign-off", description: "Client approves all UI mockups.", amount: 170000, due_date: dateOnly(-40), status: "completed", created_at: daysAgo(55), updated_at: daysAgo(38) },
    { id: generateDemoId(), organization_id: ORG_ID, project_id: PROJECT_1_ID, title: "Checkout go-live", description: "Production payment flow live.", amount: 340000, due_date: dateOnly(20), status: "in_progress", created_at: daysAgo(55), updated_at: now },
    { id: generateDemoId(), organization_id: ORG_ID, project_id: PROJECT_1_ID, title: "Final handover", description: null, amount: 340000, due_date: dateOnly(30), status: "pending", created_at: daysAgo(55), updated_at: daysAgo(55) },
    { id: generateDemoId(), organization_id: ORG_ID, project_id: PROJECT_5_ID, title: "Integration complete", description: null, amount: 170000, due_date: dateOnly(10), status: "in_progress", created_at: daysAgo(35), updated_at: now },
    { id: generateDemoId(), organization_id: ORG_ID, project_id: PROJECT_3_ID, title: "Brand identity delivery", description: null, amount: 140000, due_date: dateOnly(40), status: "pending", created_at: daysAgo(10), updated_at: daysAgo(10) },
    { id: generateDemoId(), organization_id: ORG_ID, project_id: PROJECT_2_ID, title: "MVP launch", description: null, amount: 310000, due_date: dateOnly(-15), status: "completed", created_at: daysAgo(180), updated_at: daysAgo(12) },
    { id: generateDemoId(), organization_id: ORG_ID, project_id: PROJECT_4_ID, title: "Website launch", description: null, amount: 97500, due_date: dateOnly(5), status: "overdue", created_at: daysAgo(40), updated_at: now },
  ]

  const invoices: Invoice[] = [
    {
      id: INVOICE_1_ID,
      organization_id: ORG_ID,
      project_id: PROJECT_1_ID,
      client_id: CLIENT_1_ID,
      invoice_number: "NLS-INV-2026-0142",
      amount: 340000,
      gst_rate: 18,
      gst_amount: 61200,
      total_amount: 401200,
      currency: "INR",
      due_date: dateOnly(-5),
      issue_date: dateOnly(-20),
      status: "verified",
      notes: "Milestone 1 — Design sign-off",
      line_items: [{ id: generateDemoId(), description: "UI/UX Design — E-commerce Redesign", quantity: 1, unit_price: 340000, amount: 340000 }],
      pdf_url: "/demo/invoices/NLS-INV-2026-0142.pdf",
      created_by: USER_ACCOUNTANT_ID,
      created_at: daysAgo(20),
      updated_at: daysAgo(8),
    },
    {
      id: INVOICE_2_ID,
      organization_id: ORG_ID,
      project_id: PROJECT_1_ID,
      client_id: CLIENT_1_ID,
      invoice_number: "NLS-INV-2026-0158",
      amount: 340000,
      gst_rate: 18,
      gst_amount: 61200,
      total_amount: 401200,
      currency: "INR",
      due_date: dateOnly(15),
      issue_date: dateOnly(-2),
      status: "sent",
      notes: "Milestone 2 — Checkout development",
      line_items: [{ id: generateDemoId(), description: "Development — Headless Checkout", quantity: 1, unit_price: 340000, amount: 340000 }],
      pdf_url: "/demo/invoices/NLS-INV-2026-0158.pdf",
      created_by: USER_ACCOUNTANT_ID,
      created_at: daysAgo(2),
      updated_at: daysAgo(2),
    },
    {
      id: INVOICE_3_ID,
      organization_id: ORG_ID,
      project_id: PROJECT_2_ID,
      client_id: CLIENT_2_ID,
      invoice_number: "NLS-INV-2026-0098",
      amount: 310000,
      gst_rate: 18,
      gst_amount: 55800,
      total_amount: 365800,
      currency: "INR",
      due_date: dateOnly(-25),
      issue_date: dateOnly(-40),
      status: "verified",
      notes: "Final MVP invoice",
      line_items: [{ id: generateDemoId(), description: "Mobile App MVP — GreenLeaf", quantity: 1, unit_price: 310000, amount: 310000 }],
      pdf_url: "/demo/invoices/NLS-INV-2026-0098.pdf",
      created_by: USER_ACCOUNTANT_ID,
      created_at: daysAgo(40),
      updated_at: daysAgo(15),
    },
    {
      id: INVOICE_4_ID,
      organization_id: ORG_ID,
      project_id: PROJECT_4_ID,
      client_id: CLIENT_2_ID,
      invoice_number: "NLS-INV-2026-0165",
      amount: 97500,
      gst_rate: 18,
      gst_amount: 17550,
      total_amount: 115050,
      currency: "INR",
      due_date: dateOnly(-3),
      issue_date: dateOnly(-18),
      status: "overdue",
      notes: "50% advance for marketing website",
      line_items: [{ id: generateDemoId(), description: "Marketing Website — Phase 1", quantity: 1, unit_price: 97500, amount: 97500 }],
      pdf_url: null,
      created_by: USER_ACCOUNTANT_ID,
      created_at: daysAgo(18),
      updated_at: daysAgo(3),
    },
    {
      id: INVOICE_5_ID,
      organization_id: ORG_ID,
      project_id: PROJECT_5_ID,
      client_id: CLIENT_5_ID,
      invoice_number: "NLS-INV-2026-0171",
      amount: 170000,
      gst_rate: 18,
      gst_amount: 30600,
      total_amount: 200600,
      currency: "INR",
      due_date: dateOnly(20),
      issue_date: dateOnly(0),
      status: "draft",
      notes: null,
      line_items: [{ id: generateDemoId(), description: "CRM Integration — Sprint 1", quantity: 1, unit_price: 170000, amount: 170000 }],
      pdf_url: null,
      created_by: USER_ACCOUNTANT_ID,
      created_at: daysAgo(1),
      updated_at: daysAgo(1),
    },
    {
      id: INVOICE_6_ID,
      organization_id: ORG_ID,
      project_id: PROJECT_4_ID,
      client_id: CLIENT_2_ID,
      invoice_number: "NLS-INV-2026-0160",
      amount: 115050,
      gst_rate: 18,
      gst_amount: 20709,
      total_amount: 135759,
      currency: "INR",
      due_date: dateOnly(10),
      issue_date: dateOnly(-1),
      status: "client_marked_paid",
      notes: "Client marked paid — awaiting verification",
      line_items: [{ id: generateDemoId(), description: "Marketing Website — Balance", quantity: 1, unit_price: 97500, amount: 97500 }, { id: generateDemoId(), description: "Additional revisions", quantity: 2, unit_price: 8775, amount: 17550 }],
      pdf_url: "/demo/invoices/NLS-INV-2026-0160.pdf",
      created_by: USER_ACCOUNTANT_ID,
      created_at: daysAgo(1),
      updated_at: hoursAgo(6),
    },
  ]

  const payments: Payment[] = [
    {
      id: PAYMENT_1_ID,
      organization_id: ORG_ID,
      invoice_id: INVOICE_1_ID,
      client_id: CLIENT_1_ID,
      project_id: PROJECT_1_ID,
      amount: 401200,
      currency: "INR",
      status: "verified",
      transaction_id: "TXN-TV-2026-8821",
      utr: "HDFCN26071234567890",
      notes: "NEFT from TechVentures HDFC account",
      paid_at: daysAgo(10),
      verified_by: USER_ACCOUNTANT_ID,
      verified_at: daysAgo(8),
      rejection_reason: null,
      client_accepted_at: daysAgo(10),
      client_accepted_by: USER_CLIENT1_ID,
      staff_accepted_at: daysAgo(8),
      staff_accepted_by: USER_ACCOUNTANT_ID,
      created_by: USER_CLIENT1_ID,
      created_at: daysAgo(10),
      updated_at: daysAgo(8),
    },
    {
      id: PAYMENT_2_ID,
      organization_id: ORG_ID,
      invoice_id: INVOICE_3_ID,
      client_id: CLIENT_2_ID,
      project_id: PROJECT_2_ID,
      amount: 365800,
      currency: "INR",
      status: "verified",
      transaction_id: "TXN-GL-2026-4412",
      utr: "ICICN26059876543210",
      notes: null,
      paid_at: daysAgo(18),
      verified_by: USER_ACCOUNTANT_ID,
      verified_at: daysAgo(15),
      rejection_reason: null,
      client_accepted_at: daysAgo(18),
      client_accepted_by: USER_CLIENT2_ID,
      staff_accepted_at: daysAgo(15),
      staff_accepted_by: USER_ACCOUNTANT_ID,
      created_by: USER_CLIENT2_ID,
      created_at: daysAgo(18),
      updated_at: daysAgo(15),
    },
    {
      id: PAYMENT_3_ID,
      organization_id: ORG_ID,
      invoice_id: INVOICE_6_ID,
      client_id: CLIENT_2_ID,
      project_id: PROJECT_4_ID,
      amount: 135759,
      currency: "INR",
      status: "pending",
      transaction_id: null,
      utr: "AXISN26071456789012",
      notes: "UPI transfer on 14 Jul 2026",
      paid_at: hoursAgo(6),
      verified_by: null,
      verified_at: null,
      rejection_reason: null,
      client_accepted_at: hoursAgo(6),
      client_accepted_by: USER_CLIENT2_ID,
      staff_accepted_at: null,
      staff_accepted_by: null,
      created_by: USER_CLIENT2_ID,
      created_at: hoursAgo(6),
      updated_at: hoursAgo(6),
    },
    {
      id: PAYMENT_4_ID,
      organization_id: ORG_ID,
      invoice_id: INVOICE_4_ID,
      client_id: CLIENT_2_ID,
      project_id: PROJECT_4_ID,
      amount: 115050,
      currency: "INR",
      status: "disputed",
      transaction_id: null,
      utr: "SBIN26070112233445",
      notes: "Partial payment claimed by client",
      paid_at: daysAgo(5),
      verified_by: null,
      verified_at: null,
      rejection_reason: null,
      client_accepted_at: daysAgo(5),
      client_accepted_by: USER_CLIENT2_ID,
      staff_accepted_at: null,
      staff_accepted_by: null,
      created_by: USER_CLIENT2_ID,
      created_at: daysAgo(5),
      updated_at: daysAgo(3),
    },
    {
      id: PAYMENT_5_ID,
      organization_id: ORG_ID,
      invoice_id: INVOICE_2_ID,
      client_id: CLIENT_1_ID,
      project_id: PROJECT_1_ID,
      amount: 401200,
      currency: "INR",
      status: "pending",
      transaction_id: null,
      utr: null,
      notes: null,
      paid_at: null,
      verified_by: null,
      verified_at: null,
      rejection_reason: null,
      client_accepted_at: null,
      client_accepted_by: null,
      staff_accepted_at: daysAgo(2),
      staff_accepted_by: USER_ACCOUNTANT_ID,
      created_by: USER_ACCOUNTANT_ID,
      created_at: daysAgo(2),
      updated_at: daysAgo(2),
    },
  ]

  const paymentProofs: PaymentProof[] = [
    {
      id: generateDemoId(),
      organization_id: ORG_ID,
      payment_id: PAYMENT_1_ID,
      file_name: "techventures-neft-receipt.pdf",
      file_url: "/demo/proofs/techventures-neft-receipt.pdf",
      file_type: "pdf",
      file_size: 245_000,
      uploaded_by: USER_CLIENT1_ID,
      created_at: daysAgo(10),
    },
    {
      id: generateDemoId(),
      organization_id: ORG_ID,
      payment_id: PAYMENT_3_ID,
      file_name: "greenleaf-upi-screenshot.png",
      file_url: "/demo/proofs/greenleaf-upi-screenshot.png",
      file_type: "image",
      file_size: 512_000,
      uploaded_by: USER_CLIENT2_ID,
      created_at: hoursAgo(6),
    },
    {
      id: generateDemoId(),
      organization_id: ORG_ID,
      payment_id: PAYMENT_4_ID,
      file_name: "partial-payment-proof.jpg",
      file_url: "/demo/proofs/partial-payment-proof.jpg",
      file_type: "image",
      file_size: 380_000,
      uploaded_by: USER_CLIENT2_ID,
      created_at: daysAgo(5),
    },
  ]

  const paymentDisputes: PaymentDispute[] = [
    {
      id: DISPUTE_1_ID,
      organization_id: ORG_ID,
      payment_id: PAYMENT_4_ID,
      invoice_id: INVOICE_4_ID,
      reason: "Client transferred ₹95,000 but invoice total is ₹1,15,050. Claims 10% discount was agreed verbally.",
      expected_amount: 115050,
      received_amount: 95000,
      status: "awaiting_admin",
      raised_by: USER_CLIENT2_ID,
      created_at: daysAgo(3),
      updated_at: daysAgo(1),
      resolved_at: null,
    },
  ]

  const paymentDisputeMessages: PaymentDisputeMessage[] = [
    {
      id: generateDemoId(),
      organization_id: ORG_ID,
      dispute_id: DISPUTE_1_ID,
      author_id: USER_CLIENT2_ID,
      message: "We agreed on a 10% early-payment discount during the kickoff call. Please verify the UTR for ₹95,000.",
      attachments: [{ name: "partial-payment-proof.jpg", url: "/demo/proofs/partial-payment-proof.jpg" }],
      created_at: daysAgo(3),
    },
    {
      id: generateDemoId(),
      organization_id: ORG_ID,
      dispute_id: DISPUTE_1_ID,
      author_id: USER_ACCOUNTANT_ID,
      message: "We don't have a signed amendment reflecting the discount. Can you share the email thread where this was confirmed?",
      attachments: [],
      created_at: daysAgo(2),
    },
    {
      id: generateDemoId(),
      organization_id: ORG_ID,
      dispute_id: DISPUTE_1_ID,
      author_id: USER_CLIENT2_ID,
      message: "Forwarding the email from Priya dated 28 Jun mentioning the discount. UTR: SBIN26070112233445.",
      attachments: [{ name: "discount-email.pdf", url: "/demo/proofs/discount-email.pdf" }],
      created_at: daysAgo(1),
    },
  ]

  const timeLogs: TimeLog[] = [
    {
      id: TIME_RUNNING_ID,
      organization_id: ORG_ID,
      project_id: PROJECT_1_ID,
      task_id: checkoutTask.id,
      user_id: USER_DEV1_ID,
      description: "Razorpay webhook integration",
      started_at: hoursAgo(2.5),
      ended_at: null,
      duration_seconds: 0,
      is_running: true,
      is_paused: false,
      paused_at: null,
      accumulated_seconds: 0,
      is_manual: false,
      created_at: hoursAgo(2.5),
      updated_at: hoursAgo(0.25),
    },
    {
      id: generateDemoId(),
      organization_id: ORG_ID,
      project_id: PROJECT_1_ID,
      task_id: checkoutTask.id,
      user_id: USER_DEV1_ID,
      description: "Checkout API scaffolding",
      started_at: daysAgo(3),
      ended_at: daysAgo(3),
      duration_seconds: 14_400,
      is_running: false,
      is_paused: false,
      paused_at: null,
      accumulated_seconds: 14_400,
      is_manual: false,
      created_at: daysAgo(3),
      updated_at: daysAgo(3),
    },
    {
      id: generateDemoId(),
      organization_id: ORG_ID,
      project_id: PROJECT_5_ID,
      task_id: hubspotTask.id,
      user_id: USER_DEV1_ID,
      description: "HubSpot contact sync",
      started_at: daysAgo(2),
      ended_at: daysAgo(2),
      duration_seconds: 10_800,
      is_running: false,
      is_paused: false,
      paused_at: null,
      accumulated_seconds: 10_800,
      is_manual: false,
      created_at: daysAgo(2),
      updated_at: daysAgo(2),
    },
    {
      id: generateDemoId(),
      organization_id: ORG_ID,
      project_id: PROJECT_4_ID,
      task_id: seoTask.id,
      user_id: USER_DEV2_ID,
      description: "Meta tags implementation",
      started_at: daysAgo(1),
      ended_at: daysAgo(1),
      duration_seconds: 7200,
      is_running: false,
      is_paused: false,
      paused_at: null,
      accumulated_seconds: 7200,
      is_manual: false,
      created_at: daysAgo(1),
      updated_at: daysAgo(1),
    },
    {
      id: generateDemoId(),
      organization_id: ORG_ID,
      project_id: PROJECT_3_ID,
      task_id: logoTask.id,
      user_id: USER_DESIGNER_ID,
      description: "Logo sketching session",
      started_at: daysAgo(1),
      ended_at: daysAgo(1),
      duration_seconds: 5400,
      is_running: false,
      is_paused: false,
      paused_at: null,
      accumulated_seconds: 5400,
      is_manual: true,
      created_at: daysAgo(1),
      updated_at: daysAgo(1),
    },
    {
      id: generateDemoId(),
      organization_id: ORG_ID,
      project_id: PROJECT_2_ID,
      task_id: null,
      user_id: USER_DEV2_ID,
      description: "Post-launch bug fixes",
      started_at: daysAgo(12),
      ended_at: daysAgo(11),
      duration_seconds: 18_000,
      is_running: false,
      is_paused: false,
      paused_at: null,
      accumulated_seconds: 18_000,
      is_manual: true,
      created_at: daysAgo(12),
      updated_at: daysAgo(11),
    },
  ]

  const folderContracts = generateDemoId()
  const folderDeliverables = generateDemoId()
  const folderDesigns = generateDemoId()
  const folderProofs = generateDemoId()
  const folderInvoices = generateDemoId()

  const folders: Folder[] = [
    { id: folderContracts, organization_id: ORG_ID, project_id: PROJECT_1_ID, client_id: CLIENT_1_ID, parent_id: null, name: "Contracts", folder_type: "contracts", created_at: daysAgo(60) },
    { id: folderDeliverables, organization_id: ORG_ID, project_id: PROJECT_1_ID, client_id: CLIENT_1_ID, parent_id: null, name: "Deliverables", folder_type: "deliverables", created_at: daysAgo(55) },
    { id: folderDesigns, organization_id: ORG_ID, project_id: PROJECT_4_ID, client_id: CLIENT_2_ID, parent_id: null, name: "Designs", folder_type: "designs", created_at: daysAgo(35) },
    { id: folderProofs, organization_id: ORG_ID, project_id: null, client_id: CLIENT_2_ID, parent_id: null, name: "Payment Proofs", folder_type: "payment_proofs", created_at: daysAgo(10) },
    { id: folderInvoices, organization_id: ORG_ID, project_id: null, client_id: null, parent_id: null, name: "Invoices", folder_type: "invoices", created_at: daysAgo(90) },
  ]

  const documents: Document[] = [
    { id: generateDemoId(), organization_id: ORG_ID, folder_id: folderContracts, project_id: PROJECT_1_ID, client_id: CLIENT_1_ID, name: "TechVentures-SOW-2026.pdf", file_url: "/demo/docs/techventures-sow.pdf", file_type: "pdf", file_size: 1_200_000, mime_type: "application/pdf", uploaded_by: USER_MANAGER_ID, is_client_visible: true, created_at: daysAgo(60), updated_at: daysAgo(60) },
    { id: generateDemoId(), organization_id: ORG_ID, folder_id: folderDeliverables, project_id: PROJECT_1_ID, client_id: CLIENT_1_ID, name: "Checkout-Flow-Wireframes.fig", file_url: "/demo/docs/checkout-wireframes.fig", file_type: "figma", file_size: 8_500_000, mime_type: "application/octet-stream", uploaded_by: USER_DESIGNER_ID, is_client_visible: true, created_at: daysAgo(40), updated_at: daysAgo(40) },
    { id: generateDemoId(), organization_id: ORG_ID, folder_id: folderDesigns, project_id: PROJECT_4_ID, client_id: CLIENT_2_ID, name: "GreenLeaf-Hero-v3.png", file_url: "/demo/docs/greenleaf-hero-v3.png", file_type: "image", file_size: 2_100_000, mime_type: "image/png", uploaded_by: USER_DESIGNER_ID, is_client_visible: true, created_at: daysAgo(5), updated_at: daysAgo(5) },
    { id: generateDemoId(), organization_id: ORG_ID, folder_id: folderProofs, project_id: PROJECT_4_ID, client_id: CLIENT_2_ID, name: "UPI-Receipt-14Jul.png", file_url: "/demo/proofs/greenleaf-upi-screenshot.png", file_type: "image", file_size: 512_000, mime_type: "image/png", uploaded_by: USER_CLIENT2_ID, is_client_visible: false, created_at: hoursAgo(6), updated_at: hoursAgo(6) },
    { id: generateDemoId(), organization_id: ORG_ID, folder_id: folderInvoices, project_id: PROJECT_1_ID, client_id: CLIENT_1_ID, name: "NLS-INV-2026-0142.pdf", file_url: "/demo/invoices/NLS-INV-2026-0142.pdf", file_type: "pdf", file_size: 180_000, mime_type: "application/pdf", uploaded_by: USER_ACCOUNTANT_ID, is_client_visible: true, created_at: daysAgo(20), updated_at: daysAgo(20) },
    { id: generateDemoId(), organization_id: ORG_ID, folder_id: folderDeliverables, project_id: PROJECT_1_ID, client_id: CLIENT_1_ID, name: "API-Documentation.md", file_url: "/demo/docs/api-docs.md", file_type: "markdown", file_size: 45_000, mime_type: "text/markdown", uploaded_by: USER_DEV1_ID, is_client_visible: false, created_at: daysAgo(15), updated_at: daysAgo(10) },
  ]

  const comments: Comment[] = [
    { id: generateDemoId(), organization_id: ORG_ID, entity_type: "project", entity_id: PROJECT_1_ID, parent_id: null, author_id: USER_CLIENT1_ID, body: "Can we prioritise Razorpay over PayU for the launch?", is_internal: false, created_at: daysAgo(5), updated_at: daysAgo(5) },
    { id: generateDemoId(), organization_id: ORG_ID, entity_type: "project", entity_id: PROJECT_1_ID, parent_id: null, author_id: USER_DEV1_ID, body: "Razorpay is already wired — PayU is fallback only.", is_internal: false, created_at: daysAgo(4), updated_at: daysAgo(4) },
    { id: generateDemoId(), organization_id: ORG_ID, entity_type: "task", entity_id: checkoutTask.id, parent_id: null, author_id: USER_MANAGER_ID, body: "Blocked on GST format — need Vikram's input.", is_internal: true, created_at: daysAgo(2), updated_at: daysAgo(2) },
    { id: generateDemoId(), organization_id: ORG_ID, entity_type: "task", entity_id: checkoutTask.id, parent_id: null, author_id: USER_ACCOUNTANT_ID, body: "GST invoice template shared in #finance channel.", is_internal: true, created_at: daysAgo(1), updated_at: daysAgo(1) },
    { id: generateDemoId(), organization_id: ORG_ID, entity_type: "invoice", entity_id: INVOICE_6_ID, parent_id: null, author_id: USER_CLIENT2_ID, body: "Payment sent via UPI — please verify.", is_internal: false, created_at: hoursAgo(6), updated_at: hoursAgo(6) },
    { id: generateDemoId(), organization_id: ORG_ID, entity_type: "dispute", entity_id: DISPUTE_1_ID, parent_id: null, author_id: USER_CLIENT2_ID, body: "Attaching email confirmation for the discount.", is_internal: false, created_at: daysAgo(1), updated_at: daysAgo(1) },
  ]

  const internalNotes: InternalNote[] = [
    { id: generateDemoId(), organization_id: ORG_ID, entity_type: "client", entity_id: CLIENT_1_ID, author_id: USER_ADMIN_ID, body: "TechVentures is upsell candidate for SaaS dashboard project.", created_at: daysAgo(10), updated_at: daysAgo(10) },
    { id: generateDemoId(), organization_id: ORG_ID, entity_type: "project", entity_id: PROJECT_6_ID, author_id: USER_MANAGER_ID, body: "Paused until client confirms Q3 budget — follow up mid-August.", created_at: daysAgo(20), updated_at: daysAgo(20) },
    { id: generateDemoId(), organization_id: ORG_ID, entity_type: "client", entity_id: CLIENT_2_ID, author_id: USER_ACCOUNTANT_ID, body: "Watch payment disputes — historically slow on overdue invoices.", created_at: daysAgo(5), updated_at: daysAgo(5) },
  ]

  const notifications: Notification[] = [
    { id: generateDemoId(), organization_id: ORG_ID, user_id: USER_ADMIN_ID, type: "payment_under_review", title: "Payment awaiting verification", body: "GreenLeaf marked invoice NLS-INV-2026-0160 as paid.", link: "/payments", entity_type: "payment", entity_id: PAYMENT_3_ID, is_read: false, created_at: hoursAgo(6) },
    { id: generateDemoId(), organization_id: ORG_ID, user_id: USER_ACCOUNTANT_ID, type: "payment_under_review", title: "New payment proof uploaded", body: "Kavita Reddy uploaded UPI screenshot.", link: "/payments", entity_type: "payment", entity_id: PAYMENT_3_ID, is_read: false, created_at: hoursAgo(6) },
    { id: generateDemoId(), organization_id: ORG_ID, user_id: USER_DEV1_ID, type: "deadline_tomorrow", title: "Project deadline coming up", body: "Checkout API project milestone is approaching.", link: `/projects/${PROJECT_1_ID}`, entity_type: "project", entity_id: PROJECT_1_ID, is_read: true, created_at: daysAgo(38) },
    { id: generateDemoId(), organization_id: ORG_ID, user_id: USER_MANAGER_ID, type: "dispute_raised", title: "Payment dispute opened", body: "GreenLeaf disputed a project payment.", link: "/payments", entity_type: "dispute", entity_id: DISPUTE_1_ID, is_read: false, created_at: daysAgo(3) },
    { id: generateDemoId(), organization_id: ORG_ID, user_id: USER_DESIGNER_ID, type: "deadline_tomorrow", title: "Deadline tomorrow", body: "Brand identity project deadline is tomorrow.", link: `/projects/${PROJECT_3_ID}`, entity_type: "project", entity_id: PROJECT_3_ID, is_read: false, created_at: daysAgo(0) },
    { id: generateDemoId(), organization_id: ORG_ID, user_id: USER_CLIENT2_ID, type: "payment_under_review", title: "Payment under review", body: "Your payment is awaiting verification.", link: "/payments", entity_type: "payment", entity_id: PAYMENT_3_ID, is_read: true, created_at: daysAgo(1) },
    { id: generateDemoId(), organization_id: ORG_ID, user_id: USER_DEV2_ID, type: "project_update", title: "Project status changed", body: "GreenLeaf Marketing Website moved to Client Review.", link: "/projects", entity_type: "project", entity_id: PROJECT_4_ID, is_read: false, created_at: daysAgo(3) },
    { id: generateDemoId(), organization_id: ORG_ID, user_id: USER_ADMIN_ID, type: "general", title: "Weekly standup reminder", body: "Team standup at 10:30 AM IST.", link: "/calendar", entity_type: null, entity_id: null, is_read: true, created_at: daysAgo(0) },
  ]

  const activityLogs: ActivityLog[] = [
    { id: generateDemoId(), organization_id: ORG_ID, actor_id: USER_CLIENT2_ID, action: "paid", entity_type: "payment", entity_id: PAYMENT_3_ID, entity_label: "NLS-INV-2026-0160", metadata: { utr: "AXISN26071456789012" }, created_at: hoursAgo(6) },
    { id: generateDemoId(), organization_id: ORG_ID, actor_id: USER_DEV1_ID, action: "status_changed", entity_type: "task", entity_id: checkoutTask.id, entity_label: "Implement headless checkout API", metadata: { from: "todo", to: "in_progress" }, created_at: daysAgo(2) },
    { id: generateDemoId(), organization_id: ORG_ID, actor_id: USER_ACCOUNTANT_ID, action: "verified", entity_type: "payment", entity_id: PAYMENT_1_ID, entity_label: "NLS-INV-2026-0142", metadata: {}, created_at: daysAgo(8) },
    { id: generateDemoId(), organization_id: ORG_ID, actor_id: USER_MANAGER_ID, action: "created", entity_type: "project", entity_id: PROJECT_8_ID, entity_label: "TechVentures SaaS Dashboard", metadata: {}, created_at: daysAgo(5) },
    { id: generateDemoId(), organization_id: ORG_ID, actor_id: USER_CLIENT2_ID, action: "disputed", entity_type: "payment", entity_id: PAYMENT_4_ID, entity_label: "NLS-INV-2026-0165", metadata: {}, created_at: daysAgo(3) },
    { id: generateDemoId(), organization_id: ORG_ID, actor_id: USER_DESIGNER_ID, action: "uploaded", entity_type: "document", entity_id: documents[2].id, entity_label: "GreenLeaf-Hero-v3.png", metadata: {}, created_at: daysAgo(5) },
    { id: generateDemoId(), organization_id: ORG_ID, actor_id: USER_DEV2_ID, action: "assigned", entity_type: "task", entity_id: seoTask.id, entity_label: "SEO meta tags audit", metadata: { assignee: USER_DEV2_ID }, created_at: daysAgo(10) },
    { id: generateDemoId(), organization_id: ORG_ID, actor_id: USER_ADMIN_ID, action: "created", entity_type: "client", entity_id: CLIENT_4_ID, entity_label: "Bengaluru FinTech Solutions", metadata: {}, created_at: daysAgo(14) },
    { id: generateDemoId(), organization_id: ORG_ID, actor_id: USER_ACCOUNTANT_ID, action: "created", entity_type: "invoice", entity_id: INVOICE_5_ID, entity_label: "NLS-INV-2026-0171", metadata: {}, created_at: daysAgo(1) },
    { id: generateDemoId(), organization_id: ORG_ID, actor_id: USER_DEV1_ID, action: "commented", entity_type: "task", entity_id: checkoutTask.id, entity_label: "Implement headless checkout API", metadata: {}, created_at: daysAgo(1) },
  ]

  const calendarEvents: CalendarEvent[] = [
    { id: generateDemoId(), organization_id: ORG_ID, title: "Team Standup", description: "Daily sync — all hands", event_type: "meeting", starts_at: daysFromNow(0, 10), ends_at: daysFromNow(0, 10), all_day: false, project_id: null, related_type: null, related_id: null, created_by: USER_MANAGER_ID, created_at: daysAgo(30) },
    { id: generateDemoId(), organization_id: ORG_ID, title: "TechVentures Sprint Review", description: "Demo checkout flow to Arjun", event_type: "client_meeting", starts_at: daysFromNow(3, 15), ends_at: daysFromNow(3, 16), all_day: false, project_id: PROJECT_1_ID, related_type: "project", related_id: PROJECT_1_ID, created_by: USER_MANAGER_ID, created_at: daysAgo(10) },
    { id: generateDemoId(), organization_id: ORG_ID, title: "GreenLeaf Website Launch", description: null, event_type: "milestone", starts_at: daysFromNow(5), ends_at: null, all_day: true, project_id: PROJECT_4_ID, related_type: "milestone", related_id: milestones[6].id, created_by: USER_MANAGER_ID, created_at: daysAgo(20) },
    { id: generateDemoId(), organization_id: ORG_ID, title: "GST Filing Deadline", description: "GSTR-1 for June 2026", event_type: "deadline", starts_at: daysFromNow(6), ends_at: null, all_day: true, project_id: null, related_type: null, related_id: null, created_by: USER_ACCOUNTANT_ID, created_at: daysAgo(5) },
    { id: generateDemoId(), organization_id: ORG_ID, title: "BFS Discovery Call", description: "Initial scoping for AI chatbot", event_type: "sales", starts_at: daysFromNow(2, 11), ends_at: daysFromNow(2, 12), all_day: false, project_id: PROJECT_7_ID, related_type: "project", related_id: PROJECT_7_ID, created_by: USER_ADMIN_ID, created_at: daysAgo(3) },
    { id: generateDemoId(), organization_id: ORG_ID, title: "Design Critique", description: "Mumbai Metals logo review", event_type: "internal", starts_at: daysFromNow(1, 14), ends_at: daysFromNow(1, 15), all_day: false, project_id: PROJECT_3_ID, related_type: "project", related_id: PROJECT_3_ID, created_by: USER_DESIGNER_ID, created_at: daysAgo(2) },
  ]

  return {
    organization,
    profiles,
    clients,
    clientContacts,
    projectCategories,
    tags,
    projects,
    projectMembers,
    projectTags,
    tasks,
    taskAssignees,
    taskChecklists,
    timeLogs,
    milestones,
    invoices,
    payments,
    paymentProofs,
    paymentDisputes,
    paymentDisputeMessages,
    comments,
    internalNotes,
    folders,
    documents,
    notifications,
    activityLogs,
    calendarEvents,
  }
}

// ─── Singleton store ───────────────────────────────────────────────────────

let _store: DemoStore | null = null

export function getDemoStore(): DemoStore {
  if (!_store) {
    _store = buildInitialStore()
  }
  return _store
}

export function resetDemoStore(): void {
  _store = buildInitialStore()
}

// ─── Enrichment helpers ────────────────────────────────────────────────────

export function getDemoProfile(id: string): Profile | undefined {
  return getDemoStore().profiles.find((p) => p.id === id)
}

export function enrichTask(task: Task): Task {
  const store = getDemoStore()
  const assigneeIds = store.taskAssignees
    .filter((a) => a.task_id === task.id)
    .map((a) => a.user_id)
  const assignees = assigneeIds
    .map((uid) => getDemoProfile(uid))
    .filter(Boolean) as Profile[]
  const checklist = store.taskChecklists.filter((c) => c.task_id === task.id)
  const project = store.projects.find((p) => p.id === task.project_id)
  return { ...task, assignees, checklist, project }
}

export function enrichProject(project: Project): Project {
  const store = getDemoStore()
  const client = store.clients.find((c) => c.id === project.client_id) ?? null
  const category =
    store.projectCategories.find((c) => c.id === project.category_id) ?? null
  const members = store.projectMembers
    .filter((m) => m.project_id === project.id)
    .map((m) => ({ ...m, user: getDemoProfile(m.user_id) }))
  return { ...project, client, category, members }
}

export function enrichInvoice(invoice: Invoice): Invoice {
  const store = getDemoStore()
  const client = store.clients.find((c) => c.id === invoice.client_id)
  const project = invoice.project_id
    ? store.projects.find((p) => p.id === invoice.project_id) ?? null
    : null
  return { ...invoice, client, project }
}

export function enrichPayment(payment: Payment): Payment {
  const store = getDemoStore()
  const invoice = payment.invoice_id
    ? store.invoices.find((i) => i.id === payment.invoice_id)
    : undefined
  const client = store.clients.find((c) => c.id === payment.client_id)
  const project = store.projects.find((p) => p.id === payment.project_id) ?? null
  const proofs = store.paymentProofs.filter((p) => p.payment_id === payment.id)
  return {
    ...payment,
    client_accepted_at: payment.client_accepted_at ?? null,
    client_accepted_by: payment.client_accepted_by ?? null,
    staff_accepted_at: payment.staff_accepted_at ?? null,
    staff_accepted_by: payment.staff_accepted_by ?? null,
    invoice: invoice ? enrichInvoice(invoice) : null,
    client,
    project,
    proofs,
  }
}

export function enrichDispute(dispute: PaymentDispute): PaymentDispute {
  const store = getDemoStore()
  const messages = store.paymentDisputeMessages
    .filter((m) => m.dispute_id === dispute.id)
    .map((m) => ({ ...m, author: getDemoProfile(m.author_id) }))
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
  return { ...dispute, messages }
}

export function enrichComment(comment: Comment): Comment {
  return { ...comment, author: getDemoProfile(comment.author_id) }
}

export function enrichActivityLog(log: ActivityLog): ActivityLog {
  return {
    ...log,
    actor: log.actor_id ? getDemoProfile(log.actor_id) ?? null : null,
  }
}

export function enrichTimeLog(log: TimeLog): TimeLog {
  const store = getDemoStore()
  return {
    ...log,
    project: store.projects.find((p) => p.id === log.project_id),
    task: log.task_id ? store.tasks.find((t) => t.id === log.task_id) : undefined,
    user: getDemoProfile(log.user_id),
  }
}

export function addDemoActivityLog(
  entry: Omit<ActivityLog, "id" | "created_at"> & { created_at?: string }
): ActivityLog {
  const log: ActivityLog = {
    id: generateDemoId(),
    created_at: entry.created_at ?? touch(),
    ...entry,
  }
  getDemoStore().activityLogs.unshift(log)
  return enrichActivityLog(log)
}

export function nextInvoiceNumber(): string {
  const store = getDemoStore()
  const nums = store.invoices
    .map((i) => parseInt(i.invoice_number.replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n))
  const next = (nums.length ? Math.max(...nums) : 170) + 1
  return `NLS-INV-2026-${String(next).padStart(4, "0")}`
}

export function nextProjectCode(): string {
  const store = getDemoStore()
  const nums = store.projects
    .map((p) => parseInt(p.project_code.replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n))
  const next = (nums.length ? Math.max(...nums) : 8) + 1
  return `NLS-2026-${String(next).padStart(3, "0")}`
}

export { touch } from "./demo-utils"
