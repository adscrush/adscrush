import "server-only"
import { getTrpcServer } from "@/lib/trpc/server"
import type { GetFunnelsSchema } from "./validations"
import { getFunnelsQueryOptions, getFunnelCountsQueryOptions } from "./query-options"

export function getFunnelsServerQueryOptions(params: GetFunnelsSchema) {
  return getFunnelsQueryOptions(params, async (p) => {
    const trpc = getTrpcServer()
    const data = await trpc.funnels.list.query(p)

    return {
      data: data.items,
      pageCount: data.pageCount,
      meta: { total: data.total },
    }
  })
}

export function getFunnelCountsServerQueryOptions() {
  return getFunnelCountsQueryOptions(async () => {
    const trpc = getTrpcServer()
    return trpc.funnels.counts.query({})
  })
}
