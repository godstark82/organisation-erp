"use client"

import { PencilSquareIcon, TrashIcon } from "@heroicons/react/20/solid"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ActivityFeed } from "@/components/shared/activity-feed"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ModalBody, ModalContent, ModalHeader, ModalTitle } from "@/components/ui/modal"
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@/components/ui/tabs"
import { ClientForm } from "@/features/clients/components/client-form"
import {
  useClientQuery,
  useDeleteClientMutation,
} from "@/features/clients/hooks"
import { formatCurrency, formatDate } from "@/lib/utils"
import type {
  ActivityLog,
  Client,
  InternalNote,
  Payment,
  Project,
} from "@/types"

interface ClientDetailViewProps {
  client: Client
  projects: Project[]
  payments: Payment[]
  activities: ActivityLog[]
  internalNotes: InternalNote[]
  canManage: boolean
  canSeeNotes: boolean
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="font-medium text-muted-fg text-xs uppercase tracking-wide">{label}</dt>
      <dd className="text-sm">{value || "—"}</dd>
    </div>
  )
}

export function ClientDetailView({
  client: initialClient,
  projects,
  payments,
  activities,
  internalNotes,
  canManage,
  canSeeNotes,
}: ClientDetailViewProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: client = initialClient } = useClientQuery(
    initialClient.id,
    initialClient
  )
  const deleteMutation = useDeleteClientMutation()

  const handleDelete = () => {
    deleteMutation.mutate(client.id, {
      onSuccess: () => router.push("/clients"),
    })
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge type="client" status={client.status} />
        {canManage && (
          <>
            <Button intent="outline" size="sm" onPress={() => setEditOpen(true)}>
              <PencilSquareIcon />
              Edit
            </Button>
            <Button intent="danger" size="sm" onPress={() => setDeleteOpen(true)}>
              <TrashIcon />
              Delete
            </Button>
          </>
        )}
      </div>

      <Tabs defaultSelectedKey="overview">
        <TabList aria-label="Client sections">
          <Tab id="overview">Overview</Tab>
          <Tab id="projects">Projects ({projects.length})</Tab>
          <Tab id="payments">Payments ({payments.length})</Tab>
          <Tab id="activity">Activity</Tab>
        </TabList>

        <TabPanels>
          <TabPanel id="overview">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="shadow-sm">
                <CardHeader title="Contact information" />
                <CardContent>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <DetailField label="Company" value={client.company_name} />
                    <DetailField label="Contact" value={client.client_name} />
                    <DetailField label="Email" value={client.email} />
                    <DetailField label="Phone" value={client.phone} />
                    <DetailField label="GST / Tax ID" value={client.gst} />
                    <DetailField label="Country" value={client.country} />
                    <DetailField label="Address" value={client.address} />
                    <DetailField label="Created" value={formatDate(client.created_at)} />
                  </dl>
                </CardContent>
              </Card>

              {(canSeeNotes || client.notes) && (
                <Card className="shadow-sm">
                  <CardHeader
                    title="Notes"
                    description={canSeeNotes ? "Client notes and internal records" : undefined}
                  />
                  <CardContent className="space-y-4">
                    {client.notes && (
                      <div>
                        <p className="mb-1 font-medium text-muted-fg text-xs uppercase tracking-wide">
                          Client notes
                        </p>
                        <p className="whitespace-pre-wrap text-sm">{client.notes}</p>
                      </div>
                    )}

                    {canSeeNotes && internalNotes.length > 0 && (
                      <div className="space-y-3 border-t border-border pt-4">
                        <p className="font-medium text-muted-fg text-xs uppercase tracking-wide">
                          Internal notes
                        </p>
                        {internalNotes.map((note) => (
                          <div key={note.id} className="rounded-lg bg-muted/40 p-3">
                            <p className="whitespace-pre-wrap text-sm">{note.body}</p>
                            <p className="mt-2 text-muted-fg text-xs">
                              {note.author?.full_name ?? "Team member"} ·{" "}
                              {formatDate(note.created_at)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {!client.notes && internalNotes.length === 0 && (
                      <p className="text-muted-fg text-sm">No notes recorded</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabPanel>

          <TabPanel id="projects">
            {projects.length === 0 ? (
              <EmptyState title="No projects" description="This client has no projects yet." />
            ) : (
              <Card className="py-0 shadow-sm [--gutter:--spacing(0)]">
                <Table aria-label="Client projects" bleed>
                  <TableHeader>
                    <TableColumn isRowHeader>Project</TableColumn>
                    <TableColumn>Code</TableColumn>
                    <TableColumn>Status</TableColumn>
                    <TableColumn>Deadline</TableColumn>
                    <TableColumn>Budget</TableColumn>
                  </TableHeader>
                  <TableBody items={projects}>
                    {(project) => (
                      <TableRow id={project.id}>
                        <TableCell>
                          <Link
                            href={`/projects/${project.id}`}
                            className="font-medium hover:text-primary hover:underline"
                          >
                            {project.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-fg">{project.project_code}</TableCell>
                        <TableCell>
                          <StatusBadge type="project" status={project.status} />
                        </TableCell>
                        <TableCell className="text-muted-fg tabular-nums">
                          {formatDate(project.deadline)}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {formatCurrency(project.budget, project.currency)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabPanel>

          <TabPanel id="payments">
            {payments.length === 0 ? (
              <EmptyState title="No payments" description="No payment records for this client." />
            ) : (
              <Card className="py-0 shadow-sm [--gutter:--spacing(0)]">
                <Table aria-label="Client payments" bleed>
                  <TableHeader>
                    <TableColumn isRowHeader>Project</TableColumn>
                    <TableColumn>Paid at</TableColumn>
                    <TableColumn>Status</TableColumn>
                    <TableColumn>Amount</TableColumn>
                  </TableHeader>
                  <TableBody items={payments}>
                    {(payment) => (
                      <TableRow id={payment.id}>
                        <TableCell className="font-medium">
                          {payment.project ? (
                            <Link
                              href={`/projects/${payment.project_id}`}
                              className="hover:text-primary hover:underline"
                            >
                              {payment.project.name}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-muted-fg tabular-nums">
                          {formatDate(payment.paid_at ?? payment.created_at)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge type="payment" status={payment.status} />
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {formatCurrency(payment.amount, payment.currency)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabPanel>

          <TabPanel id="activity">
            <Card className="shadow-sm">
              <CardHeader title="Activity log" />
              <CardContent>
                <ActivityFeed items={activities} emptyMessage="No activity recorded yet" />
              </CardContent>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <ModalContent isOpen={editOpen} onOpenChange={setEditOpen} size="lg">
        <ModalHeader>
          <ModalTitle>Edit client</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <ClientForm
            client={client}
            submitLabel="Update client"
            onSuccess={() => setEditOpen(false)}
          />
        </ModalBody>
      </ModalContent>

      <ConfirmDialog
        isOpen={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open)
          if (!open) deleteMutation.reset()
        }}
        title="Delete client"
        description={
          deleteMutation.error?.message ??
          `Are you sure you want to delete ${client.company_name}? This action cannot be undone.`
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
        intent="danger"
      />
    </>
  )
}
