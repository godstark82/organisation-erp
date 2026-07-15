"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createPaymentAction,
  deletePaymentAction,
  markPaidAction,
  raiseDisputeAction,
  rejectPaymentAction,
  replyDisputeAction,
  reviewPaymentAction,
  updatePaymentAction,
  verifyPaymentAction,
} from "@/features/payments/actions"
import {
  fetchPaymentQuery,
  fetchPaymentsPageQuery,
} from "@/features/payments/queries"
import { assertActionSuccess } from "@/lib/query/action-result"
import { queryKeys } from "@/lib/query-keys"
import type { Payment } from "@/types"

type PaymentsPageData = Awaited<ReturnType<typeof fetchPaymentsPageQuery>>

export function usePaymentsPageQuery(
  projectId?: string,
  initialData?: PaymentsPageData
) {
  return useQuery({
    queryKey: queryKeys.payments.list({ projectId }),
    queryFn: () => fetchPaymentsPageQuery(projectId),
    initialData,
  })
}

export function usePaymentQuery(id: string, initialData?: Payment) {
  return useQuery({
    queryKey: queryKeys.payments.detail(id),
    queryFn: () => fetchPaymentQuery(id),
    initialData,
    enabled: Boolean(id),
  })
}

function invalidatePayments(
  queryClient: ReturnType<typeof useQueryClient>,
  paymentId?: string
) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.payments.all })
  void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
  if (paymentId) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.payments.detail(paymentId),
    })
  }
}

export function useCreatePaymentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: FormData) =>
      assertActionSuccess(await createPaymentAction(null, formData)),
    onSuccess: () => invalidatePayments(queryClient),
  })
}

export function useUpdatePaymentMutation(paymentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: FormData) =>
      assertActionSuccess(
        await updatePaymentAction(paymentId, null, formData)
      ),
    onSuccess: () => invalidatePayments(queryClient, paymentId),
  })
}

export function useDeletePaymentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (paymentId: string) =>
      assertActionSuccess(await deletePaymentAction(paymentId)),
    onSuccess: () => invalidatePayments(queryClient),
  })
}

export function useMarkPaidMutation(paymentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: FormData) =>
      assertActionSuccess(await markPaidAction(paymentId, null, formData)),
    onSuccess: () => invalidatePayments(queryClient, paymentId),
  })
}

export function useVerifyPaymentMutation(paymentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () =>
      assertActionSuccess(await verifyPaymentAction(paymentId)),
    onSuccess: () => invalidatePayments(queryClient, paymentId),
  })
}

export function useRejectPaymentMutation(paymentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: FormData) =>
      assertActionSuccess(await rejectPaymentAction(paymentId, null, formData)),
    onSuccess: () => invalidatePayments(queryClient, paymentId),
  })
}

export function useReviewPaymentMutation(paymentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () =>
      assertActionSuccess(await reviewPaymentAction(paymentId)),
    onSuccess: () => invalidatePayments(queryClient, paymentId),
  })
}

export function useRaiseDisputeMutation(paymentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: FormData) =>
      assertActionSuccess(await raiseDisputeAction(paymentId, null, formData)),
    onSuccess: () => invalidatePayments(queryClient, paymentId),
  })
}

export function useReplyDisputeMutation(disputeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: FormData) =>
      assertActionSuccess(await replyDisputeAction(disputeId, null, formData)),
    onSuccess: () => invalidatePayments(queryClient),
  })
}
