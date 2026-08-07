import { TZDateMini } from "@date-fns/tz"
import { format } from "date-fns"

export function formatDate(date: Date | string | number | undefined, opts: Intl.DateTimeFormatOptions = {}) {
  if (!date) return ""

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: opts.month ?? "long",
      day: opts.day ?? "numeric",
      year: opts.year ?? "numeric",
      ...opts,
    }).format(new Date(date))
  } catch {
    return ""
  }
}

export function formatUtcDateInTimeZone(
  value: string | number | Date | undefined,
  formatStr = "dd MMM yyyy hh:mm:ss a",
  timeZone = "Asia/Kolkata"
) {
  if (!value) return ""

  try {
    const utcDate = typeof value === "string" ? new Date(value.replace(" ", "T") + "Z") : new Date(value)

    const zonedDate = new TZDateMini(utcDate, timeZone)

    return format(zonedDate, formatStr)
  } catch {
    return ""
  }
}

export function formatPrice(price: number | string | undefined, currency = "INR") {
  if (price === undefined || price === null) return ""

  const numericPrice = typeof price === "string" ? parseFloat(price) : price
  if (isNaN(numericPrice)) return String(price)

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(numericPrice)
}
