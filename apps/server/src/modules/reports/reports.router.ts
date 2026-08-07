import { and, asc, desc, eq, gte, ilike, isNotNull, isNull, lte, or, sql, inArray, type AnyColumn } from "@adscrush/db/drizzle"
import {
  advertisers,
  mediaBuyers,
  clicks,
  conversions,
  products,
  funnels,
  landingPages,
} from "@adscrush/db/schema"
import { filterColumns } from "@adscrush/db/lib/filter-columns"
import type { ExtendedColumnFilter } from "@adscrush/shared/types/data-table"
import {
  getRange,
  safeDecryptIp,
  resolveLandingPageFilters,
  KPI_FILTER_TABLE,
  TOP_FIELD_SELF_GROUP,
  TOP_FIELD_COL_MAP,
  rowGroupKey,
  runOverviewQuery,
  runTrendQuery,
  runPerformanceQuery,
  runPerformanceCountQuery,
  type TopField,
} from "~/lib/report-utils"
import { getScope } from "~/lib/scope"
import { permissionProcedure, router } from "~/lib/trpc/init"
import { csvEscape } from "@adscrush/shared/lib/csv"
import z from "zod"
import {
  reportBaseQuerySchema,
  reportPerformanceQuerySchema,
  reportPerformanceCountQuerySchema,
  clickLogInputSchema,
  clickLogOptionsInputSchema,
  conversionLogInputSchema,
  conversionLogOptionsInputSchema,
  reportExportInputSchema,
} from "./reports.types"

