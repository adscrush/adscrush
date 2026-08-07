import "server-only"
import { getTrpcServer } from "@/lib/trpc/server"
import { type GetAdAccountsSchema } from "./validations"
import { getAdAccountsQueryOptions as getSharedOptions } from "./query-options"

export function getAdAccountsQueryOptions(params: GetAdAccountsSchema) {
  return getSharedOptions(params, async (p) => {
    const trpc = getTrpcServer()
    const data = await trpc.adAccounts.list.query(p)

    return {
      data: data.items,
      pageCount: data.pageCount,
      meta: { total: data.total },
    }
  })
}
