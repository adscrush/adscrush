import "server-only"
import { getTrpcServer } from "@/lib/trpc/server"
import { type GetAdvertisersSchema } from "./validations"
import { getAdvertisersQueryOptions as getSharedOptions } from "./query-options"

export function getAdvertisersQueryOptions(params: GetAdvertisersSchema) {
  return getSharedOptions(params, async (p) => {
    const trpc = getTrpcServer()
    const data = await trpc.advertisers.list.query(p)

    return {
      data: data.items,
      pageCount: data.pageCount,
      meta: { total: data.total },
    }
  })
}
