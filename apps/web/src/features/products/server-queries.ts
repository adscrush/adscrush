import "server-only"
import { getTrpcServer } from "@/lib/trpc/server"
import type { GetProductsSchema } from "./validations"
import {
  getProductsQueryOptions as getSharedOptions,
  getProductByIdQueryOptions as getByIdOptions,
} from "./query-options"

export function getProductsQueryOptions(params: GetProductsSchema) {
  return getSharedOptions(params, async (p) => {
    const trpc = getTrpcServer()
    const data = await trpc.products.list.query(p)

    return {
      data: data.items,
      pageCount: data.pageCount,
      meta: { total: data.total },
    }
  })
}

export function getProductByIdQueryOptions(id: string) {
  return getByIdOptions(id, async (productId) => {
    const trpc = getTrpcServer()
    return trpc.products.byId.query({ id: productId })
  })
}
