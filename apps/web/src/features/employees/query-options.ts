import { queryOptions } from "@tanstack/react-query"
import { type GetEmployeesSchema } from "./validations"

// We define the key here to ensure it's consistent
export const employeeKeys = {
  all: ["employees"] as const,
  lists: () => [...employeeKeys.all, "list"] as const,
  list: (params: GetEmployeesSchema) => [...employeeKeys.lists(), { params }] as const,
  byId: (id: string) => [...employeeKeys.all, "byId", { id }] as const,
}

/**
 * Shared query options for employees list.
 * This can be used on the server (RSC) for prefetching and on the client for fetching.
 */
export function getEmployeesQueryOptions<T>(
  params: GetEmployeesSchema,
  fetcher: (params: GetEmployeesSchema) => Promise<T>
) {
  return queryOptions({
    queryKey: employeeKeys.list(params),
    queryFn: () => fetcher(params),
    // Additional options like staleTime can be added here
    staleTime: 60 * 1000,
  })
}

/**
 * Shared query options for employee by ID.
 */
export function getEmployeeByIdQueryOptions<T>(id: string, fetcher: (id: string) => Promise<T>) {
  return queryOptions({
    queryKey: employeeKeys.byId(id),
    queryFn: () => fetcher(id),
    staleTime: 60 * 1000,
  })
}