export const reportsRouter = router({
  overview: permissionProcedure("report.view")
    .input(reportBaseQuerySchema)
    .query(async ({ ctx, input }) => {
      const { period, dateFrom, dateTo, productId, mediaBuyerId, advertiserId } = input
      const { db, user } = ctx

      const scope = await getScope(db, user.id, user.role)
      const { start, end } = getRange(period, dateFrom, dateTo)

      const advertiserConditions = !scope.isAllAdvertisers
        ? inArray(products.advertiserId, scope.advertiserIds.length > 0 ? scope.advertiserIds : ["-1"])
        : undefined

      const mediaBuyerConditions = !scope.isAllMediaBuyers
        ? inArray(clicks.mediaBuyerId, scope.mediaBuyerIds.length > 0 ? scope.mediaBuyerIds : ["-1"])
        : undefined

      const commonConditions = and(
        gte(clicks.createdAt, start),
        lte(clicks.createdAt, end),
        productId ? eq(clicks.productId, productId) : undefined,
        mediaBuyerId ? eq(clicks.mediaBuyerId, mediaBuyerId) : undefined,
        advertiserId ? eq(products.advertiserId, advertiserId) : undefined,
        advertiserConditions,
        mediaBuyerConditions
      )

      return await runOverviewQuery(db, commonConditions)
    }),

  performance: permissionProcedure("report.view")
    .input(reportPerformanceQuerySchema)
    .query(async ({ ctx, input }) => {
      const { period, dateFrom, dateTo, productId, mediaBuyerId, advertiserId, groupBy, page, perPage, search, sortBy, sortDir, topFields, breakdownBy, filters, joinOperator } = input
      const { db, user } = ctx

      const scope = await getScope(db, user.id, user.role)
      const { start, end } = getRange(period, dateFrom, dateTo)

      const advertiserConditions = !scope.isAllAdvertisers
        ? inArray(products.advertiserId, scope.advertiserIds.length > 0 ? scope.advertiserIds : ["-1"])
        : undefined

      const mediaBuyerConditions = !scope.isAllMediaBuyers
        ? inArray(clicks.mediaBuyerId, scope.mediaBuyerIds.length > 0 ? scope.mediaBuyerIds : ["-1"])
        : undefined

      const resolvedFilters = await resolveLandingPageFilters(db, filters)

      const filterConditions = resolvedFilters && resolvedFilters.length > 0
        ? filterColumns({
            table: KPI_FILTER_TABLE,
            filters: resolvedFilters as ExtendedColumnFilter<typeof KPI_FILTER_TABLE>[],
            joinOperator,
            database: "postgres",
          })
        : undefined

      const commonConditions = and(
        gte(clicks.createdAt, start),
        lte(clicks.createdAt, end),
        productId ? eq(clicks.productId, productId) : undefined,
        mediaBuyerId ? eq(clicks.mediaBuyerId, mediaBuyerId) : undefined,
        advertiserId ? eq(products.advertiserId, advertiserId) : undefined,
        advertiserConditions,
        mediaBuyerConditions,
        filterConditions
      )

      const perfResult = await runPerformanceQuery({
        db,
        conditions: commonConditions,
        groupBy,
        page,
        perPage,
        search,
        sortBy,
        sortDir,
        breakdownBy,
        useAdvertiserTable: true,
        spendStart: start,
        spendEnd: end,
      })
      let { mapped } = perfResult
      const { idCol, joinTable, joinCond } = perfResult

      // IP decryption for IP groupBy
      if (groupBy === "ip") {
        const ipHashes = mapped.map((r) => r.id).filter((v): v is string => Boolean(v))
        if (ipHashes.length > 0) {
          const samples = await db
            .select({ ipHash: clicks.ipHash, ipEncrypted: sql<string>`max(${clicks.ipEncrypted})` })
            .from(clicks)
            .where(inArray(clicks.ipHash, ipHashes))
            .groupBy(clicks.ipHash)
          const ipMap = new Map<string, string>()
          await Promise.all(
            samples.map(async (s) => {
              if (!s.ipHash) return
              const decrypted = await safeDecryptIp(s.ipEncrypted)
              if (decrypted) ipMap.set(s.ipHash, decrypted)
            }),
          )
          for (const r of mapped) {
            if (r.id && ipMap.has(r.id)) r.name = ipMap.get(r.id)!
          }
        }
      }

      // Top field resolution
      const requestedTopFields = [...new Set(topFields ?? [])]
      if (requestedTopFields.length > 0 && mapped.length > 0) {
        const groupIds = [
          ...new Set(
            mapped.map((r) => r.id).filter((v): v is string => typeof v === "string" && v.length > 0),
          ),
        ]
        const hasNullGroup = mapped.some((r) => r.id === null)

        if (groupIds.length > 0 || hasNullGroup) {
          const groupFilter = hasNullGroup
            ? groupIds.length > 0
              ? or(inArray(idCol, groupIds), isNull(idCol))
              : isNull(idCol)
            : inArray(idCol, groupIds)

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fetchTopValues = async (dimCol: any): Promise<Map<string, string | null>> => {
            const topQuery = db
              .select({ groupId: idCol, value: dimCol, cnt: sql<number>`count(*)` })
              .from(clicks)
              .innerJoin(products, eq(clicks.productId, products.id))
            if (joinTable && joinCond) topQuery.leftJoin(joinTable, joinCond)
            const dimRows = await topQuery
              .where(and(commonConditions, groupFilter, isNotNull(dimCol)))
              .groupBy(idCol, dimCol)
            const best = new Map<string, { value: string; cnt: number }>()
            for (const row of dimRows) {
              if (row.value === null || row.value === undefined) continue
              const key = rowGroupKey(row.groupId as string | null)
              const cnt = Number(row.cnt)
              const current = best.get(key)
              if (!current || cnt > current.cnt) best.set(key, { value: String(row.value), cnt })
            }
            return new Map([...best].map(([k, v]) => [k, v.value]))
          }

          const tops = new Map<TopField, Map<string, string | null>>()

          await Promise.all(
            requestedTopFields.map(async (field) => {
              if (groupBy === TOP_FIELD_SELF_GROUP[field]) {
                tops.set(field, new Map(mapped.map((r) => [rowGroupKey(r.id), r.name])))
                return
              }
              if (field === "ip") {
                const topHashes = await fetchTopValues(clicks.ipHash)
                const hashes = [...new Set([...topHashes.values()].filter((v): v is string => Boolean(v)))]
                if (hashes.length === 0) { tops.set(field, new Map()); return }
                const samples = await db
                  .select({ ipHash: clicks.ipHash, ipEncrypted: sql<string>`max(${clicks.ipEncrypted})` })
                  .from(clicks)
                  .where(inArray(clicks.ipHash, hashes))
                  .groupBy(clicks.ipHash)
                const ipByHash = new Map<string, string>()
                await Promise.all(
                  samples.map(async (s) => {
                    if (!s.ipHash) return
                    const decrypted = await safeDecryptIp(s.ipEncrypted)
                    if (decrypted) ipByHash.set(s.ipHash, decrypted)
                  }),
                )
                tops.set(field, new Map([...topHashes].map(([k, h]) => [k, h ? (ipByHash.get(h) ?? null) : null])))
                return
              }
              if (field === "landingPage") {
                const topLpIds = await fetchTopValues(clicks.landingPageId)
                const lpIds = [...new Set([...topLpIds.values()].filter((v): v is string => Boolean(v)))]
                if (lpIds.length === 0) { tops.set(field, new Map()); return }
                const lps = await db
                  .select({ id: landingPages.id, name: landingPages.name })
                  .from(landingPages)
                  .where(inArray(landingPages.id, lpIds))
                const nameById = new Map(lps.map((l) => [l.id, l.name]))
                tops.set(field, new Map([...topLpIds].map(([k, lpId]) => [k, lpId ? (nameById.get(lpId) ?? null) : null])))
                return
              }
              const dimCol = TOP_FIELD_COL_MAP[field]
              if (dimCol) tops.set(field, await fetchTopValues(dimCol))
            }),
          )

          mapped = mapped.map((r) => {
            const key = rowGroupKey(r.id)
            const next = { ...r }
            for (const field of requestedTopFields) {
              ;(next as Record<string, unknown>)[field] = tops.get(field)?.get(key) ?? null
            }
            return next
          })
        }
      }

      return mapped
    }),

  performanceCount: permissionProcedure("report.view")
    .input(reportPerformanceCountQuerySchema)
    .query(async ({ ctx, input }) => {
      const { period, dateFrom, dateTo, productId, mediaBuyerId, advertiserId, groupBy, search, breakdownBy, filters, joinOperator } = input
      const { db, user } = ctx

      const scope = await getScope(db, user.id, user.role)
      const { start, end } = getRange(period, dateFrom, dateTo)

      const advertiserConditions = !scope.isAllAdvertisers
        ? inArray(products.advertiserId, scope.advertiserIds.length > 0 ? scope.advertiserIds : ["-1"])
        : undefined

      const mediaBuyerConditions = !scope.isAllMediaBuyers
        ? inArray(clicks.mediaBuyerId, scope.mediaBuyerIds.length > 0 ? scope.mediaBuyerIds : ["-1"])
        : undefined

      const resolvedFilters = await resolveLandingPageFilters(db, filters)

      const filterConditions = resolvedFilters && resolvedFilters.length > 0
        ? filterColumns({
            table: KPI_FILTER_TABLE,
            filters: resolvedFilters as ExtendedColumnFilter<typeof KPI_FILTER_TABLE>[],
            joinOperator,
            database: "postgres",
          })
        : undefined

      const commonConditions = and(
        gte(clicks.createdAt, start),
        lte(clicks.createdAt, end),
        productId ? eq(clicks.productId, productId) : undefined,
        mediaBuyerId ? eq(clicks.mediaBuyerId, mediaBuyerId) : undefined,
        advertiserId ? eq(products.advertiserId, advertiserId) : undefined,
        advertiserConditions,
        mediaBuyerConditions,
        filterConditions
      )

      const total = await runPerformanceCountQuery(db, commonConditions, groupBy, search, breakdownBy, {
        useAdvertiserTable: true,
      })

      return { total }
    }),

  clickLog: permissionProcedure("report.view")
    .input(clickLogInputSchema)
    .query(async ({ ctx, input }) => {
      const { filters, joinOperator, page, perPage } = input
      const { db, user } = ctx

      const scope = await getScope(db, user.id, user.role)
      const offset = (page - 1) * perPage

      const advertiserConditions = !scope.isAllAdvertisers
        ? inArray(products.advertiserId, scope.advertiserIds.length > 0 ? scope.advertiserIds : ["-1"])
        : undefined

      const mediaBuyerConditions = !scope.isAllMediaBuyers
        ? inArray(clicks.mediaBuyerId, scope.mediaBuyerIds.length > 0 ? scope.mediaBuyerIds : ["-1"])
        : undefined

      const clickTable = {
        ...clicks,
        productName: products.name,
        mediaBuyerName: mediaBuyers.name,
        advertiserName: advertisers.name,
      }

      const filterConditions = filterColumns({
        table: clickTable,
        filters: filters as ExtendedColumnFilter<unknown>[],
        joinOperator,
        database: "postgres",
      })

      const conditions = and(filterConditions, advertiserConditions, mediaBuyerConditions)

      const [items, countResult] = await Promise.all([
        db
          .select({
            id: clicks.id,
            tid: clicks.tid,
            productId: clicks.productId,
            productName: products.name,
            mediaBuyerId: clicks.mediaBuyerId,
            mediaBuyerName: mediaBuyers.name,
            advertiserId: clicks.advertiserId,
            advertiserName: advertisers.name,
            source: clicks.source,
            sourcePlatform: clicks.sourcePlatform,
            adAccountId: clicks.adAccountId,
            campaignId: clicks.campaignId,
            ipAddress: clicks.ipEncrypted,
            geoCountry: clicks.geoCountry,
            deviceType: clicks.deviceType,
            deviceVendor: clicks.deviceVendor,
            deviceModel: clicks.deviceModel,
            os: clicks.os,
            osVersion: clicks.osVersion,
            browser: clicks.browser,
            browserVersion: clicks.browserVersion,
            referer: clicks.referer,
            utmSource: clicks.utmSource,
            utmMedium: clicks.utmMedium,
            utmCampaign: clicks.utmCampaign,
            utmTerm: clicks.utmTerm,
            utmContent: clicks.utmContent,
            userAgentEncrypted: clicks.userAgentEncrypted,
            isUnique: clicks.isUnique,
            createdAt: clicks.createdAt,
          })
          .from(clicks)
          .innerJoin(products, eq(clicks.productId, products.id))
          .leftJoin(mediaBuyers, eq(clicks.mediaBuyerId, mediaBuyers.id))
          .leftJoin(advertisers, eq(clicks.advertiserId, advertisers.id))
          .where(conditions)
          .orderBy(desc(clicks.createdAt))
          .limit(perPage)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(clicks)
          .innerJoin(products, eq(clicks.productId, products.id))
          .where(conditions),
      ])

      const decryptedItems = await Promise.all(
        items.map(async (item) => ({
          ...item,
          ipAddress: await safeDecryptIp(item.ipAddress),
        }))
      )

      return {
        items: decryptedItems,
        total: Number(countResult[0]?.count ?? 0),
        pageCount: Math.ceil(Number(countResult[0]?.count ?? 0) / perPage),
      }
    }),

  clickLogOptions: permissionProcedure("report.view")
    .input(clickLogOptionsInputSchema)
    .query(async ({ ctx, input }) => {
      const { column, q, ids } = input
      const { db, user } = ctx

      const scope = await getScope(db, user.id, user.role)

      const advertiserConditions = !scope.isAllAdvertisers
        ? inArray(products.advertiserId, scope.advertiserIds.length > 0 ? scope.advertiserIds : ["-1"])
        : undefined

      const mediaBuyerConditions = !scope.isAllMediaBuyers
        ? inArray(clicks.mediaBuyerId, scope.mediaBuyerIds.length > 0 ? scope.mediaBuyerIds : ["-1"])
        : undefined

      const columnMap: Record<string, AnyColumn> = {
        source: clicks.source,
        platform: clicks.sourcePlatform,
        utmSource: clicks.utmSource,
        utmMedium: clicks.utmMedium,
        utmCampaign: clicks.utmCampaign,
        utmTerm: clicks.utmTerm,
        utmContent: clicks.utmContent,
        geoCountry: clicks.geoCountry,
        country: clicks.geoCountry,
        geoState: clicks.geoState,
        geostate: clicks.geoState,
        geoCity: clicks.geoCity,
        geocity: clicks.geoCity,
        deviceType: clicks.deviceType,
        device: clicks.deviceType,
        os: clicks.os,
        osVersion: clicks.osVersion,
        osversion: clicks.osVersion,
        browser: clicks.browser,
        browserVersion: clicks.browserVersion,
        browserversion: clicks.browserVersion,
        deviceVendor: clicks.deviceVendor,
        devicevendor: clicks.deviceVendor,
        deviceModel: clicks.deviceModel,
        devicemodel: clicks.deviceModel,
        referer: clicks.referer,
      }

      const columnExpr = columnMap[column]
      if (!columnExpr) return []

      const conditions = and(
        advertiserConditions,
        mediaBuyerConditions,
        q ? ilike(columnExpr, `%${q}%`) : undefined,
        ids && ids.length > 0 ? inArray(columnExpr, ids) : undefined
      )

      const results = await db
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .selectDistinct({ value: columnExpr as any })
        .from(clicks)
        .innerJoin(products, eq(clicks.productId, products.id))
        .where(conditions)
        .orderBy(sql`${columnExpr}`)
        .limit(50)

      return results
        .filter((r) => r.value !== null && r.value !== undefined && r.value !== "")
        .map((r) => ({ value: String(r.value) }))
    }),

  conversionLog: permissionProcedure("report.view")
    .input(conversionLogInputSchema)
    .query(async ({ ctx, input }) => {
      const { filters, joinOperator, page, perPage } = input
      const { db, user } = ctx

      const scope = await getScope(db, user.id, user.role)
      const offset = (page - 1) * perPage

      const advertiserConditions = !scope.isAllAdvertisers
        ? inArray(products.advertiserId, scope.advertiserIds.length > 0 ? scope.advertiserIds : ["-1"])
        : undefined

      const conversionTable = {
        ...conversions,
        tid: clicks.tid,
        country: clicks.geoCountry,
        clickTime: clicks.createdAt,
        ip: conversions.ipEncrypted,
      }

      const filterConditions = filterColumns({
        table: conversionTable,
        filters: filters as ExtendedColumnFilter<unknown>[],
        joinOperator,
        database: "postgres",
      })

      const conditions = and(filterConditions, advertiserConditions)

      const [items, countResult] = await Promise.all([
        db
          .select({
            id: conversions.id,
            tid: clicks.tid,
            productId: conversions.productId,
            productName: products.name,
            mediaBuyerId: conversions.mediaBuyerId,
            mediaBuyerName: mediaBuyers.name,
            advertiserId: conversions.advertiserId,
            advertiserName: advertisers.name,
            event: conversions.event,
            revenue: conversions.revenue,
            payout: conversions.payout,
            status: conversions.status,
            ip: conversions.ipEncrypted,
            country: clicks.geoCountry,
            currency: conversions.currency,
            method: conversions.method,
            postbackUrl: conversions.postbackUrl,
            referrerUrl: conversions.referrerUrl,
            clickTime: clicks.createdAt,
            campaignId: conversions.campaignId,
            adAccountId: conversions.adAccountId,
            createdAt: conversions.createdAt,
          })
          .from(conversions)
          .innerJoin(clicks, eq(conversions.clickId, clicks.id))
          .innerJoin(products, eq(conversions.productId, products.id))
          .leftJoin(mediaBuyers, eq(conversions.mediaBuyerId, mediaBuyers.id))
          .leftJoin(advertisers, eq(conversions.advertiserId, advertisers.id))
          .where(conditions)
          .orderBy(desc(conversions.createdAt))
          .limit(perPage)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(conversions)
          .innerJoin(clicks, eq(conversions.clickId, clicks.id))
          .innerJoin(products, eq(conversions.productId, products.id))
          .where(conditions),
      ])

      return {
        items: await Promise.all(
          items.map(async (row) => ({
            ...row,
            ip: await safeDecryptIp(row.ip),
            revenue: Number(row.revenue),
            payout: Number(row.payout),
          }))
        ),
        total: Number(countResult[0]?.count ?? 0),
        pageCount: Math.ceil(Number(countResult[0]?.count ?? 0) / perPage),
      }
    }),

  landingPagesByProductIds: permissionProcedure("report.view")
    .input(z.object({ productIds: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      const { productIds } = input
      const { db } = ctx

      if (productIds.length === 0) return {}

      const rows = await db
        .select({
          productId: funnels.productId,
          id: landingPages.id,
          name: landingPages.name,
        })
        .from(funnels)
        .innerJoin(landingPages, eq(landingPages.funnelId, funnels.id))
        .where(and(
          inArray(funnels.productId, productIds),
          eq(landingPages.status, "active"),
          isNull(landingPages.deletedAt),
        ))
        .orderBy(asc(funnels.productId), asc(landingPages.name))

      const grouped: Record<string, Array<{ id: string; name: string }>> = {}
      for (const row of rows) {
        if (!grouped[row.productId]) {
          grouped[row.productId] = []
        }
        grouped[row.productId]!.push({ id: row.id, name: row.name })
      }

      return grouped
    }),

  conversionLogOptions: permissionProcedure("report.view")
    .input(conversionLogOptionsInputSchema)
    .query(async ({ ctx, input }) => {
      const { column, q, ids } = input
      const { db, user } = ctx

      const scope = await getScope(db, user.id, user.role)

      const advertiserConditions = !scope.isAllAdvertisers
        ? inArray(products.advertiserId, scope.advertiserIds.length > 0 ? scope.advertiserIds : ["-1"])
        : undefined

      const columnMap: Record<string, AnyColumn> = {
        event: conversions.event,
        status: conversions.status,
        method: conversions.method,
        currency: conversions.currency,
        country: clicks.geoCountry,
      }

      const columnExpr = columnMap[column]
      if (!columnExpr) return []

      const conditions = and(
        advertiserConditions,
        q ? ilike(columnExpr, `%${q}%`) : undefined,
        ids && ids.length > 0 ? inArray(columnExpr, ids) : undefined
      )

      const results = await db
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .selectDistinct({ value: columnExpr as any })
        .from(conversions)
        .innerJoin(clicks, eq(conversions.clickId, clicks.id))
        .innerJoin(products, eq(conversions.productId, products.id))
        .where(conditions)
        .orderBy(sql`${columnExpr}`)
        .limit(50)

      return results.map((r) => ({ value: r.value ?? "" }))
    }),

  export: permissionProcedure("report.export")
    .input(reportExportInputSchema)
    .query(async ({ ctx, input }) => {
      const { type, period, dateFrom, dateTo, productIds, mediaBuyerId, advertiserId, source } = input
      const { db, user } = ctx

      const scope = await getScope(db, user.id, user.role)
      const { start, end } = getRange(period, dateFrom, dateTo)

      const advertiserConditions = !scope.isAllAdvertisers
        ? inArray(products.advertiserId, scope.advertiserIds.length > 0 ? scope.advertiserIds : ["-1"])
        : undefined

      const mediaBuyerConditions = !scope.isAllMediaBuyers
        ? inArray(clicks.mediaBuyerId, scope.mediaBuyerIds.length > 0 ? scope.mediaBuyerIds : ["-1"])
        : undefined

      const commonConditions = and(
        gte(clicks.createdAt, start),
        lte(clicks.createdAt, end),
        productIds && productIds.length > 0 ? inArray(clicks.productId, productIds) : undefined,
        mediaBuyerId ? eq(clicks.mediaBuyerId, mediaBuyerId) : undefined,
        advertiserId ? eq(products.advertiserId, advertiserId) : undefined,
        source ? eq(clicks.source, source) : undefined,
        advertiserConditions,
        mediaBuyerConditions
      )

      if (type === "performance") {
        const idCol = products.id
        const nameCol = products.name

        const results = await db
          .select({
            id: idCol,
            name: nameCol,
            clicks: sql<number>`count(DISTINCT ${clicks.id})`,
            conversions: sql<number>`count(DISTINCT ${conversions.id})`,
            revenue: sql<string>`coalesce(sum(${conversions.revenue}), 0)`,
            payout: sql<string>`coalesce(sum(${conversions.payout}), 0)`,
          })
          .from(clicks)
          .leftJoin(conversions, eq(clicks.id, conversions.clickId))
          .innerJoin(products, eq(clicks.productId, products.id))
          .where(commonConditions)
          .groupBy(idCol, nameCol)
          .orderBy(desc(sql<number>`count(DISTINCT ${clicks.id})`))
          .limit(100000)

        const header = "ID,Name,Clicks,Conversions,Revenue,Payout\n"
        const csvRows = results.map((r) =>
          [r.id, r.name, r.clicks, r.conversions, r.revenue, r.payout].map(csvEscape).join(",")
        ).join("\n")

        return header + csvRows
      }

      if (type === "clickLog") {
        const rows = await db
          .select({
            tid: clicks.tid,
            productName: products.name,
            mediaBuyerName: mediaBuyers.name,
            source: clicks.source,
            sourcePlatform: clicks.sourcePlatform,
            country: clicks.geoCountry,
            deviceType: clicks.deviceType,
            os: clicks.os,
            ipAddress: clicks.ipEncrypted,
            createdAt: clicks.createdAt,
          })
          .from(clicks)
          .innerJoin(products, eq(clicks.productId, products.id))
          .leftJoin(mediaBuyers, eq(clicks.mediaBuyerId, mediaBuyers.id))
          .where(commonConditions)
          .orderBy(desc(clicks.createdAt))
          .limit(100000)

        const header = "TID,Product,Media Buyer,Platform,Source,Country,Device,OS,IP,Date\n"
        const decryptedRows = await Promise.all(
          rows.map(async (r) => ({
            ...r,
            ipAddress: await safeDecryptIp(r.ipAddress),
          }))
        )
        const csvRows = decryptedRows.map((r) =>
          [r.tid, r.productName, r.mediaBuyerName, r.sourcePlatform ?? "", r.source, r.country, r.deviceType, r.os, r.ipAddress ?? "", r.createdAt?.toISOString()].map(csvEscape).join(",")
        ).join("\n")

        return header + csvRows
      }

      const rows = await db
        .select({
          id: conversions.id,
          tid: clicks.tid,
          productName: products.name,
          mediaBuyerName: mediaBuyers.name,
          advertiserName: advertisers.name,
          event: conversions.event,
          revenue: conversions.revenue,
          payout: conversions.payout,
          status: conversions.status,
          createdAt: conversions.createdAt,
        })
        .from(conversions)
        .innerJoin(clicks, eq(conversions.clickId, clicks.id))
        .innerJoin(products, eq(conversions.productId, products.id))
        .leftJoin(mediaBuyers, eq(conversions.mediaBuyerId, mediaBuyers.id))
        .leftJoin(advertisers, eq(conversions.advertiserId, advertisers.id))
        .where(and(
          gte(conversions.createdAt, start),
          lte(conversions.createdAt, end),
          productIds && productIds.length > 0 ? inArray(conversions.productId, productIds) : undefined,
          mediaBuyerId ? eq(conversions.mediaBuyerId, mediaBuyerId) : undefined,
          advertiserId ? eq(conversions.advertiserId, advertiserId) : undefined,
          advertiserConditions
        ))
        .orderBy(desc(conversions.createdAt))
        .limit(100000)

      const header = "ID,Click ID / TID,Product,Media Buyer,Advertiser,Event,Revenue,Payout,Status,Date\n"
      const csvRows = rows.map((r) =>
        [r.id, r.tid, r.productName, r.mediaBuyerName, r.advertiserName, r.event, r.revenue, r.payout, r.status, r.createdAt?.toISOString()].map(csvEscape).join(",")
      ).join("\n")

      return header + csvRows
    }),

  trend: permissionProcedure("report.view").input(reportBaseQuerySchema).query(async ({ ctx, input }) => {
    const { period, dateFrom, dateTo, productId, mediaBuyerId, advertiserId } = input
    const { db, user } = ctx

    const scope = await getScope(db, user.id, user.role)
    const { start, end } = getRange(period, dateFrom, dateTo)

    const advertiserConditions = !scope.isAllAdvertisers
      ? inArray(products.advertiserId, scope.advertiserIds.length > 0 ? scope.advertiserIds : ["-1"])
      : undefined

    const mediaBuyerConditions = !scope.isAllMediaBuyers
      ? inArray(clicks.mediaBuyerId, scope.mediaBuyerIds.length > 0 ? scope.mediaBuyerIds : ["-1"])
      : undefined

    const commonConditions = and(
      gte(clicks.createdAt, start),
      lte(clicks.createdAt, end),
      productId ? eq(clicks.productId, productId) : undefined,
      mediaBuyerId ? eq(clicks.mediaBuyerId, mediaBuyerId) : undefined,
      advertiserId ? eq(products.advertiserId, advertiserId) : undefined,
      advertiserConditions,
      mediaBuyerConditions
    )

    return await runTrendQuery(db, commonConditions)
  }),
})
