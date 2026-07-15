"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FieldError, Label } from "@/components/ui/field"
import { ModalBody, ModalContent, ModalHeader, ModalTitle } from "@/components/ui/modal"
import { Note } from "@/components/ui/note"
import { TextField } from "@/components/ui/text-field"
import { Textarea } from "@/components/ui/textarea"
import {
  useRejectPaymentMutation,
  useReviewPaymentMutation,
  useVerifyPaymentMutation,
} from "@/features/payments/hooks"
import type { Payment } from "@/types"

interface VerifyActionsProps {
  payment: Payment
}

export function VerifyActions({ payment }: VerifyActionsProps) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const reviewMutation = useReviewPaymentMutation(payment.id)
  const verifyMutation = useVerifyPaymentMutation(payment.id)
  const rejectMutation = useRejectPaymentMutation(payment.id)

  const actionError =
    reviewMutation.error?.message ??
    verifyMutation.error?.message ??
    rejectMutation.error?.message ??
    null

  const rejectFieldErrors =
    (rejectMutation.error as Error & { fieldErrors?: Record<string, string[]> })
      ?.fieldErrors ?? undefined

  const handleReject = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    rejectMutation.mutate(formData, {
      onSuccess: () => setRejectOpen(false),
    })
  }

  const canReview = payment.status === "client_marked_paid"
  const canVerifyReject =
    payment.status === "under_review" || payment.status === "client_marked_paid"

  if (!canReview && !canVerifyReject) return null

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-warning/30 bg-warning-subtle/20 p-4">
        <h3 className="font-medium text-sm">Admin verification</h3>
        <p className="mt-1 text-muted-fg text-xs">
          Review payment proof, then verify or reject. Clients cannot verify payments.
        </p>
      </div>

      {actionError && (
        <Note intent="danger" className="text-sm">
          {actionError}
        </Note>
      )}

      <div className="flex flex-wrap gap-2">
        {canReview && (
          <Button
            intent="secondary"
            size="sm"
            isDisabled={reviewMutation.isPending}
            onPress={() => reviewMutation.mutate()}
          >
            {reviewMutation.isPending ? "Moving…" : "Move to Under Review"}
          </Button>
        )}
        {canVerifyReject && (
          <>
            <Button
              intent="success"
              size="sm"
              isDisabled={verifyMutation.isPending}
              onPress={() => verifyMutation.mutate()}
            >
              {verifyMutation.isPending ? "Verifying…" : "Verify payment"}
            </Button>
            <Button
              intent="danger"
              size="sm"
              onPress={() => setRejectOpen(true)}
            >
              Reject
            </Button>
          </>
        )}
      </div>

      <ModalContent
        isOpen={rejectOpen}
        onOpenChange={setRejectOpen}
        size="md"
      >
        <ModalHeader>
          <ModalTitle>Reject payment</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <form onSubmit={handleReject} className="space-y-4">
            <TextField
              name="rejection_reason"
              isRequired
              isInvalid={!!rejectFieldErrors?.rejection_reason}
            >
              <Label>Rejection reason</Label>
              <Textarea
                rows={4}
                placeholder="Explain why this payment is being rejected…"
              />
              <FieldError>{rejectFieldErrors?.rejection_reason?.[0]}</FieldError>
            </TextField>
            <div className="flex justify-end gap-2">
              <Button intent="plain" size="sm" onPress={() => setRejectOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                intent="danger"
                size="sm"
                isDisabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending ? "Rejecting…" : "Reject payment"}
              </Button>
            </div>
          </form>
        </ModalBody>
      </ModalContent>
    </div>
  )
}
