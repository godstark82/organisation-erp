"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createClientAction,
  deleteClientAction,
  updateClientAction,
} from "@/features/clients/actions"
import { fetchClientQuery, fetchClientsQuery } from "@/features/clients/queries"
import { assertActionSuccess } from "@/lib/query/action-result"
import { queryKeys } from "@/lib/query-keys"
import type { Client } from "@/types"

export function useClientsQuery(initialData?: Client[]) {
  return useQuery({
    queryKey: queryKeys.clients.lists(),
    queryFn: () => fetchClientsQuery(),
    initialData,
  })
}

export function useClientQuery(id: string, initialData?: Client) {
  return useQuery({
    queryKey: queryKeys.clients.detail(id),
    queryFn: () => fetchClientQuery(id),
    initialData,
    enabled: Boolean(id),
  })
}

function toFormData(data: Record<string, unknown>) {
  const formData = new FormData()
  for (const [key, value] of Object.entries(data)) {
    formData.set(key, value == null ? "" : String(value))
  }
  return formData
}

export function useCreateClientMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) =>
      assertActionSuccess(await createClientAction(null, toFormData(data))),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
    },
  })
}

export function useUpdateClientMutation(clientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) =>
      assertActionSuccess(
        await updateClientAction(clientId, null, toFormData(data))
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.clients.detail(clientId),
      })
    },
  })
}

export function useDeleteClientMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (clientId: string) =>
      assertActionSuccess(await deleteClientAction(clientId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
    },
  })
}
