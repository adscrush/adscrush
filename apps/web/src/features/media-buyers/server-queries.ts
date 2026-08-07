import "server-only"
import { getTrpcServer } from "@/lib/trpc/server"
import { type GetMediaBuyersSchema } from "./validations"
import { getMediaBuyersQueryOptions as getSharedOptions } from "./query-options"

export function getMediaBuyersQueryOptions(params: GetMediaBuyersSchema) {
  return getSharedOptions(params, async (p) => {
    const trpc = getTrpcServer()
    const data = await trpc.mediaBuyers.list.query(p)

    return {
      data: data.items,
      pageCount: data.pageCount,
      meta: { total: data.total },
    }
  })
}
