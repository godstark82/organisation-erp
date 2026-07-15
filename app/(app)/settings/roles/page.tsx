import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Note } from "@/components/ui/note"
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ROLE_LABELS, ROLE_PERMISSIONS } from "@/lib/rbac"
import type { AppRole } from "@/types"

const ALL_PERMISSIONS = Array.from(
  new Set(
    Object.values(ROLE_PERMISSIONS).flatMap((perms) =>
      perms.filter((p) => p !== "*")
    )
  )
).sort()

const ROLES = Object.keys(ROLE_PERMISSIONS) as AppRole[]

function roleHasPermission(role: AppRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role]
  return perms.includes("*") || perms.includes(permission)
}

export default function RolesSettingsPage() {
  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader
          title="Roles & Permissions"
          description="Read-only permission matrix from ROLE_PERMISSIONS (demo)."
        />
        <CardContent className="overflow-x-auto py-0">
          <Table aria-label="Role permissions matrix">
            <TableHeader>
              <TableColumn isRowHeader className="sticky left-0 bg-card">
                Permission
              </TableColumn>
              {ROLES.map((role) => (
                <TableColumn key={role} className="min-w-24 text-center">
                  {ROLE_LABELS[role]}
                </TableColumn>
              ))}
            </TableHeader>
            <TableBody>
              {ALL_PERMISSIONS.map((permission) => (
                <TableRow key={permission} id={permission}>
                  <TableCell className="sticky left-0 bg-card font-mono text-xs">
                    {permission}
                  </TableCell>
                  {ROLES.map((role) => (
                    <TableCell key={role} className="text-center">
                      {roleHasPermission(role, permission) ? (
                        <Badge intent="success" className="text-[10px]">
                          ✓
                        </Badge>
                      ) : (
                        <span className="text-muted-fg">—</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Note intent="default" className="text-sm">
        Super Admin has wildcard access (*). Changes to roles require database
        configuration in production.
      </Note>
    </div>
  )
}
