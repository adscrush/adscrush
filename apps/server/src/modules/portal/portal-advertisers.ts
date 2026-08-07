import { and, asc, desc, eq, sql, inArray, ilike } from "@adscrush/db/drizzle"
import {
  advertisers,
  employees,
  productMediaBuyers,
  products,
  users,
} from "@adscrush/db/schema"
import { z } from "zod"
import { mediaBuyerProcedure, router } from "~/lib/trpc/init"
import { filterColumns, getColumn } from "@adscrush/db/lib/filter-columns"
import { advertiserOutputSchema, listAdvertisersInputSchema } from "~/modules/advertisers/advertisers.types"

export const portalAdvertisersRouter = router({
  myAdvertisersList: mediaBuyerProcedure
    .input(listAdvertisersInputSchema)
    .output(
      z.object({
        items: z.array(advertiserOutputSchema),
        pageCount: z.number(),
        total: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, perPage, sort, filters, joinOperator, search, status } = input
      const { db, mediaBuyer } = ctx
      const offset = (page - 1) * perPage

      // Scope to advertisers whose products are assigned to this media buyer
      const assignedProducts = await db
        .select({ productId: productMediaBuyers.productId })
        .from(productMediaBuyers)
        .where(eq(productMediaBuyers.mediaBuyerId, mediaBuyer.id))

      const productIds = assignedProducts.map((p) => p.productId)

      let advertiserIds: string[] = []
      if (productIds.length > 0) {
        const prodRows = await db
          .select({ advertiserId: products.advertiserId })
          .from(products)
          .where(inArray(products.id, productIds))
        advertiserIds = [...new Set(prodRows.map((p) => p.advertiserId))]
      }

      const scopeCondition =
        advertiserIds.length > 0 ? inArray(advertisers.id, advertiserIds) : eq(advertisers.id, "-1")

      const tableWithJoinedColumns = {
        ...advertisers,
        accountManagerName: users.name,
      }

      const advancedWhere =
        filters.length > 0
          ? filterColumns({ table: tableWithJoinedColumns, filters, joinOperator, database: "postgres" })
          : undefined

      const simpleWhere =
        search || (status && status.length > 0)
          ? and(
              search ? ilike(advertisers.name, `%${search}%`) : undefined,
              status && status.length > 0 ? inArray(advertisers.status, status) : undefined
            )
          : undefined

      const where = and(scopeCondition, filters.length > 0 ? advancedWhere : simpleWhere)

      const orderBy =
        sort.length > 0
          ? sort.map((item) =>
              item.desc
                ? desc(getColumn(tableWithJoinedColumns, item.id))
                : asc(getColumn(tableWithJoinedColumns, item.id))
            )
          : [desc(advertisers.createdAt)]

      const [items, countResult] = await Promise.all([
        db
          .select({
            id: advertisers.id,
            userId: advertisers.userId,
            name: advertisers.name,
            companyName: advertisers.companyName,
            email: advertisers.email,
            website: advertisers.website,
            country: advertisers.country,
            phoneNumber: advertisers.phoneNumber,
            billingAddress: advertisers.billingAddress,
            paymentTermsDays: advertisers.paymentTermsDays,
            internalNotes: advertisers.internalNotes,
            accountManagerId: advertisers.accountManagerId,
            status: advertisers.status,
            createdAt: advertisers.createdAt,
            updatedAt: advertisers.updatedAt,
            accountManager: {
              id: employees.id,
              name: users.name,
              email: users.email,
              image: users.image,
            },
          })
          .from(advertisers)
          .leftJoin(employees, eq(advertisers.accountManagerId, employees.id))
          .leftJoin(users, eq(employees.userId, users.id))
          .where(where)
          .limit(perPage)
          .offset(offset)
          .orderBy(...orderBy),
        db
          .select({ count: sql<number>`count(*)` })
          .from(advertisers)
          .where(where),
      ])

      const total = Number(countResult[0]?.count ?? 0)

      return {
        items: items.map((item) => {
          const am = item.accountManager
          return {
            ...item,
            accountManager:
              am && typeof am.id === "string" ? { id: am.id, name: am.name, email: am.email, image: am.image } : null,
          }
        }),
        pageCount: Math.ceil(total / perPage),
        total,
      }
    }),
})
