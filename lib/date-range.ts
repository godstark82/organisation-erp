/** YYYY-MM-DD helpers for dashboard / projects date filters */

export type DateRangePreset =
  | "this_month"
  | "last_month"
  | "this_year"
  | "all"
  | "custom"

export interface DateRange {
  from: string | null
  to: string | null
  preset: DateRangePreset
}

export const DATE_RANGE_PRESETS: Array<{
  value: DateRangePreset
  label: string
}> = [
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "this_year", label: "This year" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom range" },
]

function pad(n: number) {
  return String(n).padStart(2, "0")
}

/** Local calendar date as YYYY-MM-DD */
export function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function getThisMonthRange(now = new Date()): { from: string; to: string } {
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { from: toDateInputValue(from), to: toDateInputValue(to) }
}

export function getLastMonthRange(now = new Date()): { from: string; to: string } {
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const to = new Date(now.getFullYear(), now.getMonth(), 0)
  return { from: toDateInputValue(from), to: toDateInputValue(to) }
}

export function getThisYearRange(now = new Date()): { from: string; to: string } {
  const from = new Date(now.getFullYear(), 0, 1)
  const to = new Date(now.getFullYear(), 11, 31)
  return { from: toDateInputValue(from), to: toDateInputValue(to) }
}

export function rangeForPreset(
  preset: DateRangePreset,
  now = new Date()
): { from: string | null; to: string | null } {
  if (preset === "all") return { from: null, to: null }
  if (preset === "last_month") return getLastMonthRange(now)
  if (preset === "this_year") return getThisYearRange(now)
  if (preset === "this_month") return getThisMonthRange(now)
  return getThisMonthRange(now)
}

function isYmd(value: string | null | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value))
}

/** Detect which preset matches from/to (if any). */
export function detectDateRangePreset(
  from: string | null,
  to: string | null,
  now = new Date()
): DateRangePreset {
  if (!from && !to) return "all"
  const thisMonth = getThisMonthRange(now)
  if (from === thisMonth.from && to === thisMonth.to) return "this_month"
  const lastMonth = getLastMonthRange(now)
  if (from === lastMonth.from && to === lastMonth.to) return "last_month"
  const thisYear = getThisYearRange(now)
  if (from === thisYear.from && to === thisYear.to) return "this_year"
  return "custom"
}

/**
 * Resolve date range from URL search params.
 * Default (no from/to/range): this month.
 * `range=all`: no date filter.
 */
export function resolveDateRangeFromParams(params: {
  from?: string | null
  to?: string | null
  range?: string | null
}): DateRange {
  const rangeParam = params.range ?? null

  if (rangeParam === "all") {
    return { from: null, to: null, preset: "all" }
  }

  const from = isYmd(params.from) ? params.from : null
  const to = isYmd(params.to) ? params.to : null

  if (!from && !to && !rangeParam) {
    const month = getThisMonthRange()
    return { from: month.from, to: month.to, preset: "this_month" }
  }

  if (rangeParam && rangeParam !== "custom" && rangeParam !== "all") {
    const resolved = rangeForPreset(rangeParam as DateRangePreset)
    return {
      from: resolved.from,
      to: resolved.to,
      preset: rangeParam as DateRangePreset,
    }
  }

  if (from || to) {
    return {
      from,
      to,
      preset: detectDateRangePreset(from, to),
    }
  }

  const month = getThisMonthRange()
  return { from: month.from, to: month.to, preset: "this_month" }
}

/** Inclusive YYYY-MM-DD check against an ISO timestamp or date string. */
export function isTimestampInDateRange(
  value: string | null | undefined,
  from: string | null,
  to: string | null
): boolean {
  if (!from && !to) return true
  if (!value) return false
  const day = value.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false
  if (from && day < from) return false
  if (to && day > to) return false
  return true
}

/** True when the active range is not the default (this month). */
export function isNonDefaultDateRange(range: DateRange): boolean {
  return range.preset !== "this_month"
}
