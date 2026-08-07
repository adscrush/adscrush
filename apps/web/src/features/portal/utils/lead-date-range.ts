import { endOfDay, startOfDay } from "date-fns"

/**
 * Parse a `yyyy-MM-dd` string into a Date at local midnight.
 *
 * `new Date("2026-08-01")` parses as *UTC* midnight, which combined with
 * local-time startOfDay/endOfDay normalization shifts the day by one for
 * timezones west of UTC. Building the Date from local components avoids that.
 */
export function parseLeadDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number)
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1)
}

/**
 * Resolve a lead date range from optional `yyyy-MM-dd` URL params.
 *
 * - Falls back to *today* when the params are unset (the leads table's default view).
 * - Returns full start/end-of-day ISO timestamps so server-side
 *   `gte/lte(createdAt, new Date(...))` comparisons are inclusive of the whole
 *   selected day (a bare `yyyy-MM-dd` would be parsed by the server as UTC
 *   midnight and exclude the selected day).
 */
export function resolveLeadDateRange(params: { dateFrom?: string | null; dateTo?: string | null }): {
  dateFrom: string
  dateTo: string
} {
  return {
    dateFrom: startOfDay(params.dateFrom ? parseLeadDate(params.dateFrom) : new Date()).toISOString(),
    dateTo: endOfDay(params.dateTo ? parseLeadDate(params.dateTo) : new Date()).toISOString(),
  }
}
