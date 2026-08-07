import { trpc } from "@/lib/trpc/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { creativeKeys, getCreativesQueryOptions } from "./query-options"
import type { GetCreativesSchema } from "./validations"
import type { AppRouter } from "@adscrush/server"
import type { inferRouterOutputs } from "@trpc/server"

type RouterOutputs = inferRouterOutputs<AppRouter>
export type Creative = RouterOutputs["creatives"]["list"]["items"][number]

export { creativeKeys, getCreativesQueryOptions } from "./query-options"

export function useCreatives(params: GetCreativesSchema) {
  const utils = trpc.useUtils()

  return useQuery(
    getCreativesQueryOptions(params, async (p) => {
      const data = await utils.creatives.list.fetch(p)

      return {
        data: data.items,
        pageCount: data.pageCount,
        meta: { total: data.total },
      }
    })
  )
}

export function useCreative(id: string) {
  return trpc.creatives.byId.useQuery({ id })
}

export function useDeleteCreative() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.creatives.delete.useMutation({
    onSuccess: () => {
      utils.creatives.list.invalidate()
      queryClient.invalidateQueries({ queryKey: creativeKeys.all })
    },
  })
}

export function useUploadCreative() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.creatives.upload.useMutation({
    onSuccess: () => {
      utils.creatives.list.invalidate()
      queryClient.invalidateQueries({ queryKey: creativeKeys.all })
    },
  })
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(",")[1] ?? ""
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function useProductsOptions(search: string) {
  return trpc.products.options.useQuery(
    { search: search || undefined, limit: 50 },
    { enabled: true },
  )
}
