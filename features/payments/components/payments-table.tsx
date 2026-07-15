"use client"

import { PencilSquareIcon } from "@heroicons/react/20/solid"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { twMerge } from "tailwind-merge"
import { EmptyState } from "@/components/shared/empty-state"
import { FilterBar } from "@/components/shared/filter-bar"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
import { PaymentForm } from "@/features/payments/components/payment-form"
import { useDebounce } from "@/hooks/use-debounce"
import { PAYMENT_STATUSES } from "@/lib/constants"
import { summarizePayments } from "@/features/payments/lib/summary"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Client, Payment, PaymentStatus, Project } from "@/types"

interface PaymentsTableProps {
  payments: Payment[]
  projects: Project[]
  clients: Client[]
  canManage?: boolean
  defaultProjectId?: string
  embedded?: boolean
}

export function PaymentsTable({
  payments,
  projects,
  clients,
  canManage = false,
  defaultProjectId,
  embedded = false,
}: PaymentsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [status, setStatus] = useState(searchParams.get("status") ?? "")
  const [projectFilter, setProjectFilter] = useState(
    searchParams.get("project") ?? defaultProjectId ?? ""
  )
  const [createOpen, setCreateOpen] = useState(false)
  const [editPayment, setEditPayment] = useState<Payment | null>(null)
  const debouncedSearch = useDebounce(search, 300)

  const updateParams = useCallback(
    (nextSearch: string, nextStatus: string, nextProject: string) => {
      if (embedded) return
      const params = new URLSearchParams()
      if (nextSearch.trim()) params.set("search", nextSearch.trim())
      if (nextStatus) params.set("status", nextStatus)
      if (nextProject) params.set("project", nextProject)
      const query = params.toString()
      router.replace(query ? `/payments?${query}` : "/payments")
    },
    [router, embedded]
  )

  useEffect(() => {
    updateParams(debouncedSearch, status, projectFilter)
  }, [debouncedSearch, status, projectFilter, updateParams])

  const filtered = useMemo(() => {
    let result = [...payments]
    const q = debouncedSearch.trim().toLowerCase()

    if (q) {
      result = result.filter(
        (p) =>
          (p.utr?.toLowerCase().includes(q) ?? false) ||
          (p.transaction_id?.toLowerCase().includes(q) ?? false) ||
          (p.project?.name?.toLowerCase().includes(q) ?? false) ||
          (p.client?.company_name?.toLowerCase().includes(q) ?? false)
      )
    }

    if (status) result = result.filter((p) => p.status === status)
    if (projectFilter) result = result.filter((p) => p.project_id === projectFilter)

    return result
  }, [payments, debouncedSearch, status, projectFilter])

  const summary = useMemo(() => summarizePayments(filtered), [filtered])
  const hasActiveFilters = Boolean(search.trim() || status || projectFilter)

  const body = (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Received"
          value={formatCurrency(summary.verifiedAmount)}
          delta={{ value: 0, label: `${summary.verifiedCount} verified` }}
        />
        <StatCard
          label="Pending"
          value={formatCurrency(summary.pendingAmount)}
          delta={{ value: 0, label: `${summary.pendingCount} awaiting` }}
        />
        <StatCard
          label="Disputed"
          value={formatCurrency(summary.disputedAmount)}
          delta={{ value: 0, label: `${summary.disputedCount} open` }}
        />
        <StatCard
          label="Records"
          value={summary.totalCount}
          delta={{
            value: 0,
            label: summary.lastPaidAt
              ? `Last paid ${formatDate(summary.lastPaidAt)}`
              : "No verified payments yet",
          }}
        />
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search project, client, UTR…"
        hasActiveFilters={hasActiveFilters}
        collapsibleFilters
        onClear={() => {
          setSearch("")
          setStatus("")
          setProjectFilter(defaultProjectId ?? "")
        }}
        filters={
          <>
            <NativeSelect className="w-full sm:w-44">
              <NativeSelectContent
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                {PAYMENT_STATUSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </NativeSelectContent>
            </NativeSelect>
            {!defaultProjectId && (
              <NativeSelect className="w-full sm:w-52">
                <NativeSelectContent
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                >
                  <option value="">All projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </NativeSelectContent>
              </NativeSelect>
            )}
          </>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? "No payments match your filters" : "No payments yet"}
          description={
            hasActiveFilters
              ? "Try adjusting your search or filters."
              : "Record a payment against a project to start tracking."
          }
          action={
            canManage
              ? {
                  label: "Record payment",
                  intent: "primary",
                  onPress: () => setCreateOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <Card className="py-0 shadow-sm [--gutter:--spacing(0)]">
          <Table aria-label="Payments" bleed>
            <TableHeader>
              <TableColumn isRowHeader>Project</TableColumn>
              <TableColumn className="hidden md:table-cell">Client</TableColumn>
              <TableColumn>Amount</TableColumn>
              <TableColumn className="hidden sm:table-cell">Paid on</TableColumn>
              <TableColumn>Status</TableColumn>
              {canManage ? <TableColumn> </TableColumn> : null}
            </TableHeader>
            <TableBody items={filtered}>
              {(payment) => (
                <TableRow
                  id={payment.id}
                  className={twMerge(
                    (payment.status === "under_review" ||
                      payment.status === "client_marked_paid") &&
                      "bg-warning-subtle/20"
                  )}
                >
                  <TableCell>
                    <Link
                      href={`/payments/${payment.id}`}
                      className="font-medium text-fg hover:text-primary hover:underline"
                    >
                      {payment.project?.name ?? "Payment"}
                    </Link>
                    <p className="text-muted-fg text-xs md:hidden">
                      {payment.client?.company_name ?? "—"}
                    </p>
                  </TableCell>
                  <TableCell className="hidden text-muted-fg md:table-cell">
                    {payment.client?.company_name ?? "—"}
                  </TableCell>
                  <TableCell className="font-medium tabular-nums">
                    {formatCurrency(payment.amount, payment.currency)}
                  </TableCell>
                  <TableCell className="hidden text-muted-fg tabular-nums text-xs sm:table-cell">
                    {formatDate(payment.paid_at ?? payment.created_at)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      type="payment"
                      status={payment.status as PaymentStatus}
                    />
                  </TableCell>
                  {canManage ? (
                    <TableCell>
                      <Button
                        intent="plain"
                        size="sq-sm"
                        aria-label="Edit payment"
                        onPress={() => setEditPayment(payment)}
                      >
                        <PencilSquareIcon />
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <ModalContent isOpen={createOpen} onOpenChange={setCreateOpen}>
        <ModalHeader>
          <ModalTitle>Record payment</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <PaymentForm
            projects={projects}
            clients={clients}
            mode="create"
            defaultProjectId={defaultProjectId}
            onSuccess={() => {
              setCreateOpen(false)
              router.refresh()
            }}
          />
        </ModalBody>
      </ModalContent>

      <ModalContent
        isOpen={!!editPayment}
        onOpenChange={(open) => {
          if (!open) setEditPayment(null)
        }}
      >
        <ModalHeader>
          <ModalTitle>Edit payment</ModalTitle>
        </ModalHeader>
        <ModalBody>
          {editPayment && (
            <PaymentForm
              key={editPayment.id}
              projects={projects}
              clients={clients}
              mode="edit"
              payment={editPayment}
              onSuccess={() => {
                setEditPayment(null)
                router.refresh()
              }}
            />
          )}
        </ModalBody>
      </ModalContent>
    </>
  )

  if (embedded) {
    return (
      <div className="space-y-6">
        {canManage && (
          <div className="flex justify-end">
            <Button intent="primary" onPress={() => setCreateOpen(true)}>
              Record payment
            </Button>
          </div>
        )}
        {body}
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Payments"
        description="Track money received by project — pending, verified, and disputed."
        actions={
          canManage ? (
            <Button intent="primary" onPress={() => setCreateOpen(true)}>
              Record payment
            </Button>
          ) : undefined
        }
      />
      {body}
    </div>
  )
}
