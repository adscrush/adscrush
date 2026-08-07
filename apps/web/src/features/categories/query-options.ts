import { queryOptions } from "@tanstack/react-query"
import { type GetCategoriesSchema } from "./validations"

export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: (params: GetCategoriesSchema) => [...categoryKeys.lists(), { params }] as const,
  byId: (id: string) => [...categoryKeys.all, "byId", { id }] as const,
}

export function getCategoriesQueryOptions<T>(
  params: GetCategoriesSchema,
  fetcher: (params: GetCategoriesSchema) => Promise<T>
) {
  return queryOptions({
    queryKey: categoryKeys.list(params),
    queryFn: () => fetcher(params),
    staleTime: 60 * 1000,
  })
}

export function getCategoryByIdQueryOptions<T>(id: string, fetcher: (id: string) => Promise<T>) {
  return queryOptions({
    queryKey: categoryKeys.byId(id),
    queryFn: () => fetcher(id),
    staleTime: 60 * 1000,
  })
}
