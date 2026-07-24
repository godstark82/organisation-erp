"use client"

import { NativeSelect, NativeSelectContent } from "@/components/ui/native-select"
import {
  DATE_RANGE_PRESETS,
  type DateRangePreset,
  rangeForPreset,
} from "@/lib/date-range"
import { twMerge } from "tailwind-merge"

interface DateRangeFiltersProps {
  from: string
  to: string
  preset: DateRangePreset
  onChange: (next: {
    from: string
    to: string
    range: string
  }) => void
  className?: string
}

const dateInputClassName =
  "h-9 min-w-0 flex-1 rounded-md border border-input bg-bg px-2 text-sm text-fg outline-hidden focus:border-ring focus:ring-3 focus:ring-ring/20 dark:bg-input/30 dark:scheme-dark"

export function DateRangeFilters({
  from,
  to,
  preset,
  onChange,
  className,
}: DateRangeFiltersProps) {
  const showDates = preset !== "all"

  return (
    <div
      className={twMerge(
        "col-span-1 flex min-w-0 flex-col gap-2 sm:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2",
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-border/80 bg-bg/60 p-1.5 sm:flex-row sm:items-center">
        <NativeSelect className="w-full shrink-0 sm:w-36">
          <NativeSelectContent
            value={preset === "custom" ? "custom" : preset}
            onChange={(event) => {
              const nextPreset = event.target.value as DateRangePreset
              if (nextPreset === "custom") {
                onChange({
                  from,
                  to,
                  range: "custom",
                })
                return
              }
              const resolved = rangeForPreset(nextPreset)
              onChange({
                from: resolved.from ?? "",
                to: resolved.to ?? "",
                range: nextPreset,
              })
            }}
            aria-label="Date range preset"
          >
            {DATE_RANGE_PRESETS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </NativeSelectContent>
        </NativeSelect>

        {showDates ? (
          <div className="flex min-w-0 flex-1 items-center gap-1.5 px-0.5">
            <label className="min-w-0 flex-1">
              <span className="sr-only">From date</span>
              <input
                type="date"
                value={from}
                onChange={(event) =>
                  onChange({
                    from: event.target.value,
                    to,
                    range: "custom",
                  })
                }
                aria-label="From date"
                className={dateInputClassName}
              />
            </label>
            <span className="shrink-0 text-muted-fg text-xs" aria-hidden>
              to
            </span>
            <label className="min-w-0 flex-1">
              <span className="sr-only">To date</span>
              <input
                type="date"
                value={to}
                onChange={(event) =>
                  onChange({
                    from,
                    to: event.target.value,
                    range: "custom",
                  })
                }
                aria-label="To date"
                className={dateInputClassName}
              />
            </label>
          </div>
        ) : null}
      </div>
    </div>
  )
}
