import { queryOptions } from "@tanstack/react-query"
import { type GetCampaignsSchema } from "./validations"

export const campaignKeys = {
  all: ["campaigns"] as const,
  lists: () => [...campaignKeys.all, "list"] as const,
  list: (params: GetCampaignsSchema) => [...campaignKeys.lists(), { params }] as const,
  detail: (id: string) => [...campaignKeys.all, "detail", id] as const,
  stats: (id: string) => [...campaignKeys.detail(id), "stats"] as const,
}

/**
 * Shared query options for campaigns list.
 * This can be used on the server (RSC) for prefetching and on the client for fetching.
 */
export function getCampaignsQueryOptions<T>(
  params: GetCampaignsSchema,
  fetcher: (params: GetCampaignsSchema) => Promise<T>
) {
  return queryOptions({
    queryKey: campaignKeys.list(params),
    queryFn: () => fetcher(params),
    staleTime: 60 * 1000,
  })
}

export function getCampaignQueryOptions<T>(
  id: string,
  fetcher: (id: string) => Promise<T>
) {
  return queryOptions({
    queryKey: campaignKeys.detail(id),
    queryFn: () => fetcher(id),
    staleTime: 60 * 1000,
  })
}

export function getCampaignStatsQueryOptions<T>(
  campaignId: string,
  fetcher: (campaignId: string) => Promise<T>
) {
  return queryOptions({
    queryKey: campaignKeys.stats(campaignId),
    queryFn: () => fetcher(campaignId),
    staleTime: 30 * 1000,
  })
}
