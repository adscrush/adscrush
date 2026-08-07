import "server-only"
import { getTrpcServer } from "@/lib/trpc/server"
import { type GetDepartmentsSchema } from "./validations"
import {
  getDepartmentsQueryOptions as getSharedOptions,
  getDepartmentByIdQueryOptions as getSharedByIdOptions,
} from "./query-options"

export function getDepartmentsQueryOptions(params: GetDepartmentsSchema) {
  return getSharedOptions(params, async (p) => {
    const trpc = getTrpcServer()
    const data = await trpc.departments.list.query(p)

    return {
      data: data.items,
      pageCount: data.pageCount,
      meta: { total: data.total },
    }
  })
}

export function getDepartmentByIdQueryOptions(id: string) {
  return getSharedByIdOptions(id, async (id) => {
    const trpc = getTrpcServer()
    return await trpc.departments.byId.query({ id })
  })
}
