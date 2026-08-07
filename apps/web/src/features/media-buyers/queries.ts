import { trpc } from "@/lib/trpc/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { mediaBuyerKeys, getMediaBuyersQueryOptions } from "./query-options"
import type { GetMediaBuyersSchema } from "./validations"
import type { AppRouter } from "@adscrush/server"
import type { inferRouterOutputs } from "@trpc/server"

type RouterOutputs = inferRouterOutputs<AppRouter>
export type MediaBuyer = RouterOutputs["mediaBuyers"]["list"]["items"][number]

export { mediaBuyerKeys, getMediaBuyersQueryOptions } from "./query-options"

export function useMediaBuyers(params: GetMediaBuyersSchema) {
  const utils = trpc.useUtils()

  return useQuery(
    getMediaBuyersQueryOptions(params, async (p) => {
      const data = await utils.mediaBuyers.list.fetch(p)

      return {
        data: data.items,
        pageCount: data.pageCount,
        meta: { total: data.total },
      }
    })
  )
}

export function useMediaBuyer(id: string) {
  return trpc.mediaBuyers.byId.useQuery({ id })
}

export function useMediaBuyerStatusCounts() {
  return trpc.mediaBuyers.statusCounts.useQuery()
}

export function useDeleteMediaBuyer() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.mediaBuyers.delete.useMutation({
    onSuccess: () => {
      utils.mediaBuyers.list.invalidate()
      queryClient.invalidateQueries({ queryKey: mediaBuyerKeys.all })
    },
  })
}

export function useCreateMediaBuyer() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.mediaBuyers.create.useMutation({
    onSuccess: () => {
      utils.mediaBuyers.list.invalidate()
      queryClient.invalidateQueries({ queryKey: mediaBuyerKeys.all })
    },
  })
}

export function useUpdateMediaBuyer() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.mediaBuyers.update.useMutation({
    onSuccess: (_, variables) => {
      utils.mediaBuyers.list.invalidate()
      utils.mediaBuyers.byId.invalidate({ id: variables.id })
      queryClient.invalidateQueries({ queryKey: mediaBuyerKeys.all })
    },
  })
}

export function useChangeMediaBuyerPassword() {
  return trpc.mediaBuyers.changePassword.useMutation()
}

export function useBulkUpdateMediaBuyerStatus() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.mediaBuyers.bulkUpdateStatus.useMutation({
    onSuccess: () => {
      utils.mediaBuyers.list.invalidate()
      queryClient.invalidateQueries({ queryKey: mediaBuyerKeys.all })
    },
  })
}

export function useBulkDeleteMediaBuyers() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.mediaBuyers.bulkDelete.useMutation({
    onSuccess: () => {
      utils.mediaBuyers.list.invalidate()
      queryClient.invalidateQueries({ queryKey: mediaBuyerKeys.all })
    },
  })
}
