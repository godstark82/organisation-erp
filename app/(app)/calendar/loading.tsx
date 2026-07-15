import { LoadingSkeleton } from "@/components/shared/loading-skeleton"

export default function CalendarLoading() {
  return (
    <div className="p-4 sm:p-6">
      <LoadingSkeleton variant="page" />
    </div>
  )
}
