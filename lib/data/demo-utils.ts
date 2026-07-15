/** Reference anchor: 15 Jul 2026, 10:00 IST (UTC+5:30) */
const ANCHOR = new Date("2026-07-15T04:30:00.000Z")

export function demoNow(): string {
  return ANCHOR.toISOString()
}

export function daysAgo(days: number, hour = 10): string {
  const d = new Date(ANCHOR)
  d.setUTCDate(d.getUTCDate() - days)
  d.setUTCHours(hour - 5, 30, 0, 0)
  return d.toISOString()
}

export function daysFromNow(days: number, hour = 10): string {
  const d = new Date(ANCHOR)
  d.setUTCDate(d.getUTCDate() + days)
  d.setUTCHours(hour - 5, 30, 0, 0)
  return d.toISOString()
}

export function dateOnly(daysOffset: number): string {
  const d = new Date(ANCHOR)
  d.setUTCDate(d.getUTCDate() + daysOffset)
  return d.toISOString().slice(0, 10)
}

export function hoursAgo(hours: number): string {
  return new Date(ANCHOR.getTime() - hours * 3600_000).toISOString()
}

export function generateDemoId(): string {
  return crypto.randomUUID()
}

export function touch(): string {
  return demoNow()
}
