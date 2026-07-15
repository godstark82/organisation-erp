"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  acceptPaymentAction,
  createPaymentAction,
  deletePaymentAction,
  raiseDisputeAction,
  rejectPaymentAction,
  replyDisputeAction,
  updatePaymentAction,
} from "@/features/payments/actions"
import {
  fetchPaymentQuery,
  fetchPaymentsPageQuery,
  type PaymentsListFilters,
} from "@/features/payments/queries"
import { assertActionSuccess } from "@/lib/query/action-result"
import { queryKeys } from "@/lib/query-keys"
import type { Payment } from "@/types"

type PaymentsPageData = Awaited<ReturnType<typeof fetchPaymentsPageQuery>>

export function usePaymentsPageQuery(
  filters: PaymentsListFilters = {},
  initialData?: PaymentsPageData
) {
  const page = Math.max(1, filters.page ?? 1)
  return useQuery({
    queryKey: queryKeys.payments.list({
      projectId: filters.projectId,
      page: String(page),
      status: filters.status || undefined,
      search: filters.search || undefined,
      from: filters.dateFrom || undefined,
      to: filters.dateTo || undefined,
    }),
    queryFn: () => fetchPaymentsPageQuery({ ...filters, page }),
    initialData,
    placeholderData: (previous) => previous,
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

export function useAcceptPaymentMutation(paymentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: FormData) =>
      assertActionSuccess(await acceptPaymentAction(paymentId, null, formData)),
    onSuccess: () => invalidatePayments(queryClient, paymentId),
  })
}

export function useMarkPaidMutation(paymentId: string) {
  return useAcceptPaymentMutation(paymentId)
}

export function useVerifyPaymentMutation(paymentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () =>
      assertActionSuccess(
        await acceptPaymentAction(paymentId, null, new FormData())
      ),
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

export function useReviewPaymentMutation(_paymentId: string) {
  return useMutation({
    mutationFn: async () => {
      throw new Error("Under-review is no longer used. Accept the payment instead.")
    },
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
