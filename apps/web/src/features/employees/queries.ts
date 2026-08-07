import { trpc } from "@/lib/trpc/client"
import { type GetEmployeesSchema } from "./validations"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getEmployeesQueryOptions, getEmployeeByIdQueryOptions, employeeKeys } from "./query-options"
import type { AppRouter } from "@adscrush/server"
import type { inferRouterOutputs } from "@trpc/server"

/* ── Types ─────────────────────────────────────────────────────────── */
type RouterOutputs = inferRouterOutputs<AppRouter>
export type Employee = RouterOutputs["employees"]["byId"]

// Re-export keys from shared query-options
export { employeeKeys } from "./query-options"

export function useEmployees(params: GetEmployeesSchema) {
  const utils = trpc.useUtils()

  // Use the shared query options
  // On the client, we use the tRPC client's query method as the fetcher
  return useQuery(
    getEmployeesQueryOptions(params, async (p) => {
      const data = await utils.employees.list.fetch(p)

      return {
        data: data.items,
        pageCount: data.pageCount,
        meta: { total: data.total },
      }
    })
  )
}

export function useEmployee(id: string) {
  const utils = trpc.useUtils()

  return useQuery(
    getEmployeeByIdQueryOptions(id, async (id) => {
      return await utils.employees.byId.fetch({ id })
    })
  )
}

export function useDeleteEmployee() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.employees.delete.useMutation({
    onSuccess: () => {
      utils.employees.list.invalidate()
      queryClient.invalidateQueries({ queryKey: employeeKeys.all })
    },
  })
}

export function useCreateEmployee() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.employees.create.useMutation({
    onSuccess: () => {
      utils.employees.list.invalidate()
      queryClient.invalidateQueries({ queryKey: employeeKeys.all })
    },
  })
}

export function useUpdateEmployee() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.employees.update.useMutation({
    onSuccess: (_, variables) => {
      utils.employees.list.invalidate()
      utils.employees.byId.invalidate({ id: variables.id })
      queryClient.invalidateQueries({ queryKey: employeeKeys.all })
    },
  })
}

export function useUpdateEmployeeAccess() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.employees.updateAccess.useMutation({
    onSuccess: (_, variables) => {
      utils.employees.list.invalidate()
      utils.employees.byId.invalidate({ id: variables.id })
      queryClient.invalidateQueries({ queryKey: employeeKeys.all })
    },
  })
}

export function useBulkUpdateEmployeeStatus() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.employees.bulkUpdateStatus.useMutation({
    onSuccess: () => {
      utils.employees.list.invalidate()
      queryClient.invalidateQueries({ queryKey: employeeKeys.all })
    },
  })
}

export function useBulkDeleteEmployees() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.employees.bulkDelete.useMutation({
    onSuccess: () => {
      utils.employees.list.invalidate()
      queryClient.invalidateQueries({ queryKey: employeeKeys.all })
    },
  })
}

export function useChangeEmployeePassword() {
  return trpc.employees.changePassword.useMutation()
}
