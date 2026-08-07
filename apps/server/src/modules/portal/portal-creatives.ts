import { and, eq, isNull, sql, inArray } from "@adscrush/db/drizzle"
import {
  adAccounts,
  campaignAdAccounts,
  campaignCreatives,
  creatives,
  creativeFiles,
} from "@adscrush/db/schema"
import { z } from "zod"
import { mediaBuyerProcedure, router } from "~/lib/trpc/init"

export const portalCreativesRouter = router({
  myCreatives: mediaBuyerProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        perPage: z.number().int().min(1).max(100).default(20),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { db, mediaBuyer } = ctx
      const { page, perPage, search } = input

      // Get creatives used in campaigns linked to this media buyer's ad accounts
      const accounts = await db
        .select({ id: adAccounts.id })
        .from(adAccounts)
        .where(and(eq(adAccounts.mediaBuyerId, mediaBuyer.id), isNull(adAccounts.deletedAt)))

      const buyerAccountIds = accounts.map((a) => a.id)

      if (buyerAccountIds.length === 0) {
        return { items: [], total: 0, pageCount: 0 }
      }

      // Find campaigns linked to buyer's ad accounts
      const linkedCampaignIds = await db
        .select({ campaignId: campaignAdAccounts.campaignId })
        .from(campaignAdAccounts)
        .where(inArray(campaignAdAccounts.adAccountId, buyerAccountIds))

      const campaignIds = [...new Set(linkedCampaignIds.map((l) => l.campaignId))]

      if (campaignIds.length === 0) {
        return { items: [], total: 0, pageCount: 0 }
      }

      // Get creatives linked to those campaigns
      const creativeLinks = await db
        .select({ creativeId: campaignCreatives.creativeId })
        .from(campaignCreatives)
        .where(inArray(campaignCreatives.campaignId, campaignIds))

      const creativeIds = [...new Set(creativeLinks.map((l) => l.creativeId))]

      if (creativeIds.length === 0) {
        return { items: [], total: 0, pageCount: 0 }
      }

      const conditions = and(
        inArray(creatives.id, creativeIds),
        isNull(creatives.deletedAt),
        search ? sql`${creatives.name} ILIKE ${`%${search}%`}` : undefined
      )

      const [creativeRows, countRows] = await Promise.all([
        db
          .select({
            id: creatives.id,
            name: creatives.name,
            status: creatives.status,
            tags: creatives.tags,
            createdAt: creatives.createdAt,
          })
          .from(creatives)
          .where(conditions)
          .orderBy(sql`${creatives.createdAt} DESC`)
          .limit(perPage)
          .offset((page - 1) * perPage),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(creatives)
          .where(conditions),
      ])
      const creativeCount = countRows[0]?.count ?? 0

      // Batch fetch thumbnail for each creative
      if (creativeRows.length > 0) {
        const allFiles = await db
          .select()
          .from(creativeFiles)
          .where(
            inArray(
              creativeFiles.creativeId,
              creativeRows.map((i) => i.id)
            )
          )
          .orderBy(creativeFiles.sortOrder)

        const fileMap = new Map<string, (typeof allFiles)[number]>()
        for (const f of allFiles) {
          if (!fileMap.has(f.creativeId)) {
            fileMap.set(f.creativeId, f)
          }
        }

        return {
          items: creativeRows.map((item) => {
            const file = fileMap.get(item.id)
            return {
              ...item,
              thumbnailUrl: file?.thumbnailUrl ?? file?.cdnUrl ?? null,
              mimeType: file?.mimeType ?? null,
              fileType: file?.fileType ?? null,
            }
          }),
          total: creativeCount,
          pageCount: Math.ceil(creativeCount / perPage),
        }
      }

      return { items: [], total: 0, pageCount: 0 }
    }),
})
