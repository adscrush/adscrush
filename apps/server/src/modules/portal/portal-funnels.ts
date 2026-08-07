import { and, asc, desc, eq, sql, inArray, ilike } from "@adscrush/db/drizzle"
import {
  funnels,
  landingPages,
  languages,
  productMediaBuyers,
  products,
} from "@adscrush/db/schema"
import { z } from "zod"
import { mediaBuyerProcedure, router } from "~/lib/trpc/init"
import { filterColumns, getColumn } from "@adscrush/db/lib/filter-columns"
import { funnelOutputSchema, listFunnelsInputSchema } from "~/modules/funnels/funnels.types"

export const portalFunnelsRouter = router({
  myFunnelsList: mediaBuyerProcedure
    .input(listFunnelsInputSchema)
    .output(
      z.object({
        items: z.array(funnelOutputSchema),
        pageCount: z.number(),
        total: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, perPage, sort, filters, joinOperator, search, status, productId, language } = input
      const { db, mediaBuyer } = ctx
      const offset = (page - 1) * perPage

      // Scope to funnels linked to products assigned to this media buyer
      const assignedProducts = await db
        .select({ productId: productMediaBuyers.productId })
        .from(productMediaBuyers)
        .where(eq(productMediaBuyers.mediaBuyerId, mediaBuyer.id))

      const productIds = assignedProducts.map((p) => p.productId)

      const scopeCondition = productIds.length > 0
        ? inArray(funnels.productId, productIds)
        : eq(funnels.id, "-1")

      const tableWithJoinedColumns = {
        ...funnels,
        productName: products.name,
        languageName: languages.name,
      }

      const advancedWhere =
        filters.length > 0
          ? filterColumns({ table: tableWithJoinedColumns, filters, joinOperator, database: "postgres" })
          : undefined

      const simpleWhere =
        search || (status && status.length > 0)
          ? and(
              search ? ilike(funnels.name, `%${search}%`) : undefined,
              status && status.length > 0 ? inArray(funnels.status, status) : undefined,
              productId ? eq(funnels.productId, productId) : undefined,
              language ? eq(funnels.language, language) : undefined
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
          : [desc(funnels.createdAt)]

      // Fetch funnels
      const [items, countResult] = await Promise.all([
        db
          .select({
            id: funnels.id,
            productId: funnels.productId,
            name: funnels.name,
            language: funnels.language,
            domain: funnels.domain,
            pageUrl: funnels.pageUrl,
            thankYouPageUrl: funnels.thankYouPageUrl,
            status: funnels.status,
            createdAt: funnels.createdAt,
            updatedAt: funnels.updatedAt,
            product: {
              id: products.id,
              name: products.name,
              image: products.image,
            },
          })
          .from(funnels)
          .innerJoin(products, eq(funnels.productId, products.id))
          .where(where)
          .limit(perPage)
          .offset(offset)
          .orderBy(...orderBy),
        db
          .select({ count: sql<number>`count(*)` })
          .from(funnels)
          .innerJoin(products, eq(funnels.productId, products.id))
          .where(where),
      ])

      const total = Number(countResult[0]?.count ?? 0)

      // Fetch landing page counts
      const funnelIds = items.map((i) => i.id)
      const lpCounts =
        funnelIds.length > 0
          ? await db
              .select({
                funnelId: landingPages.funnelId,
                count: sql<number>`COUNT(*)::int`,
              })
              .from(landingPages)
              .where(inArray(landingPages.funnelId, funnelIds))
              .groupBy(landingPages.funnelId)
          : []

      const lpCountMap = new Map(lpCounts.map((r) => [r.funnelId, r.count]))

      return {
        items: items.map((item) => ({
          ...item,
          landingPagesCount: lpCountMap.get(item.id) ?? 0,
        })),
        pageCount: Math.ceil(total / perPage),
        total,
      }
    }),
})
