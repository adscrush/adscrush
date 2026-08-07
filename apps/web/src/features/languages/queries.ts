import { trpc } from "@/lib/trpc/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  languageKeys,
  getLanguagesQueryOptions,
  getLanguageByIdQueryOptions,
} from "./query-options"
import { type GetLanguagesSchema } from "./validations"
import type { AppRouter } from "@adscrush/server"
import type { inferRouterOutputs } from "@trpc/server"

type RouterOutputs = inferRouterOutputs<AppRouter>
export type Language = RouterOutputs["languages"]["list"]["items"][number]

export { languageKeys } from "./query-options"

export function useLanguages(params: GetLanguagesSchema) {
  const utils = trpc.useUtils()

  return useQuery(
    getLanguagesQueryOptions(params, async (p) => {
      const data = await utils.languages.list.fetch(p)
      return {
        data: data.items,
        pageCount: data.pageCount,
        meta: { total: data.total },
      }
    })
  )
}

export function useAllLanguages() {
  const utils = trpc.useUtils()

  return useQuery(
    getLanguagesQueryOptions(
      {
        page: 1,
        perPage: 100,
        sort: [{ id: "name", desc: false }],
        filters: [],
        joinOperator: "and",
        search: "",
        filterFlag: "commandFilters",
      } as GetLanguagesSchema,
      async (p) => {
        const data = await utils.languages.list.fetch(p)
        return data.items
      }
    )
  )
}

export function useLanguage(id: string) {
  const utils = trpc.useUtils()

  return useQuery(
    getLanguageByIdQueryOptions(id, async (id) => {
      return await utils.languages.byId.fetch({ id })
    })
  )
}

export function useDeleteLanguage() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.languages.delete.useMutation({
    onSuccess: () => {
      utils.languages.list.invalidate()
      queryClient.invalidateQueries({ queryKey: languageKeys.all })
    },
  })
}

export function useCreateLanguage() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.languages.create.useMutation({
    onSuccess: () => {
      utils.languages.list.invalidate()
      queryClient.invalidateQueries({ queryKey: languageKeys.all })
    },
  })
}

export function useUpdateLanguage() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.languages.update.useMutation({
    onSuccess: (_, variables) => {
      utils.languages.list.invalidate()
      utils.languages.byId.invalidate({ id: variables.id })
      queryClient.invalidateQueries({ queryKey: languageKeys.all })
    },
  })
}

export function useBulkDeleteLanguages() {
  const utils = trpc.useUtils()
  const queryClient = useQueryClient()

  return trpc.languages.bulkDelete.useMutation({
    onSuccess: () => {
      utils.languages.list.invalidate()
      queryClient.invalidateQueries({ queryKey: languageKeys.all })
    },
  })
}
