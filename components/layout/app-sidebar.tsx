"use client"

import type { LucideIcon } from "lucide-react"
import {
  Calendar,
  ChartColumn,
  CreditCard,
  LayoutDashboard,
  Settings,
  SquareKanban,
  UserRound,
  Users,
} from "lucide-react"
import { usePathname } from "next/navigation"
import type { AppRole } from "@/types"
import type { SessionUser } from "@/types"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarLabel,
  SidebarRail,
  SidebarSection,
  SidebarSectionGroup,
  useSidebar,
} from "@/components/ui/sidebar"
import { BrandMark, BrandWordmark } from "./brand-mark"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  hiddenFor?: AppRole[]
}

export interface NavSection {
  label: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/calendar", label: "Calendar", icon: Calendar },
    ],
  },
  {
    label: "Work",
    items: [{ href: "/projects", label: "Projects", icon: SquareKanban }],
  },
  {
    label: "CRM",
    items: [
      {
        href: "/clients",
        label: "Clients",
        icon: Users,
        hiddenFor: ["client", "developer", "designer"],
      },
      {
        href: "/developers",
        label: "Developers",
        icon: UserRound,
        hiddenFor: ["client", "developer", "designer"],
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        href: "/payments",
        label: "Payments",
        icon: CreditCard,
        hiddenFor: ["developer", "designer"],
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        href: "/reports",
        label: "Reports",
        icon: ChartColumn,
        hiddenFor: ["client", "developer", "designer"],
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        href: "/settings",
        label: "Settings",
        icon: Settings,
        hiddenFor: ["client", "developer", "designer"],
      },
    ],
  },
]

function filterSections(role: AppRole): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => !item.hiddenFor?.includes(role)
    ),
  })).filter((section) => section.items.length > 0)
}

function getClientPortalSections(): NavSection[] {
  return [
    {
      label: "Portal",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/projects", label: "Projects", icon: SquareKanban },
        { href: "/payments", label: "Payments", icon: CreditCard },
        { href: "/calendar", label: "Calendar", icon: Calendar },
      ],
    },
  ]
}

interface AppSidebarProps {
  user: SessionUser
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname()
  const { state, isMobile } = useSidebar()
  const collapsed = state === "collapsed" && !isMobile
  const role = user.profile.role
  const sections =
    role === "client" ? getClientPortalSections() : filterSections(role)

  return (
    <Sidebar collapsible="dock" intent="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2.5">
          <BrandMark />
          {!collapsed && <BrandWordmark className="text-base" />}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarSectionGroup>
          {sections.map((section) => (
            <SidebarSection key={section.label} label={section.label}>
              {section.items.map((item) => {
                const Icon = item.icon
                const isCurrent =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(`${item.href}/`))

                return (
                  <SidebarItem
                    key={item.href}
                    href={item.href}
                    isCurrent={isCurrent}
                    tooltip={item.label}
                  >
                    <Icon />
                    <SidebarLabel>{item.label}</SidebarLabel>
                  </SidebarItem>
                )
              })}
            </SidebarSection>
          ))}
        </SidebarSectionGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex w-full min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-sm">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 font-medium text-primary text-xs">
            {user.profile.full_name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-sidebar-fg">
                {user.profile.full_name}
              </p>
              <p className="truncate text-muted-fg text-xs">
                {user.organization?.name ?? user.email}
              </p>
            </div>
          )}
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

export { NAV_SECTIONS }
