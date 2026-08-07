import "server-only"
import { getTrpcServer } from "@/lib/trpc/server"
import { type GetEmployeesSchema } from "./validations"
import {
  getEmployeesQueryOptions as getSharedOptions,
  getEmployeeByIdQueryOptions as getSharedByIdOptions,
} from "./query-options"

export function getEmployeesQueryOptions(params: GetEmployeesSchema) {
  return getSharedOptions(params, async (p) => {
    const trpc = getTrpcServer()
    const data = await trpc.employees.list.query(p)

    return {
      data: data.items,
      pageCount: data.pageCount,
      meta: { total: data.total },
    }
  })
}

export function getEmployeeByIdQueryOptions(id: string) {
  return getSharedByIdOptions(id, async (id) => {
    const trpc = getTrpcServer()
    return await trpc.employees.byId.query({ id })
  })
}
