import "server-only"
import { getTrpcServer } from "@/lib/trpc/server"
import { type GetUsersSchema } from "./validations"
import {
  getUsersQueryOptions as getSharedOptions,
  getUserByIdQueryOptions as getSharedByIdOptions,
} from "./query-options"

export function getUsersQueryOptions(params: GetUsersSchema) {
  return getSharedOptions(params, async (p) => {
    const trpc = getTrpcServer()
    const data = await trpc.users.list.query(p)

    return {
      data: data.items,
      pageCount: data.pageCount,
      meta: { total: data.total },
    }
  })
}

export function getUserByIdQueryOptions(id: string) {
  return getSharedByIdOptions(id, async (id) => {
    const trpc = getTrpcServer()
    return await trpc.users.byId.query({ id })
  })
}
