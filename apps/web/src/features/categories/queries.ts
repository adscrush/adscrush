import { trpc } from "@/lib/trpc/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { categoryKeys, getCategoriesQueryOptions, getCategoryByIdQueryOptions } from "./query-options"
import { type GetCategoriesSchema } from "./validations"
import type { AppRouter } from "@adscrush/server"
import type { inferRouterOutputs } from "@trpc/server"

/* ── Types ─────────────────────────────────────────────────────────── */
type RouterOutputs = inferRouterOutputs<AppRouter>
export type Category = RouterOutputs["categories"]["list"]["items"][number]

// Re-export keys from shared query-options
export { categoryKeys } from "./query-options"

export function useCategories(params: GetCategoriesSchema) {
  const utils = trpc.useUtils()

  return useQuery(
    getCategoriesQueryOptions(params, async (p) => {
      const data = await utils.categories.list.fetch(p)

      return {
        data: data.items,
        pageCount: data.pageCount,
        meta: { total: data.total },
      }
    })
  )
}

export function useCategory(id: string) {
  const utils = trpc.useUtils()

  return useQuery(
    getCategoryByIdQueryOptions(id, async (id) => {
      return await utils.categories.byId.fetch({ id })
    })
  )
}

export function useDeleteCategory() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.categories.delete.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate()
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}

export function useCreateCategory() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.categories.create.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate()
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}

export function useUpdateCategory() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.categories.update.useMutation({
    onSuccess: (_, variables) => {
      utils.categories.list.invalidate()
      utils.categories.byId.invalidate({ id: variables.id })
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}

export function useBulkDeleteCategories() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.categories.bulkDelete.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate()
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}
