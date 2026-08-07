import { z } from "zod"
import { getScope } from "~/lib/scope"
import { adminProcedure, permissionProcedure, router } from "~/lib/trpc/init"
import {
  advertiserOutputSchema,
  listAdvertisersInputSchema,
  createAdvertiserInputSchema,
  updateAdvertiserInputSchema,
  bulkUpdateAdvertiserStatusInputSchema,
  bulkDeleteAdvertisersInputSchema,
} from "./advertisers.types"
import * as service from "./advertisers.service"

export const advertisersRouter = router({
  list: permissionProcedure("advertiser.view")
    .input(listAdvertisersInputSchema)
    .output(
      z.object({
        items: z.array(advertiserOutputSchema),
        pageCount: z.number(),
        total: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)
      return service.listAdvertisers(db, input, scope)
    }),

  byId: permissionProcedure("advertiser.view")
    .input(z.object({ id: z.string() }))
    .output(advertiserOutputSchema)
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)
      return service.getAdvertiserById(db, input.id, scope)
    }),

  search: permissionProcedure("advertiser.view")
    .input(z.object({ q: z.string().optional(), ids: z.array(z.string()).optional() }))
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)
      return service.searchAdvertisers(db, scope, input)
    }),

  statusCounts: permissionProcedure("advertiser.view").query(async ({ ctx }) => {
    const { db, user } = ctx
    const scope = await getScope(db, user.id, user.role)
    return service.getStatusCounts(db, scope)
  }),

  create: adminProcedure.input(createAdvertiserInputSchema).mutation(async ({ ctx, input }) => {
    return service.createAdvertiser(ctx.db, ctx.auth, ctx.req, input)
  }),

  update: adminProcedure.input(updateAdvertiserInputSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input
    return service.updateAdvertiser(ctx.db, id, data)
  }),

  bulkUpdateStatus: adminProcedure
    .input(bulkUpdateAdvertiserStatusInputSchema)
    .mutation(async ({ ctx, input }) => {
      return service.bulkUpdateStatus(ctx.db, input.ids, input.status)
    }),

  bulkDelete: adminProcedure
    .input(bulkDeleteAdvertisersInputSchema)
    .mutation(async ({ ctx, input }) => {
      return service.bulkDelete(ctx.db, input.ids)
    }),

  delete: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    return service.deleteAdvertiser(ctx.db, input.id)
  }),
})
