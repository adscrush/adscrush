import { queryOptions } from "@tanstack/react-query"
import type { GetCreativesSchema } from "./validations"

export const creativeKeys = {
  all: ["creatives"] as const,
  lists: () => [...creativeKeys.all, "list"] as const,
  list: (params: GetCreativesSchema) =>
    [...creativeKeys.lists(), { params }] as const,
}

export function getCreativesQueryOptions<T>(
  params: GetCreativesSchema,
  fetcher: (params: GetCreativesSchema) => Promise<T>
) {
  return queryOptions({
    queryKey: creativeKeys.list(params),
    queryFn: () => fetcher(params),
    staleTime: 60 * 1000,
  })
}
