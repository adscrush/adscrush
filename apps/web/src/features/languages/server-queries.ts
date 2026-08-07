import "server-only"
import { getTrpcServer } from "@/lib/trpc/server"
import { type GetLanguagesSchema } from "./validations"
import {
  getLanguagesQueryOptions as getSharedOptions,
  getLanguageByIdQueryOptions as getSharedByIdOptions,
} from "./query-options"

export function getLanguagesQueryOptions(params: GetLanguagesSchema) {
  return getSharedOptions(params, async (p) => {
    const trpc = getTrpcServer()
    const data = await trpc.languages.list.query(p)

    return {
      data: data.items,
      pageCount: data.pageCount,
      meta: { total: data.total },
    }
  })
}

export function getLanguageByIdQueryOptions(id: string) {
  return getSharedByIdOptions(id, async (id) => {
    const trpc = getTrpcServer()
    return await trpc.languages.byId.query({ id })
  })
}
