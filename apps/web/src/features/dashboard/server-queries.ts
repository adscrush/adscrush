import "server-only"
import { getTrpcServer } from "@/lib/trpc/server"
import { getDashboardAnalyticsQueryOptions as getSharedOptions } from "./query-options"

export function getDashboardAnalyticsQueryOptions(params: {
  dateFrom: string
  dateTo: string
}) {
  return getSharedOptions(params, async (p) => {
    const trpc = getTrpcServer()
    return await trpc.dashboard.stats.query(p)
  })
}
