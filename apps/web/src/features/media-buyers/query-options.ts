import { queryOptions } from "@tanstack/react-query"
import { type GetMediaBuyersSchema } from "./validations"

export const mediaBuyerKeys = {
  all: ["media-buyers"] as const,
  lists: () => [...mediaBuyerKeys.all, "list"] as const,
  list: (params: GetMediaBuyersSchema) => [...mediaBuyerKeys.lists(), { params }] as const,
  statusCounts: () => [...mediaBuyerKeys.all, "status-counts"] as const,
}

export function getMediaBuyersQueryOptions<T>(
  params: GetMediaBuyersSchema,
  fetcher: (params: GetMediaBuyersSchema) => Promise<T>
) {
  return queryOptions({
    queryKey: mediaBuyerKeys.list(params),
    queryFn: () => fetcher(params),
    staleTime: 60 * 1000,
  })
}
