import { endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek, subDays, subWeeks } from "date-fns"

export function getRange(period: string, from?: string, to?: string) {
  const now = new Date()
  let start: Date
  let end: Date = endOfDay(now)

  switch (period) {
    case "today":
      start = startOfDay(now)
      break
    case "yesterday":
      start = startOfDay(subDays(now, 1))
      end = endOfDay(subDays(now, 1))
      break
    case "this_week":
      start = startOfWeek(now, { weekStartsOn: 1 })
      break
    case "last_week":
      start = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
      end = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
      break
    case "this_month":
      start = startOfMonth(now)
      break
    case "last_month":
      start = startOfMonth(subDays(startOfMonth(now), 1))
      end = endOfMonth(subDays(startOfMonth(now), 1))
      break
    case "all_time":
      start = new Date(0)
      break
    case "custom":
      start = from ? startOfDay(new Date(from)) : startOfMonth(now)
      end = to ? endOfDay(new Date(to)) : endOfDay(now)
      break
    default:
      start = startOfMonth(now)
  }
  return { start, end }
}
