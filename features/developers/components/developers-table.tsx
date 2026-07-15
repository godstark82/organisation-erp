"use client"

import {
  EllipsisHorizontalIcon,
  PencilSquareIcon,
  NoSymbolIcon,
} from "@heroicons/react/20/solid"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { FilterBar } from "@/components/shared/filter-bar"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu"
import { ModalBody, ModalContent, ModalHeader, ModalTitle } from "@/components/ui/modal"
import { NativeSelect, NativeSelectContent } from "@/components/ui/native-select"
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DeveloperForm } from "@/features/developers/components/developer-form"
import {
  useDeactivateDeveloperMutation,
  useDevelopersQuery,
} from "@/features/developers/hooks"
import { STAFF_ROLES } from "@/features/developers/schemas"
import { useDebounce } from "@/hooks/use-debounce"
import { ROLE_LABELS } from "@/lib/rbac"
import type { AppRole, Profile } from "@/types"

interface DevelopersTableProps {
  initialDevelopers: Profile[]
  canManage: boolean
}

export function DevelopersTable({
  initialDevelopers,
  canManage,
}: DevelopersTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [role, setRole] = useState(searchParams.get("role") ?? "")
  const debouncedSearch = useDebounce(search, 300)

  const [createOpen, setCreateOpen] = useState(false)
  const [editDeveloper, setEditDeveloper] = useState<Profile | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<Profile | null>(null)

  const { data: developers = initialDevelopers } =
    useDevelopersQuery(initialDevelopers)
  const deactivateMutation = useDeactivateDeveloperMutation()

  const updateParams = useCallback(
    (nextSearch: string, nextRole: string) => {
      const params = new URLSearchParams()
      if (nextSearch.trim()) params.set("search", nextSearch.trim())
      if (nextRole) params.set("role", nextRole)
      const query = params.toString()
      router.replace(query ? `/developers?${query}` : "/developers")
    },
    [router]
  )

  useEffect(() => {
    updateParams(debouncedSearch, role)
  }, [debouncedSearch, role, updateParams])

  const filtered = useMemo(() => {
    let result = [...developers]
    const q = debouncedSearch.trim().toLowerCase()

    if (q) {
      result = result.filter(
        (dev) =>
          dev.full_name.toLowerCase().includes(q) ||
          dev.email.toLowerCase().includes(q) ||
          (dev.title?.toLowerCase().includes(q) ?? false)
      )
    }

    if (role) {
      result = result.filter((dev) => dev.role === role)
    }

    return result.sort((a, b) => a.full_name.localeCompare(b.full_name))
  }, [developers, debouncedSearch, role])

  const hasActiveFilters = Boolean(search.trim() || role)

  const handleDeactivate = () => {
    if (!deactivateTarget) return
    deactivateMutation.mutate(deactivateTarget.id, {
      onSuccess: () => setDeactivateTarget(null),
    })
  }

  return (
    <>
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search developers…"
        hasActiveFilters={hasActiveFilters}
        onClear={() => {
          setSearch("")
          setRole("")
        }}
        actions={
          canManage ? (
            <Button intent="primary" onPress={() => setCreateOpen(true)}>
              New developer
            </Button>
          ) : undefined
        }
        filters={
          <NativeSelect className="w-full sm:w-44">
            <NativeSelectContent
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="">All roles</option>
              {STAFF_ROLES.map((item) => (
                <option key={item} value={item}>
                  {ROLE_LABELS[item]}
                </option>
              ))}
            </NativeSelectContent>
          </NativeSelect>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          title={
            hasActiveFilters ? "No developers match your filters" : "No developers yet"
          }
          description={
            hasActiveFilters
              ? "Try adjusting your search or role filter."
              : "Add developers so you can assign them to projects."
          }
          action={
            canManage
              ? {
                  label: "Add developer",
                  intent: "primary",
                  onPress: () => setCreateOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <Card className="py-0 shadow-sm [--gutter:--spacing(0)]">
          <Table aria-label="Developers" bleed>
            <TableHeader>
              <TableColumn isRowHeader>Name</TableColumn>
              <TableColumn className="hidden md:table-cell">Email</TableColumn>
              <TableColumn className="hidden lg:table-cell">Title</TableColumn>
              <TableColumn>Role</TableColumn>
              <TableColumn className="hidden sm:table-cell">Status</TableColumn>
              {canManage && <TableColumn className="w-12" />}
            </TableHeader>
            <TableBody items={filtered}>
              {(developer) => (
                <TableRow id={developer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar profile={developer} size="sm" />
                      <span className="min-w-0">
                        <span className="block font-medium text-fg">
                          {developer.full_name}
                        </span>
                        <span className="block truncate text-muted-fg text-xs md:hidden">
                          {developer.email}
                        </span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-fg md:table-cell">
                    {developer.email}
                  </TableCell>
                  <TableCell className="hidden text-muted-fg lg:table-cell">
                    {developer.title ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge intent="secondary">
                      {ROLE_LABELS[developer.role as AppRole] ?? developer.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge intent={developer.is_active ? "success" : "secondary"}>
                      {developer.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <Menu>
                        <MenuTrigger aria-label="Developer actions">
                          <EllipsisHorizontalIcon />
                        </MenuTrigger>
                        <MenuContent placement="bottom end">
                          <MenuItem onAction={() => setEditDeveloper(developer)}>
                            <PencilSquareIcon />
                            Edit
                          </MenuItem>
                          {developer.is_active && (
                            <>
                              <MenuSeparator />
                              <MenuItem
                                intent="danger"
                                onAction={() => setDeactivateTarget(developer)}
                              >
                                <NoSymbolIcon />
                                Deactivate
                              </MenuItem>
                            </>
                          )}
                        </MenuContent>
                      </Menu>
                    </TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <ModalContent isOpen={createOpen} onOpenChange={setCreateOpen}>
        <ModalHeader>
          <ModalTitle>New developer</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <DeveloperForm
            mode="create"
            onSuccess={() => setCreateOpen(false)}
          />
        </ModalBody>
      </ModalContent>

      <ModalContent
        isOpen={!!editDeveloper}
        onOpenChange={(open) => {
          if (!open) setEditDeveloper(null)
        }}
      >
        <ModalHeader>
          <ModalTitle>Edit developer</ModalTitle>
        </ModalHeader>
        <ModalBody>
          {editDeveloper && (
            <DeveloperForm
              key={editDeveloper.id}
              developer={editDeveloper}
              mode="edit"
              onSuccess={() => setEditDeveloper(null)}
            />
          )}
        </ModalBody>
      </ModalContent>

      <ConfirmDialog
        isOpen={!!deactivateTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeactivateTarget(null)
            deactivateMutation.reset()
          }
        }}
        title="Deactivate developer?"
        description={
          deactivateMutation.error?.message ??
          (deactivateTarget
            ? `${deactivateTarget.full_name} will no longer appear when assigning projects.`
            : undefined)
        }
        confirmLabel="Deactivate"
        intent="danger"
        isPending={deactivateMutation.isPending}
        onConfirm={handleDeactivate}
      />
    </>
  )
}
