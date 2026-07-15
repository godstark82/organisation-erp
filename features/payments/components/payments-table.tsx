"use client"

import { PencilSquareIcon } from "@heroicons/react/20/solid"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { twMerge } from "tailwind-merge"
import { EmptyState } from "@/components/shared/empty-state"
import { FilterBar } from "@/components/shared/filter-bar"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ModalBody, ModalContent, ModalHeader, ModalTitle } from "@/components/ui/modal"
import { NativeSelect, NativeSelectContent } from "@/components/ui/native-select"
import {
  Pagination,
  PaginationInfo,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PaymentForm } from "@/features/payments/components/payment-form"
import { usePaymentsPageQuery } from "@/features/payments/hooks"
import { useDebounce } from "@/hooks/use-debounce"
import { PAYMENT_STATUSES, PAYMENTS_PAGE_SIZE } from "@/lib/constants"
import { summarizePayments } from "@/features/payments/lib/summary"
import { displayPaymentStatus, isAwaitingAcceptance } from "@/features/payments/lib/acceptance"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Client, Payment, Project } from "@/types"
import type { ProjectPaymentTotal } from "@/features/payments/lib/project-totals"

function toDateKey(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return "unknown"
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function paymentDateKey(payment: Payment): string {
  return toDateKey(payment.paid_at ?? payment.created_at)
}

function todayKey() {
  return toDateKey(new Date())
}

function daysAgoKey(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return toDateKey(d)
}

function startOfMonthKey() {
  const d = new Date()
  return toDateKey(new Date(d.getFullYear(), d.getMonth(), 1))
}

function formatGroupHeading(dateKey: string) {
  if (dateKey === "unknown") return "Unknown date"
  const today = todayKey()
  const yesterday = daysAgoKey(1)
  if (dateKey === today) return `Today · ${formatDate(dateKey)}`
  if (dateKey === yesterday) return `Yesterday · ${formatDate(dateKey)}`
  return formatDate(dateKey, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

const PAGE_SIZE = PAYMENTS_PAGE_SIZE

function parsePage(value: string | null) {
  const n = Number(value)
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1
}

interface PaymentsTableProps {
  initialPayments: Payment[]
  initialTotal?: number
  initialPage?: number
  initialProjects: Project[]
  initialClients: Client[]
  initialProjectPaymentTotals?: Record<string, ProjectPaymentTotal>
  canManage?: boolean
  canCreate?: boolean
  canEdit?: boolean
  isClient?: boolean
  lockedClientId?: string | null
  defaultProjectId?: string
  embedded?: boolean
}

export function PaymentsTable({
  initialPayments,
  initialTotal = initialPayments.length,
  initialPage = 1,
  initialProjects,
  initialClients,
  initialProjectPaymentTotals = {},
  canManage = false,
  canCreate = canManage,
  canEdit = canManage,
  isClient = false,
  lockedClientId = null,
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
  const [dateFrom, setDateFrom] = useState(searchParams.get("from") ?? "")
  const [dateTo, setDateTo] = useState(searchParams.get("to") ?? "")
  const [page, setPage] = useState(() => parsePage(searchParams.get("page")) || initialPage)
  const [createOpen, setCreateOpen] = useState(false)
  const [editPayment, setEditPayment] = useState<Payment | null>(null)
  const debouncedSearch = useDebounce(search, 300)

  const listProjectId = defaultProjectId || projectFilter || undefined
  const listFilters = useMemo(
    () => ({
      projectId: listProjectId,
      page,
      status: status || undefined,
      search: debouncedSearch.trim() || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [listProjectId, page, status, debouncedSearch, dateFrom, dateTo]
  )

  const isDefaultList =
    page === 1 &&
    !debouncedSearch.trim() &&
    !status &&
    (!projectFilter || projectFilter === defaultProjectId) &&
    !dateFrom &&
    !dateTo

  const { data } = usePaymentsPageQuery(
    listFilters,
    isDefaultList
      ? {
          payments: initialPayments,
          total: initialTotal,
          page: initialPage,
          pageSize: PAGE_SIZE,
          projects: initialProjects,
          clients: initialClients,
          projectPaymentTotals: initialProjectPaymentTotals,
          canManage,
          canCreate,
          canEdit,
          isClient,
          lockedClientId,
        }
      : undefined
  )

  const payments = data?.payments ?? initialPayments
  const total = data?.total ?? initialTotal
  const projects = data?.projects ?? initialProjects
  const clients = data?.clients ?? initialClients
  const projectPaymentTotals =
    data?.projectPaymentTotals ?? initialProjectPaymentTotals
  const allowCreate = data?.canCreate ?? canCreate
  const allowEdit = data?.canEdit ?? canEdit
  const portalClient = data?.isClient ?? isClient
  const portalClientId = data?.lockedClientId ?? lockedClientId

  const updateParams = useCallback(
    (
      nextSearch: string,
      nextStatus: string,
      nextProject: string,
      nextFrom: string,
      nextTo: string,
      nextPage: number
    ) => {
      if (embedded) return
      const params = new URLSearchParams()
      if (nextSearch.trim()) params.set("search", nextSearch.trim())
      if (nextStatus) params.set("status", nextStatus)
      if (nextProject) params.set("project", nextProject)
      if (nextFrom) params.set("from", nextFrom)
      if (nextTo) params.set("to", nextTo)
      if (nextPage > 1) params.set("page", String(nextPage))
      const query = params.toString()
      router.replace(query ? `/payments?${query}` : "/payments")
    },
    [router, embedded]
  )

  const filtersKey = `${debouncedSearch}|${status}|${projectFilter}|${dateFrom}|${dateTo}`
  const prevFiltersKeyRef = useRef(filtersKey)

  useEffect(() => {
    let nextPage = page
    if (prevFiltersKeyRef.current !== filtersKey) {
      prevFiltersKeyRef.current = filtersKey
      nextPage = 1
      if (page !== 1) setPage(1)
    }
    updateParams(
      debouncedSearch,
      status,
      projectFilter,
      dateFrom,
      dateTo,
      nextPage
    )
  }, [
    debouncedSearch,
    status,
    projectFilter,
    dateFrom,
    dateTo,
    page,
    filtersKey,
    updateParams,
  ])

  const applyPreset = (preset: string) => {
    if (preset === "today") {
      const key = todayKey()
      setDateFrom(key)
      setDateTo(key)
      return
    }
    if (preset === "7d") {
      setDateFrom(daysAgoKey(6))
      setDateTo(todayKey())
      return
    }
    if (preset === "month") {
      setDateFrom(startOfMonthKey())
      setDateTo(todayKey())
      return
    }
    setDateFrom("")
    setDateTo("")
  }

  const activePreset = useMemo(() => {
    const today = todayKey()
    if (dateFrom === today && dateTo === today) return "today"
    if (dateFrom === daysAgoKey(6) && dateTo === today) return "7d"
    if (dateFrom === startOfMonthKey() && dateTo === today) return "month"
    if (!dateFrom && !dateTo) return ""
    return "custom"
  }, [dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE
  const pageEnd = Math.min(pageStart + payments.length, total)

  useEffect(() => {
    if (page !== currentPage) setPage(currentPage)
  }, [page, currentPage])

  const grouped = useMemo(() => {
    const map = new Map<string, Payment[]>()
    for (const payment of payments) {
      const key = paymentDateKey(payment)
      const list = map.get(key) ?? []
      list.push(payment)
      map.set(key, list)
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateKey, items]) => ({
        dateKey,
        label: formatGroupHeading(dateKey),
        items,
        total: items.reduce((sum, p) => sum + p.amount, 0),
        currency: items[0]?.currency ?? "INR",
        count: items.length,
      }))
  }, [payments])

  const summary = useMemo(() => summarizePayments(payments), [payments])
  const hasActiveFilters = Boolean(
    search.trim() ||
      status ||
      (projectFilter && projectFilter !== defaultProjectId) ||
      dateFrom ||
      dateTo
  )
  const showPagination = total > PAGE_SIZE
  const pageScopeLabel = showPagination ? " on this page" : ""

  const body = (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Received"
          value={formatCurrency(summary.verifiedAmount)}
          delta={{
            value: 0,
            label: `${summary.verifiedCount} verified${pageScopeLabel}`,
          }}
        />
        <StatCard
          label="Pending"
          value={formatCurrency(summary.pendingAmount)}
          delta={{
            value: 0,
            label: `${summary.pendingCount} awaiting${pageScopeLabel}`,
          }}
        />
        <StatCard
          label="Disputed"
          value={formatCurrency(summary.disputedAmount)}
          delta={{
            value: 0,
            label: `${summary.disputedCount} open${pageScopeLabel}`,
          }}
        />
        <StatCard
          label="Records"
          value={total}
          delta={{
            value: 0,
            label:
              payments.length < total
                ? `Page ${currentPage} of ${totalPages} · up to ${PAGE_SIZE} shown`
                : summary.lastPaidAt
                  ? `Last paid ${formatDate(summary.lastPaidAt)}`
                  : "No verified payments yet",
          }}
        />
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search UTR, transaction, or notes…"
        hasActiveFilters={hasActiveFilters}
        collapsibleFilters
        onClear={() => {
          setSearch("")
          setStatus("")
          setProjectFilter(defaultProjectId ?? "")
          setDateFrom("")
          setDateTo("")
        }}
        filters={
          <>
            <NativeSelect className="w-full sm:w-40">
              <NativeSelectContent
                value={activePreset === "custom" ? "custom" : activePreset}
                onChange={(e) => applyPreset(e.target.value)}
                aria-label="Date range preset"
              >
                <option value="">All dates</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 days</option>
                <option value="month">This month</option>
                {activePreset === "custom" && (
                  <option value="custom">Custom range</option>
                )}
              </NativeSelectContent>
            </NativeSelect>

            <div className="flex w-full flex-col gap-1 sm:w-40">
              <Label className="text-muted-fg text-xs">From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="From date"
              />
            </div>

            <div className="flex w-full flex-col gap-1 sm:w-40">
              <Label className="text-muted-fg text-xs">To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                aria-label="To date"
              />
            </div>

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

      {payments.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? "No payments match your filters" : "No payments yet"}
          description={
            hasActiveFilters
              ? "Try adjusting your search, dates, or filters."
              : "Record a payment against a project to start tracking."
          }
          action={
            allowCreate
              ? {
                  label: "Record payment",
                  intent: "primary",
                  onPress: () => setCreateOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-5">
          {grouped.map((group) => (
            <section key={group.dateKey} className="space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2 px-0.5">
                <h3 className="font-medium text-fg text-sm">{group.label}</h3>
                <p className="text-muted-fg text-xs tabular-nums">
                  {group.count} payment{group.count === 1 ? "" : "s"} ·{" "}
                  {formatCurrency(group.total, group.currency)}
                </p>
              </div>
              <Card className="py-0 shadow-sm [--gutter:--spacing(0)]">
                <Table aria-label={`Payments on ${group.label}`} bleed>
                  <TableHeader>
                    <TableColumn isRowHeader>Project</TableColumn>
                    <TableColumn className="hidden md:table-cell">Client</TableColumn>
                    <TableColumn>Amount</TableColumn>
                    <TableColumn className="hidden sm:table-cell">Paid on</TableColumn>
                    <TableColumn>Status</TableColumn>
                    {allowEdit ? <TableColumn> </TableColumn> : null}
                  </TableHeader>
                  <TableBody items={group.items}>
                    {(payment) => (
                      <TableRow
                        id={payment.id}
                        className={twMerge(
                          isAwaitingAcceptance(payment) && "bg-warning-subtle/20"
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
                            status={displayPaymentStatus(payment).status}
                            label={displayPaymentStatus(payment).label}
                          />
                        </TableCell>
                        {allowEdit ? (
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
            </section>
          ))}

          {showPagination ? (
            <Pagination className="justify-between border-t border-border pt-4">
              <PaginationInfo>
                Showing{" "}
                <strong>
                  {pageStart + 1}–{pageEnd}
                </strong>{" "}
                of <strong>{total}</strong> payments
                {" · "}
                up to {PAGE_SIZE} per page
              </PaginationInfo>
              <PaginationList>
                <PaginationPrevious
                  isDisabled={currentPage <= 1}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                />
                <PaginationNext
                  isDisabled={currentPage >= totalPages}
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                />
              </PaginationList>
            </Pagination>
          ) : payments.length > 0 ? (
            <PaginationInfo className="text-center">
              {total} payment{total === 1 ? "" : "s"}
            </PaginationInfo>
          ) : null}
        </div>
      )}

      <ModalContent isOpen={createOpen} onOpenChange={setCreateOpen}>
        <ModalHeader>
          <ModalTitle>Record payment</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <PaymentForm
            projects={projects}
            clients={clients}
            projectPaymentTotals={projectPaymentTotals}
            mode="create"
            defaultProjectId={defaultProjectId}
            lockClientId={portalClientId}
            clientMode={portalClient}
            onSuccess={() => setCreateOpen(false)}
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
              projectPaymentTotals={projectPaymentTotals}
              mode="edit"
              payment={editPayment}
              onSuccess={() => setEditPayment(null)}
            />
          )}
        </ModalBody>
      </ModalContent>
    </>
  )

  if (embedded) {
    return (
      <div className="space-y-6">
        {allowCreate && (
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
          allowCreate ? (
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
