import "server-only"
import { getTrpcServer } from "@/lib/trpc/server"
import type { GetCreativesSchema } from "./validations"
import { getCreativesQueryOptions as getSharedOptions } from "./query-options"

export function getCreativesQueryOptions(params: GetCreativesSchema) {
  return getSharedOptions(params, async (p) => {
    const trpc = getTrpcServer()
    const data = await trpc.creatives.list.query(p)

    return {
      data: data.items,
      pageCount: data.pageCount,
      meta: { total: data.total },
    }
  })
}
