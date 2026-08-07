import { queryOptions } from "@tanstack/react-query"
import type { GetProductsSchema } from "./validations"

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: GetProductsSchema) =>
    [...productKeys.lists(), { params }] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
}

export function getProductsQueryOptions<T>(
  params: GetProductsSchema,
  fetcher: (params: GetProductsSchema) => Promise<T>
) {
  return queryOptions({
    queryKey: productKeys.list(params),
    queryFn: () => fetcher(params),
    staleTime: 60 * 1000,
  })
}

export function getProductByIdQueryOptions<T>(
  id: string,
  fetcher: (id: string) => Promise<T>
) {
  return queryOptions({
    queryKey: productKeys.detail(id),
    queryFn: () => fetcher(id),
    staleTime: 60 * 1000,
  })
}
