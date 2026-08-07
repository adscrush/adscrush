import { trpc } from "@/lib/trpc/client"
import { getUsersQueryOptions, getUserByIdQueryOptions } from "./query-options"
import { useQuery } from "@tanstack/react-query"
import type { GetUsersSchema } from "./validations"
import type { AppRouter } from "@adscrush/server"
import type { inferRouterOutputs } from "@trpc/server"

/* ── Types ─────────────────────────────────────────────────────────── */
type RouterOutputs = inferRouterOutputs<AppRouter>
export type User = RouterOutputs["users"]["list"]["items"][number]
export type UserDetail = RouterOutputs["users"]["byId"]

/* ── Re-exports ────────────────────────────────────────────────────── */
export { getUsersQueryOptions, getUserByIdQueryOptions } from "./query-options"
export { userKeys } from "./query-options"

/* ── Mutations ─────────────────────────────────────────────────────── */

export function useRevokeSession() {
  return trpc.users.revokeSession.useMutation()
}

export function useUpdateUserRole() {
  const utils = trpc.useUtils()

  return trpc.users.updateRole.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate()
    },
  })
}

/* ── Hooks ─────────────────────────────────────────────────────────── */

export function useUser(id: string) {
  const utils = trpc.useUtils()

  return useQuery(
    getUserByIdQueryOptions(id, async (id) => {
      return await utils.users.byId.fetch({ id })
    })
  )
}

export function useUsers(params: GetUsersSchema) {
  const utils = trpc.useUtils()

  return useQuery(
    getUsersQueryOptions(params, async (p) => {
      const data = await utils.users.list.fetch(p)

      return {
        data: data.items,
        pageCount: data.pageCount,
        meta: { total: data.total },
      }
    })
  )
}
