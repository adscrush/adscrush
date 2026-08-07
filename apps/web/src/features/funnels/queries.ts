import { trpc } from "@/lib/trpc/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  funnelKeys,
  getFunnelsQueryOptions,
  getFunnelCountsQueryOptions,
} from "./query-options"
import type { GetFunnelsSchema } from "./validations"
import type { AppRouter } from "@adscrush/server"
import type { inferRouterOutputs } from "@trpc/server"

/* ── Types ─────────────────────────────────────────────────────────── */
type RouterOutputs = inferRouterOutputs<AppRouter>
export type Funnel = RouterOutputs["funnels"]["list"]["items"][number]
export type FunnelDetail = RouterOutputs["funnels"]["byId"]

/* ── Re-exports ────────────────────────────────────────────────────── */
export { funnelKeys, getFunnelsQueryOptions } from "./query-options"

/* ── Hooks ─────────────────────────────────────────────────────────── */

export function useFunnels(params: Partial<GetFunnelsSchema> = {}) {
  const utils = trpc.useUtils()

  const searchParams: GetFunnelsSchema = {
    filterFlag: params.filterFlag ?? "commandFilters",
    page: params.page ?? 1,
    perPage: params.perPage ?? 20,
    sort: params.sort ?? [{ id: "createdAt", desc: true }],
    search: params.search ?? "",
    status: params.status ?? [],
    productId: params.productId ?? "",
    language: params.language ?? "",
    filters: params.filters ?? [],
    joinOperator: params.joinOperator ?? "and",
  }

  return useQuery(
    getFunnelsQueryOptions(searchParams, async (p) => {
      const data = await utils.funnels.list.fetch(p)

      return {
        data: data.items,
        pageCount: data.pageCount,
        meta: { total: data.total },
      }
    })
  )
}

export function useFunnelCounts() {
  const utils = trpc.useUtils()
  return useQuery(
    getFunnelCountsQueryOptions(async () => {
      return utils.funnels.counts.fetch({})
    })
  )
}

export function useFunnel(id: string, options?: { enabled?: boolean }) {
  return trpc.funnels.byId.useQuery({ id }, options)
}

export function useCreateFunnel() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()
  return trpc.funnels.create.useMutation({
    onSuccess: () => {
      utils.funnels.list.invalidate()
      queryClient.invalidateQueries({ queryKey: funnelKeys.all })
    },
  })
}

export function useUpdateFunnel() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()
  return trpc.funnels.update.useMutation({
    onSuccess: (_, variables) => {
      utils.funnels.list.invalidate()
      utils.funnels.byId.invalidate({ id: variables.id })
      queryClient.invalidateQueries({ queryKey: funnelKeys.all })
    },
  })
}

export function useDeleteFunnel() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()
  return trpc.funnels.delete.useMutation({
    onSuccess: () => {
      utils.funnels.list.invalidate()
      queryClient.invalidateQueries({ queryKey: funnelKeys.all })
    },
  })
}

export function useAddLandingPage() {
  const utils = trpc.useUtils()
  return trpc.funnels.addLandingPage.useMutation({
    onSuccess: () => {
      utils.funnels.byId.invalidate()
    },
  })
}

export function useUpdateLandingPage() {
  const utils = trpc.useUtils()
  return trpc.funnels.updateLandingPage.useMutation({
    onSuccess: () => {
      utils.funnels.byId.invalidate()
    },
  })
}

export function useDeleteLandingPage() {
  const utils = trpc.useUtils()
  return trpc.funnels.deleteLandingPage.useMutation({
    onSuccess: () => {
      utils.funnels.byId.invalidate()
    },
  })
}

export function useBulkAddLandingPages() {
  const utils = trpc.useUtils()
  return trpc.funnels.bulkAddLandingPages.useMutation({
    onSuccess: () => {
      utils.funnels.byId.invalidate()
    },
  })
}
