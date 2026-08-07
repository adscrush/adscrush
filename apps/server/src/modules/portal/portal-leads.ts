import { and, or, asc, desc, eq, gte, lte, sql, inArray, ilike } from "@adscrush/db/drizzle"
import {
  campaigns,
  leads,
  products,
} from "@adscrush/db/schema"
import { z } from "zod"
import { csvEscape } from "@adscrush/shared/lib/csv"
import { maskLeadPii } from "@adscrush/shared/lib/mask"
import { mediaBuyerProcedure, router } from "~/lib/trpc/init"
import { filterColumns } from "@adscrush/db/lib/filter-columns"
import type { ExtendedColumnFilter } from "@adscrush/shared/types/data-table"

export const portalLeadsRouter = router({
  // ─── My Leads (dedicated leads table) ───────────────────────────────────
  myLeads: mediaBuyerProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        perPage: z.number().int().min(1).max(100).default(50),
        search: z.string().optional(),
        status: z.array(z.string()).optional(),
        productId: z.string().optional(),
        campaignId: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        sort: z.string().optional(),
        sortDir: z.enum(["asc", "desc"]).optional(),
        filters: z.array(z.any()).default([]),
        joinOperator: z.enum(["and", "or"]).default("and"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, perPage, search, status, productId, campaignId, dateFrom, dateTo, sort, sortDir, filters, joinOperator } = input
      const { db, mediaBuyer } = ctx
      const offset = (page - 1) * perPage

      // Scope: only leads belonging to this media buyer
      const scopeCondition = eq(leads.mediaBuyerId, mediaBuyer.id)

      const conditions = and(
        scopeCondition,
        search
          ? or(
              ilike(leads.id, `%${search}%`),
              ilike(leads.tid, `%${search}%`),
              ilike(leads.name, `%${search}%`),
              ilike(leads.phone, `%${search}%`),
              ilike(leads.email, `%${search}%`),
              ilike(leads.address, `%${search}%`),
              ilike(leads.city, `%${search}%`),
              ilike(leads.pincode, `%${search}%`),
              ilike(leads.state, `%${search}%`),
              ilike(products.name, `%${search}%`),
              ilike(campaigns.name, `%${search}%`),
            )
          : undefined,
        status && status.length > 0 ? inArray(leads.status, status as ("pending" | "approved" | "rejected")[]) : undefined,
        productId ? eq(leads.productId, productId) : undefined,
        campaignId ? eq(leads.campaignId, campaignId) : undefined,
        dateFrom ? gte(leads.createdAt, new Date(dateFrom)) : undefined,
        dateTo ? lte(leads.createdAt, new Date(dateTo)) : undefined,
      )

      // Advanced filter support via DataTableFilterMenu
      const tableWithJoinedColumns = {
        ...leads,
        productName: products.name,
        campaignName: campaigns.name,
      }
      const advancedWhere =
        filters.length > 0
          ? filterColumns({
              table: tableWithJoinedColumns,
              filters: filters as ExtendedColumnFilter<unknown>[],
              joinOperator,
              database: "postgres",
            })
          : undefined

      const finalWhere = filters.length > 0 ? and(scopeCondition, advancedWhere) : conditions

      // Whitelist allowed sort columns to prevent SQL injection
      const sortColumn = sort === "payout" ? leads.payout : sort === "status" ? leads.status : leads.createdAt
      const orderBy = sortDir === "asc" ? asc(sortColumn) : desc(sortColumn)

      const [items, countResult] = await Promise.all([
        db
          .select({
            id: leads.id,
            tid: leads.tid,
            name: leads.name,
            phone: leads.phone,
            email: leads.email,
            address: leads.address,
            pincode: leads.pincode,
            city: leads.city,
            state: leads.state,
            sub1: leads.sub1,
            sub2: leads.sub2,
            sub3: leads.sub3,
            sub4: leads.sub4,
            sub5: leads.sub5,
            payout: leads.payout,
            status: leads.status,
            currency: leads.currency,
            campaignId: leads.campaignId,
            geoCountry: leads.geoCountry,
            method: leads.method,
            createdAt: leads.createdAt,
            product: { id: products.id, name: products.name },
            campaign: { id: campaigns.id, name: campaigns.name },
          })
          .from(leads)
          .innerJoin(products, eq(leads.productId, products.id))
          .leftJoin(campaigns, eq(leads.campaignId, campaigns.id))
          .where(finalWhere)
          .orderBy(orderBy)
          .limit(perPage)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(leads)
          .innerJoin(products, eq(leads.productId, products.id))
          .leftJoin(campaigns, eq(leads.campaignId, campaigns.id))
          .where(finalWhere),
      ])

      const total = Number(countResult[0]?.count ?? 0)

      return {
        items: items.map((item) =>
          maskLeadPii(
            {
              ...item,
              payout: String(item.payout),
            },
            // Media buyers never bypass lead PII masking.
            false
          )
        ),
        total,
        pageCount: Math.ceil(total / perPage),
      }
    }),

  // ─── My Leads Export ────────────────────────────────────────────────────
  myLeadsExport: mediaBuyerProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.array(z.string()).optional(),
        productId: z.string().optional(),
        campaignId: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        filters: z.array(z.any()).default([]),
        joinOperator: z.enum(["and", "or"]).default("and"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { db, mediaBuyer } = ctx

      const scopeCondition = eq(leads.mediaBuyerId, mediaBuyer.id)

      const conditions = and(
        scopeCondition,
        input.search
          ? or(
              ilike(leads.id, `%${input.search}%`),
              ilike(leads.tid, `%${input.search}%`),
              ilike(leads.name, `%${input.search}%`),
            )
          : undefined,
        input.status && input.status.length > 0
          ? inArray(leads.status, input.status as ("pending" | "approved" | "rejected")[])
          : undefined,
        input.productId ? eq(leads.productId, input.productId) : undefined,
        input.campaignId ? eq(leads.campaignId, input.campaignId) : undefined,
        input.dateFrom ? gte(leads.createdAt, new Date(input.dateFrom)) : undefined,
        input.dateTo ? lte(leads.createdAt, new Date(input.dateTo)) : undefined,
      )

      // Support advanced filters for export too
      const tableWithJoinedColumns = {
        ...leads,
        productName: products.name,
        campaignName: campaigns.name,
      }
      const advancedWhere =
        input.filters && input.filters.length > 0
          ? filterColumns({
              table: tableWithJoinedColumns,
              filters: input.filters as ExtendedColumnFilter<unknown>[],
              joinOperator: input.joinOperator,
              database: "postgres",
            })
          : undefined

      const finalWhere = input.filters && input.filters.length > 0 ? and(scopeCondition, advancedWhere) : conditions

      const rows = await db
        .select({
          id: leads.id,
          tid: leads.tid,
          name: leads.name,
          phone: leads.phone,
          email: leads.email,
          address: leads.address,
          pincode: leads.pincode,
          city: leads.city,
          state: leads.state,
          status: leads.status,
          payout: leads.payout,
          currency: leads.currency,
          productName: products.name,
          campaignName: campaigns.name,
          geoCountry: leads.geoCountry,
          sub1: leads.sub1,
          sub2: leads.sub2,
          sub3: leads.sub3,
          sub4: leads.sub4,
          sub5: leads.sub5,
          createdAt: leads.createdAt,
        })
        .from(leads)
        .innerJoin(products, eq(leads.productId, products.id))
        .leftJoin(campaigns, eq(leads.campaignId, campaigns.id))
        .where(finalWhere)
        .limit(100000)
        .orderBy(desc(leads.createdAt))

      const header = "ID,Click ID,Name,Phone,Email,Address,City,State,Pincode,Status,Payout,Currency,Product,Campaign,Country,Sub1,Sub2,Sub3,Sub4,Sub5,Date\n"
      const csvRows = rows.map((r) => {
        const m = maskLeadPii(r, false)
        return [r.id, r.tid, m.name ?? "", m.phone ?? "", m.email ?? "", m.address ?? "", m.city ?? "", m.state ?? "", m.pincode ?? "", m.status, m.payout, m.currency, m.productName, m.campaignName ?? "", m.geoCountry ?? "", m.sub1 ?? "", m.sub2 ?? "", m.sub3 ?? "", m.sub4 ?? "", m.sub5 ?? "", r.createdAt?.toISOString() ?? ""]
          .map(csvEscape)
          .join(",")
      }).join("\n")

      return header + csvRows
    }),
})
