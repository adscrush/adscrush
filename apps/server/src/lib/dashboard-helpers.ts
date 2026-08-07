/**
 * Shared helpers for admin dashboard and media-buyer portal dashboards.
 * Extracted to eliminate duplicated timezone / revenue-series logic.
 */

import { sql } from "@adscrush/db/drizzle"

// ── Revenue-series config ──────────────────────────────────────────────────

export interface RevenueSeriesConfig {
  /** Whether the chart should show daily data (true) or monthly (false). */
  isDailyRevenue: boolean
  /** Start of the revenue query window (already timezone-adjusted). */
  revenueDateFrom: Date
  /** End of the revenue query window (typically `now`). */
  revenueDateTo: Date
  /** Drizzle SQL expression for the GROUP BY / ORDER BY period column. */
  revenueGroupExpr: ReturnType<typeof sql<string>>
}

/**
 * Compute the revenue-series date range and SQL grouping expression from
 * the actual selected date range and timezone offset.
 *
 * Daily mode is used when the range spans ≤ 31 days (month-to-date).
 * Monthly mode is used for longer ranges (last 12 months).
 *
 * @param dateFrom  Start of the selected date range.
 * @param dateTo    End of the selected date range.
 * @param tzOffset  Timezone offset in hours from UTC (e.g. +5.5 for IST).
 */
export function getRevenueSeriesConfig(
  dateFrom: Date,
  dateTo: Date,
  tzOffset: number,
): RevenueSeriesConfig {
  const durationMs = dateTo.getTime() - dateFrom.getTime()
  const durationDays = durationMs / (24 * 60 * 60 * 1000)
  // Daily bars for ranges up to 31 days (month-to-date), monthly for longer
  const isDailyRevenue = durationDays <= 31

  const revenueDateTo = dateTo
  let revenueDateFrom: Date

  if (isDailyRevenue) {
    // Show daily bars from the actual selected dateFrom (not month start)
    revenueDateFrom = new Date(dateFrom)
    if (tzOffset !== 0) {
      revenueDateFrom = new Date(revenueDateFrom.getTime() - tzOffset * 3600000)
    }
  } else {
    // Show monthly bars for the last 12 months
    revenueDateFrom = new Date(dateTo.getFullYear(), dateTo.getMonth() - 11, 1)
  }
  revenueDateFrom.setHours(0, 0, 0, 0)

  const revenueGroupExpr = isDailyRevenue
    ? sql<string>`date(${sql.raw("clicks.created_at")} + interval '1 hour' * ${sql.raw(String(tzOffset))})::text`
    : sql<string>`date_trunc('month', ${sql.raw("clicks.created_at")})::text`

  return { isDailyRevenue, revenueDateFrom, revenueDateTo, revenueGroupExpr }
}

// ── Revenue-series backfill ────────────────────────────────────────────────

export interface RevenuePeriodRow {
  period: string
  revenue: number
  clicks: number
  conversions: number
}

/**
 * Backfill a raw revenue series so every expected time bucket has an entry.
 *
 * - Daily mode: fills every day from dateFrom to dateTo (in the user's local timezone).
 * - Monthly mode: fills the last 12 months.
 */
export function backfillRevenueSeries(
  raw: Array<{ period: string | null; revenue: string | null; clicks: number | null; conversions: number | null }>,
  isDailyRevenue: boolean,
  dateFrom: Date,
  dateTo: Date,
  tzOffset: number,
): RevenuePeriodRow[] {
  const mapped: RevenuePeriodRow[] = raw.map((row) => ({
    period: row.period ?? "",
    revenue: Number(row.revenue ?? 0),
    clicks: Number(row.clicks ?? 0),
    conversions: Number(row.conversions ?? 0),
  }))

  if (isDailyRevenue) {
    const backfilled: RevenuePeriodRow[] = []
    // Apply timezone offset to get local dates
    const localFromMs = dateFrom.getTime() + tzOffset * 3600000
    const localToMs = dateTo.getTime() + tzOffset * 3600000
    const localFrom = new Date(localFromMs)
    const localTo = new Date(localToMs)
    const fromYear = localFrom.getUTCFullYear()
    const fromMonth = localFrom.getUTCMonth()
    const fromDay = localFrom.getUTCDate()
    const toYear = localTo.getUTCFullYear()
    const toMonth = localTo.getUTCMonth()
    const toDay = localTo.getUTCDate()

    // Iterate day by day from dateFrom to dateTo
    const current = new Date(Date.UTC(fromYear, fromMonth, fromDay))
    const end = new Date(Date.UTC(toYear, toMonth, toDay))

    while (current <= end) {
      const y = current.getUTCFullYear()
      const m = current.getUTCMonth() + 1
      const d = current.getUTCDate()
      const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      const existing = mapped.find((r) => r.period === iso)
      backfilled.push(existing ?? { period: iso, revenue: 0, clicks: 0, conversions: 0 })
      current.setUTCDate(current.getUTCDate() + 1)
    }
    return backfilled
  }

  // Monthly mode — last 12 months
  const backfilled: RevenuePeriodRow[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(dateTo.getFullYear(), dateTo.getMonth() - i, 1)
    const iso = d.toISOString().split("T")[0]!
    const existing = mapped.find((r) => {
      const rDate = new Date(r.period)
      return rDate.getFullYear() === d.getFullYear() && rDate.getMonth() === d.getMonth()
    })
    backfilled.push(existing ?? { period: iso, revenue: 0, clicks: 0, conversions: 0 })
  }
  return backfilled
}
