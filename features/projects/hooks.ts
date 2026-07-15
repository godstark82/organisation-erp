"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  addProjectMembersAction,
  createMilestoneAction,
  createProjectAction,
  createProjectCategoryAction,
  deleteProjectAction,
  deleteProjectCategoryAction,
  removeProjectMemberAction,
  updateMilestoneAction,
  updateProjectAction,
  updateProjectCategoryAction,
} from "@/features/projects/actions"
import {
  fetchProjectCategoriesQuery,
  fetchProjectMembersQuery,
  fetchProjectQuery,
  fetchProjectsPageQuery,
} from "@/features/projects/queries"
import { assertActionSuccess } from "@/lib/query/action-result"
import { queryKeys } from "@/lib/query-keys"
import type { Project, ProjectCategory, ProjectMember } from "@/types"

type ProjectsPageData = Awaited<ReturnType<typeof fetchProjectsPageQuery>>

export function useProjectsPageQuery(initialData?: ProjectsPageData) {
  return useQuery({
    queryKey: queryKeys.projects.lists(),
    queryFn: () => fetchProjectsPageQuery(),
    initialData,
  })
}

export function useProjectQuery(id: string, initialData?: Project) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => fetchProjectQuery(id),
    initialData,
    enabled: Boolean(id),
  })
}

export function useProjectMembersQuery(
  projectId: string,
  initialData?: ProjectMember[]
) {
  return useQuery({
    queryKey: queryKeys.projects.members(projectId),
    queryFn: () => fetchProjectMembersQuery(projectId),
    initialData,
    enabled: Boolean(projectId),
  })
}

export function useProjectCategoriesQuery(
  orgId: string,
  initialData?: ProjectCategory[]
) {
  return useQuery({
    queryKey: queryKeys.projects.categories(orgId),
    queryFn: () => fetchProjectCategoriesQuery(orgId),
    initialData,
    enabled: Boolean(orgId),
  })
}

function invalidateProjects(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: FormData) =>
      assertActionSuccess(await createProjectAction(null, formData)),
    onSuccess: () => invalidateProjects(queryClient),
  })
}

export function useUpdateProjectMutation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: FormData) =>
      assertActionSuccess(
        await updateProjectAction(projectId, null, formData)
      ),
    onSuccess: () => {
      invalidateProjects(queryClient)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      })
    },
  })
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (projectId: string) =>
      assertActionSuccess(await deleteProjectAction(projectId)),
    onSuccess: () => invalidateProjects(queryClient),
  })
}

export function useAddProjectMembersMutation(projectId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: FormData) =>
      assertActionSuccess(await addProjectMembersAction(null, formData)),
    onSuccess: () => {
      invalidateProjects(queryClient)
      if (projectId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.projects.members(projectId),
        })
        void queryClient.invalidateQueries({
          queryKey: queryKeys.projects.detail(projectId),
        })
      }
    },
  })
}

export function useRemoveProjectMemberMutation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) =>
      assertActionSuccess(
        await removeProjectMemberAction(projectId, userId)
      ),
    onSuccess: () => {
      invalidateProjects(queryClient)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projects.members(projectId),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      })
    },
  })
}

export function useCreateMilestoneMutation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: FormData) =>
      assertActionSuccess(await createMilestoneAction(null, formData)),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      })
      invalidateProjects(queryClient)
    },
  })
}

export function useUpdateMilestoneMutation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: FormData) =>
      assertActionSuccess(await updateMilestoneAction(null, formData)),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      })
      invalidateProjects(queryClient)
    },
  })
}

export function useCreateProjectCategoryMutation(orgId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: FormData) =>
      assertActionSuccess(await createProjectCategoryAction(null, formData)),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projects.categories(orgId),
      })
      invalidateProjects(queryClient)
    },
  })
}

export function useUpdateProjectCategoryMutation(orgId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      categoryId,
      formData,
    }: {
      categoryId: string
      formData: FormData
    }) =>
      assertActionSuccess(
        await updateProjectCategoryAction(categoryId, null, formData)
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projects.categories(orgId),
      })
      invalidateProjects(queryClient)
    },
  })
}

export function useDeleteProjectCategoryMutation(orgId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (categoryId: string) =>
      assertActionSuccess(await deleteProjectCategoryAction(categoryId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projects.categories(orgId),
      })
      invalidateProjects(queryClient)
    },
  })
}
