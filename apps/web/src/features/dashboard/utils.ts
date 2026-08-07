export function formatCurrency(value: number, currency: string = "USD", decimals?: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: decimals ?? 0,
    maximumFractionDigits: decimals ?? 0,
  }).format(value)
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatTrend(value: number): { sign: "+" | "-"; value: number; formatted: string } {
  const sign = value >= 0 ? "+" : "-"
  const absValue = Math.abs(value)
  return {
    sign,
    value: absValue,
    formatted: `${sign}${absValue.toFixed(1)}%`,
  }
}

/** Return default date range (today) as ISO strings when URL params are missing. */
export function getDefaultDateRange(): { dateFrom: string; dateTo: string } {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString()
  return { dateFrom: todayStart, dateTo: todayEnd }
}

export function getPeriodLabel(period: string, dateString: string): string {
  if (period === "1w") {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { weekday: "short" })
  }
  if (period === "1m" || period === "3m") {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
  return dateString
}

/** Return comparison label based on the selected range */
export function getTrendLabel(range: string | undefined): string {
  if (!range) return "vs Previous Period"
  const lower = range.toLowerCase()
  if (lower === "today") return "vs Yesterday"
  if (lower === "yesterday") return "vs Previous Day"
  if (lower === "last 7 days") return "vs Previous 7 Days"
  if (lower === "last 30 days") return "vs Previous 30 Days"

  if (lower === "this week") return "vs Last Week"
  if (lower === "last week") return "vs Previous Week"
  if (lower === "this month") return "vs Last Month"
  if (lower === "last month") return "vs Previous Month"
  if (lower === "this quarter") return "vs Last Quarter"
  if (lower === "this year") return "vs Last Year"
  if (lower === "last year") return "vs Previous Year"
  return "vs Previous Period"
}
