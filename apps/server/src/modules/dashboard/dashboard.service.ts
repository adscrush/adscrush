import type { Database } from "@adscrush/db"
import { getRevenueSeriesConfig, backfillRevenueSeries } from "~/lib/dashboard-helpers"
import * as repository from "./dashboard.repository"

interface DateRange {
  dateFrom: Date
  dateTo: Date
}

interface PreviousPeriod {
  from: Date
  to: Date
}

export function getPreviousPeriod(currentFrom: Date, currentTo: Date): PreviousPeriod {
  const durationMs = currentTo.getTime() - currentFrom.getTime()
  const prevTo = new Date(currentFrom.getTime() - 1)
  const prevFrom = new Date(prevTo.getTime() - durationMs)
  return { from: prevFrom, to: prevTo }
}

export function getDateRange(dateFromStr: string, dateToStr: string): DateRange {
  const dateFrom = new Date(dateFromStr)
  const dateTo = new Date(dateToStr)
  dateFrom.setHours(0, 0, 0, 0)
  dateTo.setHours(23, 59, 59, 999)
  return { dateFrom, dateTo }
}

export function getTodayRange(): { todayStart: Date; todayEnd: Date } {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)
  return { todayStart, todayEnd }
}

export function getNowTs(): number {
  return Date.now()
}

export { getRevenueSeriesConfig, backfillRevenueSeries }

export async function getRevenueTrendForPeriod(
  db: Database,
  nowTs: number,
  days: number,
  scopeConditions: repository.ScopeConditions
): Promise<number> {
  const msPerDay = 24 * 60 * 60 * 1000
  const from = new Date(nowTs - days * msPerDay)
  const to = new Date()
  const prevFrom = new Date(from.getTime() - days * msPerDay)
  const prevTo = new Date(from.getTime() - 1)

  const [curr, prev] = await Promise.all([
    repository.getRevenueTrend(db, from, to, scopeConditions),
    repository.getRevenueTrend(db, prevFrom, prevTo, scopeConditions),
  ])

  const currTotal = Number(curr[0]?.total ?? 0)
  const prevTotal = Number(prev[0]?.total ?? 0)
  return prevTotal > 0 ? ((currTotal - prevTotal) / prevTotal) * 100 : 0
}

export function transformHourlyData(
  raw: Awaited<ReturnType<typeof repository.getHourlyData>>,
  tzOffset: number
) {
  const hourlyMap = new Map<number, { clicks: number; conversions: number }>()
  for (const row of raw) {
    const utcDecimal = row.hour + row.minute / 60
    const localDecimal = ((utcDecimal + tzOffset) % 24 + 24) % 24
    const localHour = Math.floor(localDecimal)

    const existing = hourlyMap.get(localHour) ?? { clicks: 0, conversions: 0 }
    hourlyMap.set(localHour, {
      clicks: existing.clicks + Number(row.clicks),
      conversions: existing.conversions + Number(row.conversions),
    })
  }

  return Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    clicks: hourlyMap.get(i)?.clicks ?? 0,
    conversions: hourlyMap.get(i)?.conversions ?? 0,
  }))
}

export function transformBrowserBreakdown(
  raw: Awaited<ReturnType<typeof repository.getBrowserBreakdown>>
) {
  return raw
    .filter((row) => row.browser !== null)
    .map((row) => ({
      browser: row.browser!,
      clicks: row.clicks,
    }))
}

export function transformGeographyData(
  raw: Awaited<ReturnType<typeof repository.getGeographyData>>
) {
  return raw.map((row) => ({
    countryCode: row.countryCode ?? "unknown",
    total: Number(row.clicks ?? 0),
    clicks: Number(row.clicks ?? 0),
    conversions: Number(row.conversions ?? 0),
    countryName: "",
    flag: "",
    lat: 0,
    lng: 0,
  }))
}

export function transformCustomerSegments(
  segments: Awaited<ReturnType<typeof repository.getCustomerSegments>>,
  prevSegments: Awaited<ReturnType<typeof repository.getCustomerSegments>>,
  totalConversions: number
) {
  const prevCounts = new Map<string, number>()
  prevSegments.forEach((row) => {
    if (row.segment) prevCounts.set(row.segment, Number(row.count ?? 0))
  })

  const totalConvForShare = segments.reduce((sum, row) => sum + Number(row.count ?? 0), 0)
  const grayscale = ["#9CA3AF", "#6B7280", "#374151"]

  return segments.map((row, index) => {
    const count = Number(row.count ?? 0)
    const share = totalConversions > 0 ? (count / totalConvForShare) * 100 : 0
    const prevCount = prevCounts.get(row.segment ?? "") ?? 0
    const trend = prevCount > 0 ? ((count - prevCount) / prevCount) * 100 : 0
    return {
      segment: row.segment ?? "Uncategorized",
      count,
      trend,
      color: grayscale[index] ?? "#9CA3AF",
      share,
    }
  })
}

export function transformActiveProductsList(
  raw: Awaited<ReturnType<typeof repository.getActiveProductsList>>
) {
  return raw.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category ?? "Uncategorized",
    status: row.status,
    clicks: Number(row.clicks ?? 0),
    conversions: Number(row.conversions ?? 0),
    revenue: Number(row.revenue ?? 0),
    payout: Number(row.payout ?? 0),
    lastConversion: row.lastConversion,
  }))
}

export function transformConversionTrend(
  raw: Awaited<ReturnType<typeof repository.getConversionTrend>>
) {
  return raw.map((row) => {
    const c = Number(row.clicks)
    return {
      date: row.date,
      clicks: c,
      conversions: Number(row.conversions),
      cr: c > 0 ? (Number(row.conversions) / c) * 100 : 0,
    }
  })
}

export function transformTrafficBySource(
  raw: Awaited<ReturnType<typeof repository.getTrafficBySource>>
) {
  return raw.map((row) => ({
    source: row.source ?? "Unknown",
    clicks: Number(row.clicks ?? 0),
    conversions: Number(row.conversions ?? 0),
  }))
}

export function transformTopMediaBuyers(
  raw: Awaited<ReturnType<typeof repository.getTopMediaBuyers>>
) {
  return raw.map((row) => {
    const clicks = Number(row.clicks ?? 0)
    const conversions = Number(row.conversions ?? 0)
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      clicks,
      conversions,
      revenue: Number(row.revenue ?? 0),
      conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
    }
  })
}
