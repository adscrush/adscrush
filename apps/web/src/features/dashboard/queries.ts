import { trpc } from "@/lib/trpc/client"
import { useQuery } from "@tanstack/react-query"
import { getDashboardAnalyticsQueryOptions } from "./query-options"

export { dashboardKeys, getDashboardAnalyticsQueryOptions } from "./query-options"

export function useDashboardAnalytics(params: { dateFrom: string; dateTo: string }) {
  const utils = trpc.useUtils()

  return useQuery(getDashboardAnalyticsQueryOptions(params, (p) => utils.dashboard.stats.fetch(p)))
}
