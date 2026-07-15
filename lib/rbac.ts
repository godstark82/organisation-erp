import type { AppRole } from "@/types"

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  manager: "Manager",
  developer: "Developer",
  designer: "Designer",
  accountant: "Accountant",
  client: "Client",
}

/** Default permission keys granted per role */
export const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  super_admin: ["*"],
  manager: [
    "dashboard.view",
    "clients.view",
    "clients.create",
    "clients.update",
    "projects.view",
    "projects.create",
    "projects.update",
    "payments.view",
    "payments.create",
    "payments.verify",
    "payments.dispute",
    "reports.view",
    "settings.view",
    "users.manage",
    "notes.internal",
    "calendar.view",
  ],
  developer: [
    "dashboard.view",
    "projects.view",
    "payments.view",
    "payments.create",
    "payments.verify",
    "calendar.view",
  ],
  designer: [
    "dashboard.view",
    "projects.view",
    "calendar.view",
  ],
  accountant: [
    "dashboard.view",
    "clients.view",
    "projects.view",
    "payments.view",
    "payments.create",
    "payments.verify",
    "payments.dispute",
    "reports.view",
    "calendar.view",
  ],
  client: [
    "dashboard.view",
    "projects.view",
    "projects.create",
    "projects.update",
    "payments.view",
    "payments.create",
    "calendar.view",
  ],
}

export function hasPermission(
  permissions: string[],
  required: string | string[]
): boolean {
  if (permissions.includes("*")) return true
  const list = Array.isArray(required) ? required : [required]
  return list.every((p) => permissions.includes(p))
}

export function canAccessRoute(role: AppRole, path: string): boolean {
  if (role === "super_admin" || role === "manager") return true

  const clientAllowed = ["/projects", "/payments", "/calendar"]

  if (role === "client") {
    return (
      path === "/dashboard" ||
      clientAllowed.some((p) => path === p || path.startsWith(`${p}/`))
    )
  }

  if (role === "developer") {
    const denied = ["/clients", "/developers", "/reports", "/settings"]
    return !denied.some((p) => path === p || path.startsWith(`${p}/`))
  }

  if (role === "designer") {
    const denied = ["/clients", "/developers", "/payments", "/reports", "/settings"]
    return !denied.some((p) => path === p || path.startsWith(`${p}/`))
  }

  return true
}

export function isAdminRole(role: AppRole) {
  return role === "super_admin" || role === "manager"
}

export function isStaffRole(role: AppRole) {
  return role !== "client"
}

/** Org-level verify roles (also used with project membership for dual accept). */
export function canVerifyPayments(role: AppRole) {
  return role === "super_admin" || role === "manager" || role === "accountant"
}

/** Staff-side acceptance: super admin, manager, accountant, or assigned later via project membership. */
export function canAcceptPaymentsAsStaffRole(role: AppRole) {
  return (
    role === "super_admin" ||
    role === "manager" ||
    role === "accountant" ||
    role === "developer"
  )
}

export function canSeeInternalNotes(role: AppRole) {
  return role === "super_admin" || role === "manager"
}
