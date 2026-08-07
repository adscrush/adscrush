import { trpc } from "@/lib/trpc/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useDebouncedValue } from "@tanstack/react-pacer"
import { adAccountKeys, getAdAccountsQueryOptions } from "./query-options"
import type { GetAdAccountsSchema } from "./validations"
import type { AppRouter } from "@adscrush/server"
import type { inferRouterOutputs } from "@trpc/server"

type RouterOutputs = inferRouterOutputs<AppRouter>
export type AdAccount = RouterOutputs["adAccounts"]["list"]["items"][number]

export { adAccountKeys, getAdAccountsQueryOptions } from "./query-options"

export function useAdAccounts(params: GetAdAccountsSchema) {
  const utils = trpc.useUtils()

  const [debouncedParams] = useDebouncedValue(params, { wait: 300 })

  return useQuery(
    getAdAccountsQueryOptions(debouncedParams, async (p) => {
      const data = await utils.adAccounts.list.fetch(p)

      return {
        data: data.items,
        pageCount: data.pageCount,
        meta: { total: data.total },
      }
    })
  )
}

export function useAdAccount(id: string) {
  return trpc.adAccounts.byId.useQuery({ id })
}

export function useCreateAdAccount() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.adAccounts.create.useMutation({
    onSuccess: () => {
      utils.adAccounts.list.invalidate()
      queryClient.invalidateQueries({ queryKey: adAccountKeys.all })
    },
  })
}

export function useUpdateAdAccount() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.adAccounts.update.useMutation({
    onSuccess: (_, variables) => {
      utils.adAccounts.list.invalidate()
      utils.adAccounts.byId.invalidate({ id: variables.id })
      queryClient.invalidateQueries({ queryKey: adAccountKeys.all })
    },
  })
}

export function useDeleteAdAccount() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.adAccounts.delete.useMutation({
    onSuccess: () => {
      utils.adAccounts.list.invalidate()
      queryClient.invalidateQueries({ queryKey: adAccountKeys.all })
    },
  })
}

export function useImportAdAccounts() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.adAccounts.bulkImport.useMutation({
    onSuccess: () => {
      utils.adAccounts.list.invalidate()
      queryClient.invalidateQueries({ queryKey: adAccountKeys.all })
    },
  })
}

export function useBulkUpdateAdAccountStatus() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.adAccounts.bulkUpdateStatus.useMutation({
    onSuccess: () => {
      utils.adAccounts.list.invalidate()
      queryClient.invalidateQueries({ queryKey: adAccountKeys.all })
    },
  })
}

export function useBulkUpdateAdAccountMediaBuyer() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.adAccounts.bulkUpdateMediaBuyer.useMutation({
    onSuccess: () => {
      utils.adAccounts.list.invalidate()
      queryClient.invalidateQueries({ queryKey: adAccountKeys.all })
    },
  })
}

export function useBulkDeleteAdAccounts() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.adAccounts.bulkDelete.useMutation({
    onSuccess: () => {
      utils.adAccounts.list.invalidate()
      queryClient.invalidateQueries({ queryKey: adAccountKeys.all })
    },
  })
}
