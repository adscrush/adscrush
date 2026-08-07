import { z } from "zod"
import { getScope } from "~/lib/scope"
import { adminProcedure, permissionProcedure, router } from "~/lib/trpc/init"
import {
  mediaBuyerOutputSchema,
  mediaBuyerPopoverOutputSchema,
  listMediaBuyersInputSchema,
  createMediaBuyerInputSchema,
  updateMediaBuyerInputSchema,
  linkEmployeeMediaBuyerInputSchema,
  bulkUpdateMediaBuyerStatusInputSchema,
  bulkDeleteMediaBuyersInputSchema,
  changeMediaBuyerPasswordInputSchema,
  getMediaBuyerPermissionsInputSchema,
  updateMediaBuyerPermissionsInputSchema,
  applyMediaBuyerPresetInputSchema,
} from "./media-buyers.types"
import * as service from "./media-buyers.service"

export const mediaBuyersRouter = router({
  list: permissionProcedure("media_buyers.view")
    .input(listMediaBuyersInputSchema)
    .output(
      z.object({
        items: z.array(mediaBuyerOutputSchema),
        pageCount: z.number(),
        total: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)
      return service.listMediaBuyers(db, input, scope)
    }),

  byId: permissionProcedure("media_buyers.view")
    .input(z.object({ id: z.string() }))
    .output(mediaBuyerOutputSchema)
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)
      return service.getMediaBuyerById(db, input.id, scope)
    }),

  popoverDetails: permissionProcedure("media_buyers.view")
    .input(z.object({ id: z.string() }))
    .output(mediaBuyerPopoverOutputSchema)
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)
      return service.getMediaBuyerPopover(db, input.id, scope)
    }),

  search: permissionProcedure("media_buyers.view")
    .input(z.object({ q: z.string().optional(), ids: z.array(z.string()).optional() }))
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)
      return service.searchMediaBuyers(db, scope, input)
    }),

  resolveByNames: permissionProcedure("media_buyers.view")
    .input(z.object({ names: z.array(z.string()).max(2000) }))
    .output(z.array(z.object({ id: z.string(), name: z.string() })))
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)
      return service.resolveMediaBuyersByNames(db, scope, input.names)
    }),

  statusCounts: permissionProcedure("media_buyers.view").query(async ({ ctx }) => {
    const { db, user } = ctx
    const scope = await getScope(db, user.id, user.role)
    return service.getStatusCounts(db, scope)
  }),

  pendingList: permissionProcedure("media_buyers.view")
    .input(z.object({ page: z.number().int().positive().default(1), perPage: z.number().int().positive().default(10) }))
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)
      return service.getPendingMediaBuyers(db, scope, input)
    }),

  create: adminProcedure.input(createMediaBuyerInputSchema).mutation(async ({ ctx, input }) => {
    return service.createMediaBuyer(ctx.db, ctx.auth, ctx.req, input)
  }),

  linkEmployee: adminProcedure
    .input(linkEmployeeMediaBuyerInputSchema)
    .mutation(async ({ ctx, input }) => {
      return service.linkEmployee(ctx.db, input)
    }),

  update: permissionProcedure("media_buyers.edit")
    .input(updateMediaBuyerInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return service.updateMediaBuyer(ctx.db, id, data)
    }),

  bulkUpdateStatus: adminProcedure
    .input(bulkUpdateMediaBuyerStatusInputSchema)
    .mutation(async ({ ctx, input }) => {
      return service.bulkUpdateStatus(ctx.db, input.ids, input.status)
    }),

  bulkDelete: adminProcedure
    .input(bulkDeleteMediaBuyersInputSchema)
    .mutation(async ({ ctx, input }) => {
      return service.bulkDelete(ctx.db, input.ids)
    }),

  delete: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    return service.deleteMediaBuyer(ctx.db, input.id)
  }),

  getPermissions: adminProcedure
    .input(getMediaBuyerPermissionsInputSchema)
    .output(z.array(z.string()))
    .query(async ({ ctx, input }) => {
      return service.getPermissions(ctx.db, input.mediaBuyerId)
    }),

  updatePermissions: adminProcedure
    .input(updateMediaBuyerPermissionsInputSchema)
    .mutation(async ({ ctx, input }) => {
      return service.updatePermissions(ctx.db, input.mediaBuyerId, input.permissions)
    }),

  applyPreset: adminProcedure
    .input(applyMediaBuyerPresetInputSchema)
    .mutation(async ({ ctx, input }) => {
      return service.applyPreset(ctx.db, input.mediaBuyerId, input.preset)
    }),

  changePassword: adminProcedure
    .input(changeMediaBuyerPasswordInputSchema)
    .mutation(async ({ ctx, input }) => {
      return service.changePassword(ctx.db, ctx.auth, ctx.req, input.id, input.password)
    }),
})
