import { queryOptions } from "@tanstack/react-query"
import { type GetLanguagesSchema } from "./validations"

export const languageKeys = {
  all: ["languages"] as const,
  lists: () => [...languageKeys.all, "list"] as const,
  list: (params: GetLanguagesSchema) => [...languageKeys.lists(), { params }] as const,
  allActive: () => [...languageKeys.all, "allActive"] as const,
  byId: (id: string) => [...languageKeys.all, "byId", { id }] as const,
}

export function getLanguagesQueryOptions<T>(
  params: GetLanguagesSchema,
  fetcher: (params: GetLanguagesSchema) => Promise<T>
) {
  return queryOptions({
    queryKey: languageKeys.list(params),
    queryFn: () => fetcher(params),
    staleTime: 60 * 1000,
  })
}

export function getLanguageByIdQueryOptions<T>(
  id: string,
  fetcher: (id: string) => Promise<T>
) {
  return queryOptions({
    queryKey: languageKeys.byId(id),
    queryFn: () => fetcher(id),
    staleTime: 60 * 1000,
  })
}
