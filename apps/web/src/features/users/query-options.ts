import { queryOptions } from "@tanstack/react-query"
import { type GetUsersSchema } from "./validations"

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: GetUsersSchema) => [...userKeys.lists(), { params }] as const,
  byId: (id: string) => [...userKeys.all, "byId", { id }] as const,
}

/**
 * Shared query options for users list.
 * This can be used on the server (RSC) for prefetching and on the client for fetching.
 */
export function getUsersQueryOptions<T>(
  params: GetUsersSchema,
  fetcher: (params: GetUsersSchema) => Promise<T>
) {
  return queryOptions({
    queryKey: userKeys.list(params),
    queryFn: () => fetcher(params),
    staleTime: 60 * 1000,
  })
}

/**
 * Shared query options for user by ID.
 */
export function getUserByIdQueryOptions<T>(id: string, fetcher: (id: string) => Promise<T>) {
  return queryOptions({
    queryKey: userKeys.byId(id),
    queryFn: () => fetcher(id),
    staleTime: 60 * 1000,
  })
}
