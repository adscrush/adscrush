import { z } from "zod"
import { scopedProcedure, permissionProcedure, router } from "~/lib/trpc/init"
import { funnelOutputSchema, listFunnelsInputSchema, funnelCountsOutputSchema } from "./funnels.types"
import { createFunnelSchema, updateFunnelSchema } from "@adscrush/shared/validators/funnel.schema"
import * as service from "./funnels.service"

export const funnelsRouter = router({
  list: scopedProcedure("products.view")
    .input(listFunnelsInputSchema)
    .output(z.object({ items: z.array(funnelOutputSchema), pageCount: z.number(), total: z.number() }))
    .query(async ({ ctx, input }) => service.listFunnels(ctx.db, input, ctx.scope)),

  byId: scopedProcedure("products.view")
    .input(z.object({ id: z.string() }))
    .output(funnelOutputSchema)
    .query(async ({ ctx, input }) => service.getFunnelById(ctx.db, input.id, ctx.scope)),

  create: permissionProcedure("products.edit")
    .input(createFunnelSchema)
    .mutation(async ({ ctx, input }) => service.createFunnel(ctx.db, input)),

  update: permissionProcedure("products.edit")
    .input(z.object({ id: z.string(), data: updateFunnelSchema }))
    .mutation(async ({ ctx, input }) => service.updateFunnel(ctx.db, input.id, input.data)),

  delete: permissionProcedure("products.edit")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => service.deleteFunnel(ctx.db, input.id)),

  addLandingPage: permissionProcedure("products.edit")
    .input(z.object({ funnelId: z.string(), name: z.string().optional(), url: z.string(), weight: z.number().nullable().optional() }))
    .mutation(async ({ ctx, input }) => service.addLandingPage(ctx.db, input.funnelId, input.name, input.url, input.weight)),

  bulkAddLandingPages: permissionProcedure("products.edit")
    .input(z.object({
      funnelId: z.string(),
      landingPages: z.array(z.object({ name: z.string().optional(), url: z.string(), weight: z.number().optional() })),
    }))
    .mutation(async ({ ctx, input }) => service.bulkAddLandingPages(ctx.db, input.funnelId, input.landingPages)),

  updateLandingPage: permissionProcedure("products.edit")
    .input(z.object({ id: z.string(), name: z.string().optional(), url: z.string().optional(), weight: z.number().nullable().optional(), status: z.enum(["active", "inactive"]).optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return service.updateLandingPage(ctx.db, id, data)
    }),

  deleteLandingPage: permissionProcedure("products.edit")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => service.deleteLandingPage(ctx.db, input.id)),

  getLandingPages: permissionProcedure("products.view")
    .input(z.object({ funnelId: z.string() }))
    .query(async ({ ctx, input }) => service.getLandingPages(ctx.db, input.funnelId)),

  counts: scopedProcedure("products.view")
    .input(z.object({}))
    .output(funnelCountsOutputSchema)
    .query(async ({ ctx }) => service.getFunnelCounts(ctx.db, ctx.scope)),

  search: scopedProcedure("products.view")
    .input(z.object({ q: z.string().optional(), limit: z.number().int().positive().default(50), ids: z.array(z.string()).optional() }))
    .query(async ({ ctx, input }) => service.searchFunnels(ctx.db, input.q, input.limit, input.ids, ctx.scope)),
})
