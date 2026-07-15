export const queryKeys = {
  clients: {
    all: ["clients"] as const,
    lists: () => [...queryKeys.clients.all, "list"] as const,
    list: (filters: Record<string, string | undefined>) =>
      [...queryKeys.clients.lists(), filters] as const,
    details: () => [...queryKeys.clients.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.clients.details(), id] as const,
  },
  developers: {
    all: ["developers"] as const,
    lists: () => [...queryKeys.developers.all, "list"] as const,
    list: (filters: Record<string, string | undefined>) =>
      [...queryKeys.developers.lists(), filters] as const,
  },
  projects: {
    all: ["projects"] as const,
    lists: () => [...queryKeys.projects.all, "list"] as const,
    list: (filters: Record<string, string | undefined>) =>
      [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    members: (id: string) =>
      [...queryKeys.projects.detail(id), "members"] as const,
    categories: (orgId: string) =>
      [...queryKeys.projects.all, "categories", orgId] as const,
  },
  payments: {
    all: ["payments"] as const,
    lists: () => [...queryKeys.payments.all, "list"] as const,
    list: (filters: Record<string, string | undefined>) =>
      [...queryKeys.payments.lists(), filters] as const,
    details: () => [...queryKeys.payments.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.payments.details(), id] as const,
  },
} as const
