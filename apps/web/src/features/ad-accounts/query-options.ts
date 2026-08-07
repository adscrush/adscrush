import { keepPreviousData, queryOptions } from "@tanstack/react-query"
import { type GetAdAccountsSchema } from "./validations"

export const adAccountKeys = {
  all: ["adAccounts"] as const,
  lists: () => [...adAccountKeys.all, "list"] as const,
  list: (params: GetAdAccountsSchema) => [...adAccountKeys.lists(), { params }] as const,
}

export function getAdAccountsQueryOptions<T>(
  params: GetAdAccountsSchema,
  fetcher: (params: GetAdAccountsSchema) => Promise<T>
) {
  return queryOptions({
    queryKey: adAccountKeys.list(params),
    queryFn: () => fetcher(params),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  })
}
