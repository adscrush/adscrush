import { z } from "zod"
import { getScope } from "~/lib/scope"
import { permissionProcedure, router } from "~/lib/trpc/init"
import { listCampaignsInputSchema, campaignOutputSchema } from "./campaigns.types"
import { createCampaignSchema, updateCampaignSchema } from "@adscrush/shared/validators/campaign.schema"
import * as service from "./campaigns.service"

export const campaignsRouter = router({
  list: permissionProcedure("campaigns.view")
    .input(listCampaignsInputSchema)
    .output(
      z.object({
        items: z.array(campaignOutputSchema),
        pageCount: z.number(),
        total: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)
      return service.listCampaigns(db, input, scope)
    }),

  byId: permissionProcedure("campaigns.view")
    .input(z.object({ id: z.string() }))
    .output(campaignOutputSchema)
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)
      return service.getCampaignById(db, input.id, scope)
    }),

  create: permissionProcedure("campaigns.create")
    .input(createCampaignSchema)
    .mutation(async ({ ctx, input }) => {
      return service.createCampaign(ctx.db, input)
    }),

  update: permissionProcedure("campaigns.edit")
    .input(z.object({ id: z.string(), data: updateCampaignSchema }))
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)
      return service.updateCampaign(db, input.id, input.data, scope)
    }),

  delete: permissionProcedure("campaigns.delete")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)
      return service.deleteCampaign(db, input.id, scope)
    }),

  // ─── Ad Account Routes ─────────────────────────────────────────────────────

  assignAdAccount: permissionProcedure("campaigns.edit")
    .input(z.object({ campaignId: z.string(), adAccountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return service.assignAdAccount(ctx.db, input.campaignId, input.adAccountId)
    }),

  removeAdAccount: permissionProcedure("campaigns.edit")
    .input(z.object({ campaignId: z.string(), adAccountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return service.removeAdAccount(ctx.db, input.campaignId, input.adAccountId)
    }),

  getTrackingLink: permissionProcedure("campaigns.view")
    .input(z.object({ campaignId: z.string(), adAccountId: z.string() }))
    .query(async ({ ctx, input }) => {
      return service.getTrackingLink(ctx.db, input.campaignId, input.adAccountId)
    }),

  getAdAccounts: permissionProcedure("campaigns.view")
    .input(z.object({ campaignId: z.string() }))
    .query(async ({ ctx, input }) => {
      return service.getAdAccounts(ctx.db, input.campaignId)
    }),

  getAllAdAccountsWithAssignment: permissionProcedure("campaigns.view")
    .input(
      z.object({
        campaignId: z.string(),
        search: z.string().optional(),
        filter: z.enum(["all", "assigned"]).default("all"),
        mediaBuyerIds: z.array(z.string()).optional(),
        page: z.number().int().positive().default(1),
        perPage: z.number().int().positive().default(25),
      })
    )
    .query(async ({ ctx, input }) => {
      const { campaignId, ...options } = input
      return service.getAllAdAccountsWithAssignment(ctx.db, campaignId, options)
    }),

  // ─── Creative Routes ───────────────────────────────────────────────────────

  getCreatives: permissionProcedure("campaigns.view")
    .input(z.object({ campaignId: z.string() }))
    .query(async ({ ctx, input }) => {
      return service.getCreatives(ctx.db, input.campaignId)
    }),

  getCreativeTrackingLinks: permissionProcedure("campaigns.view")
    .input(z.object({ campaignId: z.string() }))
    .query(async ({ ctx, input }) => {
      return service.getCreativeTrackingLinks(ctx.db, input.campaignId)
    }),

  syncCreatives: permissionProcedure("campaigns.edit")
    .input(z.object({ campaignId: z.string(), creativeIds: z.array(z.string()).max(50) }))
    .mutation(async ({ ctx, input }) => {
      return service.syncCreatives(ctx.db, input.campaignId, input.creativeIds)
    }),

  // ─── Stats Routes ──────────────────────────────────────────────────────────

  getStats: permissionProcedure("campaigns.view")
    .input(z.object({ campaignId: z.string() }))
    .query(async ({ ctx, input }) => {
      return service.getStats(ctx.db, input.campaignId)
    }),

  getCreativePerformance: permissionProcedure("campaigns.view")
    .input(
      z.object({
        campaignId: z.string(),
        period: z.enum(["today", "yesterday", "this_week", "last_week", "this_month", "last_month", "all_time", "custom"]).default("this_month"),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { campaignId, period, dateFrom, dateTo } = input
      return service.getCreativePerformance(ctx.db, campaignId, period, dateFrom, dateTo)
    }),

  // ─── Admin Routes ──────────────────────────────────────────────────────────

  regenerateTrackingLinks: permissionProcedure("campaigns.edit")
    .mutation(async ({ ctx }) => {
      return service.regenerateTrackingLinks(ctx.db)
    }),
})
