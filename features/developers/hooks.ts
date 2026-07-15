"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createDeveloperAction,
  deactivateDeveloperAction,
  updateDeveloperAction,
} from "@/features/developers/actions"
import { fetchDevelopersQuery } from "@/features/developers/queries"
import { assertActionSuccess } from "@/lib/query/action-result"
import { queryKeys } from "@/lib/query-keys"
import type { Profile } from "@/types"

export function useDevelopersQuery(initialData?: Profile[]) {
  return useQuery({
    queryKey: queryKeys.developers.lists(),
    queryFn: () => fetchDevelopersQuery(),
    initialData,
  })
}

export function useCreateDeveloperMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: FormData) =>
      assertActionSuccess(await createDeveloperAction(null, formData)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.developers.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
  })
}

export function useUpdateDeveloperMutation(developerId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: FormData) =>
      assertActionSuccess(
        await updateDeveloperAction(developerId, null, formData)
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.developers.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
  })
}

export function useDeactivateDeveloperMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (developerId: string) =>
      assertActionSuccess(await deactivateDeveloperAction(developerId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.developers.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
  })
}
