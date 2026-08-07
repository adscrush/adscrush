import { and, asc, desc, eq, isNull, sql, inArray, ilike } from "@adscrush/db/drizzle"
import {
  adAccounts,
  mediaBuyers,
  users,
} from "@adscrush/db/schema"
import { z } from "zod"
import { mediaBuyerProcedure, router } from "~/lib/trpc/init"
import { filterColumns, getColumn } from "@adscrush/db/lib/filter-columns"
import { listAdAccountsInputSchema, adAccountOutputSchema } from "~/modules/ad-accounts/ad-accounts.types"

export const portalAdAccountsRouter = router({
  // ─── My Ad Accounts (simple list) ──────────────────────────────────────
  myAdAccounts: mediaBuyerProcedure.query(async ({ ctx }) => {
    const items = await ctx.db
      .select({
        id: adAccounts.id,
        name: adAccounts.name,
        sourcePlatform: adAccounts.sourcePlatform,
        accountId: adAccounts.accountId,
        status: adAccounts.status,
        createdAt: adAccounts.createdAt,
      })
      .from(adAccounts)
      .where(and(eq(adAccounts.mediaBuyerId, ctx.mediaBuyer.id), isNull(adAccounts.deletedAt)))
      .orderBy(adAccounts.name)

    return items
  }),

  // ─── My Ad Accounts (full data table) ───────────────────────────────────
  myAdAccountsList: mediaBuyerProcedure
    .input(listAdAccountsInputSchema)
    .output(
      z.object({
        items: z.array(adAccountOutputSchema),
        pageCount: z.number(),
        total: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, perPage, sort, filters, joinOperator, search, status } = input
      const { db, mediaBuyer } = ctx
      const offset = (page - 1) * perPage

      // Always scope to this media buyer's accounts
      const scopeCondition = and(eq(adAccounts.mediaBuyerId, mediaBuyer.id), isNull(adAccounts.deletedAt))

      const advancedWhere = filterColumns({
        table: adAccounts,
        filters: filters,
        joinOperator,
        database: "postgres",
      })

      const simpleWhere =
        search || (status && status.length > 0)
          ? and(
              search ? ilike(adAccounts.name, `%${search}%`) : undefined,
              status && status.length > 0 ? inArray(adAccounts.status, status) : undefined
            )
          : undefined

      const where = and(scopeCondition, filters.length > 0 ? advancedWhere : simpleWhere)

      const orderBy =
        sort.length > 0
          ? sort.map((item) => (item.desc ? desc(getColumn(adAccounts, item.id)) : asc(getColumn(adAccounts, item.id))))
          : [desc(adAccounts.createdAt)]

      const [items, countResult] = await Promise.all([
        db
          .select({
            id: adAccounts.id,
            name: adAccounts.name,
            sourcePlatform: adAccounts.sourcePlatform,
            accountId: adAccounts.accountId,
            mediaBuyerId: adAccounts.mediaBuyerId,
            mediaBuyer: {
              id: mediaBuyers.id,
              name: mediaBuyers.name,
              image: users.image,
            },
            status: adAccounts.status,
            createdAt: adAccounts.createdAt,
            updatedAt: adAccounts.updatedAt,
          })
          .from(adAccounts)
          .leftJoin(mediaBuyers, eq(adAccounts.mediaBuyerId, mediaBuyers.id))
          .leftJoin(users, eq(mediaBuyers.userId, users.id))
          .where(where)
          .limit(perPage)
          .offset(offset)
          .orderBy(...orderBy),
        db
          .select({ count: sql<number>`count(*)` })
          .from(adAccounts)
          .where(where),
      ])

      const total = Number(countResult[0]?.count ?? 0)

      return {
        items: items.map((item) => {
          const mb = item.mediaBuyer
          return {
            ...item,
            mediaBuyer: mb && typeof mb.id === "string" ? { id: mb.id, name: mb.name ?? "", image: mb.image } : null,
          }
        }),
        pageCount: Math.ceil(total / perPage),
        total,
      }
    }),
})
