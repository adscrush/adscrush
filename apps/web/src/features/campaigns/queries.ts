import { trpc } from "@/lib/trpc/client"
import type { AppRouter } from "@adscrush/server"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { inferRouterOutputs } from "@trpc/server"
import {
  campaignKeys,
  getCampaignQueryOptions,
  getCampaignStatsQueryOptions,
  getCampaignsQueryOptions,
} from "./query-options"
import { type GetCampaignsSchema } from "./validations"

/* ── Types ─────────────────────────────────────────────────────────── */
type RouterOutputs = inferRouterOutputs<AppRouter>
export type Campaign = RouterOutputs["campaigns"]["list"]["items"][number]
export type CampaignDetail = RouterOutputs["campaigns"]["byId"]
export type CampaignStats = RouterOutputs["campaigns"]["getStats"]

/* ── Re-exports ────────────────────────────────────────────────────── */
export {
  campaignKeys,
  getCampaignQueryOptions,
  getCampaignStatsQueryOptions,
  getCampaignsQueryOptions,
} from "./query-options"

/* ── Hooks ─────────────────────────────────────────────────────────── */

export function useCampaigns(params: GetCampaignsSchema) {
  const utils = trpc.useUtils()

  return useQuery(
    getCampaignsQueryOptions(params, async (p) => {
      const data = await utils.campaigns.list.fetch(p)

      return {
        data: data.items,
        pageCount: data.pageCount,
        meta: { total: data.total },
      }
    })
  )
}

export function useCampaign(id: string, options?: { enabled?: boolean }) {
  const utils = trpc.useUtils()
  return useQuery({
    ...getCampaignQueryOptions(id, async (campaignId) => {
      const data = await utils.campaigns.byId.fetch({ id: campaignId })
      return { data }
    }),
    ...options,
  })
}

export function useCampaignStats(campaignId: string, options?: { enabled?: boolean }) {
  const utils = trpc.useUtils()
  return useQuery({
    ...getCampaignStatsQueryOptions(campaignId, async (id) => {
      const data = await utils.campaigns.getStats.fetch({ campaignId: id })
      return { data }
    }),
    ...options,
  })
}

export function useCampaignAdAccounts(campaignId: string, options?: { enabled?: boolean }) {
  const utils = trpc.useUtils()
  return useQuery({
    queryKey: [...campaignKeys.detail(campaignId), "adAccounts"] as const,
    queryFn: async () => {
      const data = await utils.campaigns.getAdAccounts.fetch({ campaignId })
      return { data }
    },
    staleTime: 60 * 1000,
    ...options,
  })
}

export function useCampaignAdAccountsFull(
  campaignId: string,
  params: { search?: string; filter?: "all" | "assigned"; mediaBuyerIds?: string[]; page: number; perPage: number },
  options?: { enabled?: boolean }
) {
  const utils = trpc.useUtils()
  return useQuery({
    queryKey: [...campaignKeys.detail(campaignId), "adAccountsFull", params] as const,
    queryFn: async () => {
      const data = await utils.campaigns.getAllAdAccountsWithAssignment.fetch({
        campaignId,
        ...params,
      })
      return data
    },
    staleTime: 30_000,
    ...options,
  })
}

/* ── Mutation Hooks ────────────────────────────────────────────────── */

export function useCreateCampaign() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.campaigns.create.useMutation({
    onSuccess: () => {
      utils.campaigns.list.invalidate()
      queryClient.invalidateQueries({ queryKey: campaignKeys.all })
    },
  })
}

export function useUpdateCampaign() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.campaigns.update.useMutation({
    onSuccess: (_, variables) => {
      utils.campaigns.list.invalidate()
      utils.campaigns.byId.invalidate({ id: variables.id })
      queryClient.invalidateQueries({ queryKey: campaignKeys.all })
    },
  })
}

export function useDeleteCampaign() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.campaigns.delete.useMutation({
    onSuccess: () => {
      utils.campaigns.list.invalidate()
      queryClient.invalidateQueries({ queryKey: campaignKeys.all })
    },
  })
}

export function useAssignAdAccount() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.campaigns.assignAdAccount.useMutation({
    onSuccess: (_, variables) => {
      utils.campaigns.byId.invalidate({ id: variables.campaignId })
      utils.campaigns.getAdAccounts.invalidate({ campaignId: variables.campaignId })
      utils.campaigns.getAllAdAccountsWithAssignment.invalidate({ campaignId: variables.campaignId })
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.campaignId) })
    },
  })
}

export function useRemoveAdAccount() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.campaigns.removeAdAccount.useMutation({
    onSuccess: (_, variables) => {
      utils.campaigns.byId.invalidate({ id: variables.campaignId })
      utils.campaigns.getAdAccounts.invalidate({ campaignId: variables.campaignId })
      utils.campaigns.getAllAdAccountsWithAssignment.invalidate({ campaignId: variables.campaignId })
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.campaignId) })
    },
  })
}

export function useCampaignCreatives(campaignId: string, options?: { enabled?: boolean }) {
  const utils = trpc.useUtils()
  return useQuery({
    queryKey: [...campaignKeys.detail(campaignId), "creatives"] as const,
    queryFn: async () => {
      const data = await utils.campaigns.getCreatives.fetch({ campaignId })
      return { data }
    },
    staleTime: 60 * 1000,
    ...options,
  })
}

export function useSyncCreatives() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.campaigns.syncCreatives.useMutation({
    onSuccess: (_, variables) => {
      utils.campaigns.getCreatives.invalidate({ campaignId: variables.campaignId })
      queryClient.invalidateQueries({
        queryKey: [...campaignKeys.detail(variables.campaignId), "creatives"],
      })
    },
  })
}

export function useRegenerateTrackingLinks() {
  const utils = trpc.useUtils()

  return trpc.campaigns.regenerateTrackingLinks.useMutation({
    onSuccess: () => {
      // Invalidate all ad account queries to refresh tracking links
      utils.campaigns.getAdAccounts.invalidate()
    },
  })
}
