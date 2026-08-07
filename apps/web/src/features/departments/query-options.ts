import { queryOptions } from "@tanstack/react-query"
import { type GetDepartmentsSchema } from "./validations"

export const departmentKeys = {
  all: ["departments"] as const,
  lists: () => [...departmentKeys.all, "list"] as const,
  list: (params: GetDepartmentsSchema) => [...departmentKeys.lists(), { params }] as const,
  byId: (id: string) => [...departmentKeys.all, "byId", { id }] as const,
}

export function getDepartmentsQueryOptions<T>(
  params: GetDepartmentsSchema,
  fetcher: (params: GetDepartmentsSchema) => Promise<T>
) {
  return queryOptions({
    queryKey: departmentKeys.list(params),
    queryFn: () => fetcher(params),
    staleTime: 60 * 1000,
  })
}

export function getDepartmentByIdQueryOptions<T>(id: string, fetcher: (id: string) => Promise<T>) {
  return queryOptions({
    queryKey: departmentKeys.byId(id),
    queryFn: () => fetcher(id),
    staleTime: 60 * 1000,
  })
}
