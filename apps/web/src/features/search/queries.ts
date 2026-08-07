import { trpc } from "@/lib/trpc/client"

export const searchKeys = {
  all: ["search"] as const,
  employees: (q: string) => [...searchKeys.all, "employees", q] as const,
  mediaBuyers: (q: string) => [...searchKeys.all, "mediaBuyers", q] as const,
  advertisers: (q: string) => [...searchKeys.all, "advertisers", q] as const,
}

export function useEmployeeSearch(q: string) {
  return trpc.employees.search.useQuery(
    { q },
    {
      enabled: q.length >= 0,
    }
  )
}

export function useMediaBuyerSearch(q: string) {
  return trpc.mediaBuyers.search.useQuery(
    { q },
    {
      enabled: q.length >= 0,
    }
  )
}

export function useAdvertiserSearch(q: string) {
  return trpc.advertisers.search.useQuery(
    { q },
    {
      enabled: q.length >= 0,
    }
  )
}
