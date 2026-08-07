import { queryOptions } from "@tanstack/react-query"

export const dashboardKeys = {
  all: ["dashboard"] as const,
  detail: () => [...dashboardKeys.all, "detail"] as const,
  analytics: (params: { dateFrom: string; dateTo: string; timezoneOffset?: number }) =>
    [...dashboardKeys.detail(), { params }] as const,
}

// Get user's timezone offset in hours (e.g., IST = +5.5, EST = -5)
export function getTimezoneOffset(): number {
  return -new Date().getTimezoneOffset() / 60
}

export function getDashboardAnalyticsQueryOptions<T>(
  params: {
    dateFrom: string
    dateTo: string
  },
  fetcher: (params: { dateFrom: string; dateTo: string; timezoneOffset?: number }) => Promise<T>
) {
  const paramsWithTimezone = {
    ...params,
    timezoneOffset: getTimezoneOffset(),
  }
  
  return queryOptions({
    queryKey: dashboardKeys.analytics(paramsWithTimezone),
    queryFn: () => fetcher(paramsWithTimezone),
    staleTime: 5 * 60 * 1000,
  })
}
