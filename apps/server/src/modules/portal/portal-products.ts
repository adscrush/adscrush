import { and, asc, desc, eq, sql, inArray, ilike } from "@adscrush/db/drizzle"
import {
  advertisers,
  categories,
  productMediaBuyers,
  products,
} from "@adscrush/db/schema"
import { z } from "zod"
import { mediaBuyerProcedure, router } from "~/lib/trpc/init"
import { filterColumns, getColumn } from "@adscrush/db/lib/filter-columns"
import { productOutputSchema, listProductsInputSchema } from "~/modules/products/products.types"

export const portalProductsRouter = router({
  myProductsList: mediaBuyerProcedure
    .input(listProductsInputSchema)
    .output(
      z.object({
        items: z.array(productOutputSchema),
        pageCount: z.number(),
        total: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, perPage, sort, filters, joinOperator, search, status, advertiserId, categoryId } = input
      const { db, mediaBuyer } = ctx
      const offset = (page - 1) * perPage

      // Scope to products assigned to this media buyer
      const assignedProducts = await db
        .select({ productId: productMediaBuyers.productId })
        .from(productMediaBuyers)
        .where(eq(productMediaBuyers.mediaBuyerId, mediaBuyer.id))

      const productIds = assignedProducts.map((p) => p.productId)

      const scopeCondition = productIds.length > 0 ? inArray(products.id, productIds) : eq(products.id, "-1")

      const tableWithJoinedColumns = {
        ...products,
        advertiserName: advertisers.name,
        categoryName: categories.name,
      }

      const advancedWhere =
        filters.length > 0
          ? filterColumns({ table: tableWithJoinedColumns, filters, joinOperator, database: "postgres" })
          : undefined

      const simpleWhere =
        search || (status && status.length > 0)
          ? and(
              search ? ilike(products.name, `%${search}%`) : undefined,
              status && status.length > 0 ? inArray(products.status, status) : undefined,
              advertiserId ? eq(products.advertiserId, advertiserId) : undefined,
              categoryId ? eq(products.categoryId, categoryId) : undefined
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
          : [desc(products.createdAt)]

      const [items, countResult] = await Promise.all([
        db
          .select({
            id: products.id,
            advertiserId: products.advertiserId,
            categoryId: products.categoryId,
            name: products.name,
            image: products.image,
            description: products.description,
            privateNote: products.privateNote,
            status: products.status,
            visibility: products.visibility,
            dailyCap: products.dailyCap,
            totalCap: products.totalCap,
            createdAt: products.createdAt,
            updatedAt: products.updatedAt,
            advertiser: {
              id: advertisers.id,
              name: advertisers.name,
            },
            category: {
              id: categories.id,
              name: categories.name,
            },
          })
          .from(products)
          .leftJoin(advertisers, eq(products.advertiserId, advertisers.id))
          .leftJoin(categories, eq(products.categoryId, categories.id))
          .where(where)
          .limit(perPage)
          .offset(offset)
          .orderBy(...orderBy),
        db
          .select({ count: sql<number>`count(*)` })
          .from(products)
          .leftJoin(advertisers, eq(products.advertiserId, advertisers.id))
          .where(where),
      ])

      const total = Number(countResult[0]?.count ?? 0)

      return {
        items,
        pageCount: Math.ceil(total / perPage),
        total,
      }
    }),
})
