import { queryOptions } from "@tanstack/react-query"
import { type GetAdvertisersSchema } from "./validations"

export const advertiserKeys = {
  all: ["advertisers"] as const,
  lists: () => [...advertiserKeys.all, "list"] as const,
  list: (params: GetAdvertisersSchema) => [...advertiserKeys.lists(), { params }] as const,
  statusCounts: () => [...advertiserKeys.all, "status-counts"] as const,
}

/**
 * Shared query options for advertisers list.
 * This can be used on the server (RSC) for prefetching and on the client for fetching.
 */
export function getAdvertisersQueryOptions<T>(
  params: GetAdvertisersSchema,
  fetcher: (params: GetAdvertisersSchema) => Promise<T>
) {
  return queryOptions({
    queryKey: advertiserKeys.list(params),
    queryFn: () => fetcher(params),
    staleTime: 60 * 1000,
  })
}
