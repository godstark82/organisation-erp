import { cn } from "@/lib/utils"

export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4 text-primary"
        fill="none"
        aria-hidden
      >
        <path
          d="M4 18V6l8 4.5L20 6v12"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 10.5V18"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display font-semibold tracking-tight text-fg", className)}>
      Agency<span className="text-primary">OS</span>
    </span>
  )
}
