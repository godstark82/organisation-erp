import { Suspense } from "react"
import { ProjectsList } from "@/features/projects/components/projects-list"
import { fetchProjectsPageQuery } from "@/features/projects/queries"
import { LoadingSkeleton } from "@/components/shared/loading-skeleton"
import { Note } from "@/components/ui/note"

export default async function ProjectsPage() {
  let error: string | null = null
  let initialData: Awaited<ReturnType<typeof fetchProjectsPageQuery>> | null =
    null

  try {
    initialData = await fetchProjectsPageQuery()
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "Unable to load projects. Please try again."
  }

  return (
    <Suspense fallback={<LoadingSkeleton variant="table" className="p-4 sm:p-6" />}>
      {error || !initialData ? (
        <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
          <Note intent="danger" className="text-sm break-words">
            {error ?? "Unable to load projects."}
          </Note>
        </div>
      ) : (
        <ProjectsList initialData={initialData} />
      )}
    </Suspense>
  )
}
