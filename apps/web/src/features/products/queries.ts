import { trpc } from "@/lib/trpc/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { productKeys, getProductsQueryOptions } from "./query-options"
import type { GetProductsSchema } from "./validations"
import type { AppRouter } from "@adscrush/server"
import type { inferRouterOutputs } from "@trpc/server"

type RouterOutputs = inferRouterOutputs<AppRouter>
export type Product = RouterOutputs["products"]["list"]["items"][number]

export { productKeys, getProductsQueryOptions } from "./query-options"

export function useProducts(params: GetProductsSchema) {
  const utils = trpc.useUtils()

  return useQuery(
    getProductsQueryOptions(params, async (p) => {
      const data = await utils.products.list.fetch(p)

      return {
        data: data.items,
        pageCount: data.pageCount,
        meta: { total: data.total },
      }
    })
  )
}

export function useProduct(id: string) {
  return trpc.products.byId.useQuery({ id })
}

export function useProductForEdit(id: string) {
  return trpc.products.getForEdit.useQuery({ id }, { enabled: !!id })
}

export function useDeleteProduct() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.products.delete.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate()
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}

export function useCreateProduct() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.products.create.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate()
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}

export function useUpdateProduct() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.products.update.useMutation({
    onSuccess: (_, variables) => {
      utils.products.list.invalidate()
      utils.products.byId.invalidate({ id: variables.id })
      utils.products.getForEdit.invalidate({ id: variables.id })
      utils.products.search.invalidate()
      utils.products.options.invalidate()
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}

export function useBulkUpdateProductStatus() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.products.bulkUpdateStatus.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate()
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}

export function useUploadProductImage() {
  return trpc.products.uploadImage.useMutation()
}

export function useBulkDeleteProducts() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.products.bulkDelete.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate()
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}
