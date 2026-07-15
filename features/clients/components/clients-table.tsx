"use client"

import {
  EllipsisHorizontalIcon,
  KeyIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/20/solid"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { FilterBar } from "@/components/shared/filter-bar"
import { StatusBadge } from "@/components/shared/status-badge"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { ClientForm } from "@/features/clients/components/client-form"
import { ClientPortalAccessForm } from "@/features/clients/components/client-portal-access-form"
import {
  useClientsQuery,
  useDeleteClientMutation,
} from "@/features/clients/hooks"
import { useDebounce } from "@/hooks/use-debounce"
import { CLIENT_STATUSES } from "@/lib/constants"
import { formatDate } from "@/lib/utils"
import type { Client, ClientStatus } from "@/types"

interface ClientsTableProps {
  initialClients: Client[]
  canManage: boolean
}

export function ClientsTable({ initialClients, canManage }: ClientsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [status, setStatus] = useState(searchParams.get("status") ?? "")
  const debouncedSearch = useDebounce(search, 300)

  const [editClient, setEditClient] = useState<Client | null>(null)
  const [portalClient, setPortalClient] = useState<Client | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)

  const { data: clients = initialClients, isError, error } = useClientsQuery(
    initialClients
  )
  const deleteMutation = useDeleteClientMutation()

  const updateParams = useCallback(
    (nextSearch: string, nextStatus: string) => {
      const params = new URLSearchParams()
      if (nextSearch.trim()) params.set("search", nextSearch.trim())
      if (nextStatus) params.set("status", nextStatus)
      const query = params.toString()
      router.replace(query ? `/clients?${query}` : "/clients")
    },
    [router]
  )

  useEffect(() => {
    updateParams(debouncedSearch, status)
  }, [debouncedSearch, status, updateParams])

  const filteredClients = useMemo(() => {
    let result = [...clients]
    const q = debouncedSearch.trim().toLowerCase()

    if (q) {
      result = result.filter(
        (client) =>
          client.company_name.toLowerCase().includes(q) ||
          client.client_name.toLowerCase().includes(q) ||
          client.email.toLowerCase().includes(q) ||
          (client.gst?.toLowerCase().includes(q) ?? false)
      )
    }

    if (status) {
      result = result.filter((client) => client.status === status)
    }

    return result.sort((a, b) => a.company_name.localeCompare(b.company_name))
  }, [clients, debouncedSearch, status])

  const hasActiveFilters = Boolean(search.trim() || status)

  const handleClear = () => {
    setSearch("")
    setStatus("")
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  return (
    <>
      {isError && (
        <p className="mb-4 rounded-lg border border-danger/30 bg-danger-subtle px-4 py-3 text-danger-subtle-fg text-sm">
          {error instanceof Error ? error.message : "Unable to load clients."}
        </p>
      )}

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search clients…"
        hasActiveFilters={hasActiveFilters}
        onClear={handleClear}
        actions={
          canManage ? (
            <Button intent="primary" onPress={() => setCreateOpen(true)}>
              New client
            </Button>
          ) : undefined
        }
        filters={
          <NativeSelect className="w-full sm:w-40">
            <NativeSelectContent
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              {CLIENT_STATUSES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </NativeSelectContent>
          </NativeSelect>
        }
      />

      {filteredClients.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? "No clients match your filters" : "No clients yet"}
          description={
            hasActiveFilters
              ? "Try adjusting your search or status filter."
              : "Add your first client to start tracking projects and payments."
          }
          action={
            canManage
              ? {
                  label: "Add client",
                  intent: "primary",
                  onPress: () => setCreateOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <Card className="py-0 shadow-sm [--gutter:--spacing(0)]">
          <Table aria-label="Clients" bleed>
            <TableHeader>
              <TableColumn isRowHeader>Company</TableColumn>
              <TableColumn className="hidden sm:table-cell">Contact</TableColumn>
              <TableColumn className="hidden md:table-cell">Email</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn className="hidden lg:table-cell">Login</TableColumn>
              <TableColumn className="hidden xl:table-cell">Updated</TableColumn>
              {canManage && <TableColumn className="w-12" />}
            </TableHeader>
            <TableBody items={filteredClients}>
              {(client) => (
                <TableRow id={client.id}>
                  <TableCell>
                    <Link
                      href={`/clients/${client.id}`}
                      className="font-medium text-fg hover:text-primary hover:underline"
                    >
                      {client.company_name}
                    </Link>
                    <p className="text-muted-fg text-xs sm:hidden">
                      {client.client_name}
                    </p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{client.client_name}</TableCell>
                  <TableCell className="hidden text-muted-fg md:table-cell">{client.email}</TableCell>
                  <TableCell>
                    <StatusBadge type="client" status={client.status as ClientStatus} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {client.portal_user_id ? (
                      <Badge intent="success">Enabled</Badge>
                    ) : (
                      <Badge intent="secondary">Not set</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-muted-fg tabular-nums xl:table-cell">
                    {formatDate(client.updated_at)}
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <Menu>
                        <MenuTrigger aria-label="Client actions">
                          <EllipsisHorizontalIcon />
                        </MenuTrigger>
                        <MenuContent placement="bottom end">
                          <MenuItem
                            onAction={() => router.push(`/clients/${client.id}`)}
                          >
                            View details
                          </MenuItem>
                          <MenuItem onAction={() => setEditClient(client)}>
                            <PencilSquareIcon />
                            Edit
                          </MenuItem>
                          {!client.portal_user_id && (
                            <MenuItem onAction={() => setPortalClient(client)}>
                              <KeyIcon />
                              Set portal login
                            </MenuItem>
                          )}
                          <MenuSeparator />
                          <MenuItem intent="danger" onAction={() => setDeleteTarget(client)}>
                            <TrashIcon />
                            Delete
                          </MenuItem>
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

      <ModalContent isOpen={createOpen} onOpenChange={setCreateOpen} size="lg">
        <ModalHeader>
          <ModalTitle>New client</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <ClientForm
            submitLabel="Create client"
            stayOnCreate
            onSuccess={() => setCreateOpen(false)}
          />
        </ModalBody>
      </ModalContent>

      {editClient && (
        <ModalContent
          isOpen={Boolean(editClient)}
          onOpenChange={(open) => {
            if (!open) setEditClient(null)
          }}
          size="lg"
        >
          <ModalHeader>
            <ModalTitle>Edit client</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <ClientForm
              client={editClient}
              submitLabel="Update client"
              onSuccess={() => setEditClient(null)}
            />
          </ModalBody>
        </ModalContent>
      )}

      {portalClient && (
        <ModalContent
          isOpen={Boolean(portalClient)}
          onOpenChange={(open) => {
            if (!open) setPortalClient(null)
          }}
        >
          <ModalHeader>
            <ModalTitle>Set portal login — {portalClient.company_name}</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <ClientPortalAccessForm
              key={portalClient.id}
              client={portalClient}
              onSuccess={() => setPortalClient(null)}
            />
          </ModalBody>
        </ModalContent>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
            deleteMutation.reset()
          }
        }}
        title="Delete client"
        description={
          deleteMutation.error?.message ??
          `Are you sure you want to delete ${deleteTarget?.company_name}? This action cannot be undone.`
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
        intent="danger"
      />
    </>
  )
}
