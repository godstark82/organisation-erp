"use client"

import { useRef, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { FileDropzone } from "@/components/shared/file-dropzone"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Button } from "@/components/ui/button"
import { FieldError, Label } from "@/components/ui/field"
import { Note } from "@/components/ui/note"
import { TextField } from "@/components/ui/text-field"
import { Textarea } from "@/components/ui/textarea"
import {
  useRaiseDisputeMutation,
  useReplyDisputeMutation,
} from "@/features/payments/hooks"
import { formatCurrency } from "@/lib/utils"
import type { Payment, PaymentDispute } from "@/types"

interface DisputePanelProps {
  payment: Payment
  dispute: PaymentDispute | null
  canRaiseDispute: boolean
}

export function DisputePanel({
  payment,
  dispute,
  canRaiseDispute,
}: DisputePanelProps) {
  const [showForm, setShowForm] = useState(false)
  const raiseMutation = useRaiseDisputeMutation(payment.id)
  const raiseFormRef = useRef<HTMLFormElement>(null)

  const raiseFieldErrors =
    (raiseMutation.error as Error & { fieldErrors?: Record<string, string[]> })
      ?.fieldErrors ?? undefined

  if (!dispute && !canRaiseDispute) return null

  if (!dispute) {
    const handleFilesSelect = (files: FileList) => {
      const input = raiseFormRef.current?.querySelector(
        'input[name="attachments"]'
      ) as HTMLInputElement | null
      if (input) {
        const dt = new DataTransfer()
        Array.from(files).forEach((f) => dt.items.add(f))
        input.files = dt.files
      }
    }

    const handleRaise = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const formData = new FormData(event.currentTarget)
      raiseMutation.mutate(formData)
    }

    return (
      <div className="space-y-4">
        {!showForm ? (
          <Button intent="warning" size="sm" onPress={() => setShowForm(true)}>
            Raise dispute
          </Button>
        ) : (
          <form
            ref={raiseFormRef}
            onSubmit={handleRaise}
            className="space-y-4 rounded-lg border border-border p-4"
          >
            <h3 className="font-medium text-sm">Raise payment dispute</h3>

            {raiseMutation.error && (
              <Note intent="danger" className="text-sm">
                {raiseMutation.error.message}
              </Note>
            )}
            {raiseMutation.isSuccess && raiseMutation.data?.success && (
              <Note intent="success" className="text-sm">
                {raiseMutation.data.success}
              </Note>
            )}

            <TextField
              name="reason"
              isRequired
              isInvalid={!!raiseFieldErrors?.reason}
            >
              <Label>Reason</Label>
              <Textarea rows={3} placeholder="Describe the issue…" />
              <FieldError>{raiseFieldErrors?.reason?.[0]}</FieldError>
            </TextField>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField>
                <Label>Expected amount</Label>
                <input
                  type="number"
                  name="expected_amount"
                  defaultValue={payment.amount}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                />
              </TextField>
              <TextField>
                <Label>Received amount</Label>
                <input
                  type="number"
                  name="received_amount"
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                />
              </TextField>
            </div>

            <TextField
              name="message"
              isRequired
              isInvalid={!!raiseFieldErrors?.message}
            >
              <Label>Initial message</Label>
              <Textarea rows={3} placeholder="Start the conversation…" />
              <FieldError>{raiseFieldErrors?.message?.[0]}</FieldError>
            </TextField>

            <div>
              <Label className="mb-2 block">Attachments</Label>
              <input
                type="file"
                name="attachments"
                multiple
                className="hidden"
                accept="image/*,.pdf"
              />
              <FileDropzone
                onFilesSelect={handleFilesSelect}
                accept="image/*,.pdf"
                allowsMultiple
                maxFiles={5}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                intent="warning"
                isDisabled={raiseMutation.isPending}
              >
                {raiseMutation.isPending ? "Submitting…" : "Submit dispute"}
              </Button>
              <Button intent="plain" size="sm" onPress={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    )
  }

  return <DisputeThread dispute={dispute} />
}

function DisputeThread({ dispute }: { dispute: PaymentDispute }) {
  const replyMutation = useReplyDisputeMutation(dispute.id)
  const replyFormRef = useRef<HTMLFormElement>(null)

  const replyFieldErrors =
    (replyMutation.error as Error & { fieldErrors?: Record<string, string[]> })
      ?.fieldErrors ?? undefined

  const handleFilesSelect = (files: FileList) => {
    const input = replyFormRef.current?.querySelector(
      'input[name="attachments"]'
    ) as HTMLInputElement | null
    if (input) {
      const dt = new DataTransfer()
      Array.from(files).forEach((f) => dt.items.add(f))
      input.files = dt.files
    }
  }

  const handleReply = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    replyMutation.mutate(formData)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-warning/30 bg-warning-subtle/20 p-4">
        <h3 className="font-medium text-sm">Dispute</h3>
        <p className="mt-1 text-sm">{dispute.reason}</p>
        <div className="mt-2 flex flex-wrap gap-4 text-muted-fg text-xs">
          {dispute.expected_amount != null && (
            <span>Expected: {formatCurrency(dispute.expected_amount)}</span>
          )}
          {dispute.received_amount != null && (
            <span>Received: {formatCurrency(dispute.received_amount)}</span>
          )}
          <span>Status: {dispute.status.replace(/_/g, " ")}</span>
        </div>
      </div>

      <div className="divide-y divide-border rounded-lg border border-border">
        {(dispute.messages ?? []).map((msg) => (
          <div key={msg.id} className="flex gap-3 p-4">
            <UserAvatar profile={msg.author} size="sm" className="shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-sm">
                  {msg.author?.full_name ?? "Unknown"}
                </span>
                <time className="text-muted-fg text-xs">
                  {formatDistanceToNow(new Date(msg.created_at), {
                    addSuffix: true,
                  })}
                </time>
              </div>
              <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
              {msg.attachments.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {msg.attachments.map((att) => (
                    <li key={att.url}>
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-xs hover:underline"
                      >
                        {att.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>

      <form ref={replyFormRef} onSubmit={handleReply} className="space-y-3">
        {replyMutation.error && (
          <Note intent="danger" className="text-sm">
            {replyMutation.error.message}
          </Note>
        )}
        {replyMutation.isSuccess && replyMutation.data?.success && (
          <Note intent="success" className="text-sm">
            {replyMutation.data.success}
          </Note>
        )}

        <TextField name="message" isInvalid={!!replyFieldErrors?.message}>
          <Textarea rows={3} placeholder="Reply to dispute…" />
          <FieldError>{replyFieldErrors?.message?.[0]}</FieldError>
        </TextField>

        <input
          type="file"
          name="attachments"
          multiple
          className="hidden"
          accept="image/*,.pdf"
        />
        <FileDropzone
          onFilesSelect={handleFilesSelect}
          accept="image/*,.pdf"
          allowsMultiple
          maxFiles={3}
          description="Attach supporting files (optional)"
        />

        <Button
          type="submit"
          intent="primary"
          size="sm"
          isDisabled={replyMutation.isPending}
        >
          {replyMutation.isPending ? "Sending…" : "Send reply"}
        </Button>
      </form>
    </div>
  )
}
