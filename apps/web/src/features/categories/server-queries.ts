import "server-only"
import { getTrpcServer } from "@/lib/trpc/server"
import { type GetCategoriesSchema } from "./validations"
import {
  getCategoriesQueryOptions as getSharedOptions,
  getCategoryByIdQueryOptions as getSharedByIdOptions,
} from "./query-options"

export function getCategoriesQueryOptions(params: GetCategoriesSchema) {
  return getSharedOptions(params, async (p) => {
    const trpc = getTrpcServer()
    const data = await trpc.categories.list.query(p)

    return {
      data: data.items,
      pageCount: data.pageCount,
      meta: { total: data.total },
    }
  })
}

export function getCategoryByIdQueryOptions(id: string) {
  return getSharedByIdOptions(id, async (id) => {
    const trpc = getTrpcServer()
    return await trpc.categories.byId.query({ id })
  })
}
