import { LoadingSkeleton } from "@/components/shared/loading-skeleton"

export default function DevelopersLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <LoadingSkeleton variant="page" />
    </div>
  )
}
