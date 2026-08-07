import { trpc } from "@/lib/trpc/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { advertiserKeys, getAdvertisersQueryOptions } from "./query-options"
import type { GetAdvertisersSchema } from "./validations"
import type { AppRouter } from "@adscrush/server"
import type { inferRouterOutputs } from "@trpc/server"

/* ── Types ─────────────────────────────────────────────────────────── */
type RouterOutputs = inferRouterOutputs<AppRouter>
export type Advertiser = RouterOutputs["advertisers"]["list"]["items"][number]

/* ── Re-exports ────────────────────────────────────────────────────── */
export { advertiserKeys, getAdvertisersQueryOptions } from "./query-options"

/* ── Hooks ─────────────────────────────────────────────────────────── */

export function useAdvertisers(params: GetAdvertisersSchema) {
  const utils = trpc.useUtils()

  return useQuery(
    getAdvertisersQueryOptions(params, async (p) => {
      const data = await utils.advertisers.list.fetch(p)

      return {
        data: data.items,
        pageCount: data.pageCount,
        meta: { total: data.total },
      }
    })
  )
}

export function useAdvertiser(id: string) {
  return trpc.advertisers.byId.useQuery({ id })
}

export function useAdvertiserStatusCounts() {
  return trpc.advertisers.statusCounts.useQuery()
}

export function useDeleteAdvertiser() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.advertisers.delete.useMutation({
    onSuccess: () => {
      utils.advertisers.list.invalidate()
      queryClient.invalidateQueries({ queryKey: advertiserKeys.all })
    },
  })
}

export function useCreateAdvertiser() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.advertisers.create.useMutation({
    onSuccess: () => {
      utils.advertisers.list.invalidate()
      queryClient.invalidateQueries({ queryKey: advertiserKeys.all })
    },
  })
}

export function useUpdateAdvertiser() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.advertisers.update.useMutation({
    onSuccess: (_, variables) => {
      utils.advertisers.list.invalidate()
      utils.advertisers.byId.invalidate({ id: variables.id })
      queryClient.invalidateQueries({ queryKey: advertiserKeys.all })
    },
  })
}

export function useBulkUpdateAdvertiserStatus() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.advertisers.bulkUpdateStatus.useMutation({
    onSuccess: () => {
      utils.advertisers.list.invalidate()
      queryClient.invalidateQueries({ queryKey: advertiserKeys.all })
    },
  })
}

export function useBulkDeleteAdvertisers() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.advertisers.bulkDelete.useMutation({
    onSuccess: () => {
      utils.advertisers.list.invalidate()
      queryClient.invalidateQueries({ queryKey: advertiserKeys.all })
    },
  })
}
