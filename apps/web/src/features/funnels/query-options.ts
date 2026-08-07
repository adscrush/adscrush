import { queryOptions } from "@tanstack/react-query"
import type { GetFunnelsSchema } from "./validations"

export const funnelKeys = {
  all: ["funnels"] as const,
  lists: () => [...funnelKeys.all, "list"] as const,
  list: (params: GetFunnelsSchema) =>
    [...funnelKeys.lists(), { params }] as const,
  counts: () => [...funnelKeys.all, "counts"] as const,
}

/**
 * Shared query options for the funnels list.
 * Used on the server (RSC) for prefetching and on the client for fetching.
 */
export function getFunnelsQueryOptions<T>(
  params: GetFunnelsSchema,
  fetcher: (params: GetFunnelsSchema) => Promise<T>
) {
  return queryOptions({
    queryKey: funnelKeys.list(params),
    queryFn: () => fetcher(params),
    staleTime: 60 * 1000,
  })
}

export function getFunnelCountsQueryOptions<T>(fetcher: () => Promise<T>) {
  return queryOptions({
    queryKey: funnelKeys.counts(),
    queryFn: () => fetcher(),
    staleTime: 30 * 1000,
  })
}
