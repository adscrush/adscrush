import { trpc } from "@/lib/trpc/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { departmentKeys, getDepartmentsQueryOptions, getDepartmentByIdQueryOptions } from "./query-options"
import { type GetDepartmentsSchema } from "./validations"
import type { AppRouter } from "@adscrush/server"
import type { inferRouterOutputs } from "@trpc/server"

/* ── Types ─────────────────────────────────────────────────────────── */
type RouterOutputs = inferRouterOutputs<AppRouter>
export type Department = RouterOutputs["departments"]["list"]["items"][number]

// Re-export keys from shared query-options
export { departmentKeys } from "./query-options"

export function useDepartments(params: GetDepartmentsSchema) {
  const utils = trpc.useUtils()

  return useQuery(
    getDepartmentsQueryOptions(params, async (p) => {
      const data = await utils.departments.list.fetch(p)

      return {
        data: data.items,
        pageCount: data.pageCount,
        meta: { total: data.total },
      }
    })
  )
}

export function useDepartment(id: string) {
  const utils = trpc.useUtils()

  return useQuery(
    getDepartmentByIdQueryOptions(id, async (id) => {
      return await utils.departments.byId.fetch({ id })
    })
  )
}

export function useDeleteDepartment() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.departments.delete.useMutation({
    onSuccess: () => {
      utils.departments.list.invalidate()
      queryClient.invalidateQueries({ queryKey: departmentKeys.all })
    },
  })
}

export function useCreateDepartment() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.departments.create.useMutation({
    onSuccess: () => {
      utils.departments.list.invalidate()
      queryClient.invalidateQueries({ queryKey: departmentKeys.all })
    },
  })
}

export function useUpdateDepartment() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.departments.update.useMutation({
    onSuccess: (_, variables) => {
      utils.departments.list.invalidate()
      utils.departments.byId.invalidate({ id: variables.id })
      queryClient.invalidateQueries({ queryKey: departmentKeys.all })
    },
  })
}

export function useBulkUpdateDepartmentStatus() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.departments.bulkUpdateStatus.useMutation({
    onSuccess: () => {
      utils.departments.list.invalidate()
      queryClient.invalidateQueries({ queryKey: departmentKeys.all })
    },
  })
}

export function useBulkDeleteDepartments() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.departments.bulkDelete.useMutation({
    onSuccess: () => {
      utils.departments.list.invalidate()
      queryClient.invalidateQueries({ queryKey: departmentKeys.all })
    },
  })
}
