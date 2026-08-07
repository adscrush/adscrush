import { z } from "zod"
import { permissionProcedure, router } from "~/lib/trpc/init"
import { getScope } from "~/lib/scope"
import { creativeOutputSchema, listCreativesInputSchema } from "./creatives.types"
import { updateCreativeSchema, moveCreativeToFolderSchema } from "@adscrush/shared/validators/creative.schema"
import * as service from "./creatives.service"

export const creativesRouter = router({
  list: permissionProcedure("creatives.view")
    .input(listCreativesInputSchema)
    .output(
      z.object({
        items: z.array(creativeOutputSchema),
        pageCount: z.number(),
        total: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)
      return service.listCreatives(db, input, scope)
    }),

  byId: permissionProcedure("creatives.view")
    .input(z.object({ id: z.string() }))
    .output(creativeOutputSchema)
    .query(async ({ ctx, input }) => {
      return service.getCreativeById(ctx.db, input.id)
    }),

  upload: permissionProcedure("creatives.upload")
    .input(
      z.object({
        name: z.string().min(1),
        productId: z.string().min(1),
        folderId: z.string().optional(),
        file: z.string().min(1),
        fileName: z.string().min(1),
        mimeType: z.string().optional(),
        altText: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return service.uploadCreative(ctx.db, ctx.user, input)
    }),

  create: permissionProcedure("creatives.upload")
    .input(
      z.object({
        name: z.string().min(1),
        productId: z.string().min(1),
        folderId: z.string().optional(),
        altText: z.string().optional(),
        tags: z.array(z.string()).optional(),
        status: z.enum(["active", "inactive"]).default("active"),
        mediaFileId: z.string().optional(),
        cdnUrl: z.string().optional(),
        mimeType: z.string().optional(),
        fileType: z.string().optional(),
        fileSize: z.number().optional(),
        thumbnailUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return service.createCreative(ctx.db, input)
    }),

  update: permissionProcedure("creatives.view")
    .input(z.object({ id: z.string(), data: updateCreativeSchema }))
    .mutation(async ({ ctx, input }) => {
      return service.updateCreative(ctx.db, input.id, input.data)
    }),

  delete: permissionProcedure("creatives.delete")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return service.deleteCreative(ctx.db, input.id)
    }),

  moveToFolder: permissionProcedure("creatives.view")
    .input(moveCreativeToFolderSchema)
    .mutation(async ({ ctx, input }) => {
      return service.moveToFolder(ctx.db, input.creativeId, input.folderId)
    }),

  bulkMoveToFolder: permissionProcedure("creatives.view")
    .input(z.object({ creativeIds: z.array(z.string()), folderId: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => {
      return service.bulkMoveToFolder(ctx.db, input.creativeIds, input.folderId)
    }),

  addNote: permissionProcedure("creatives.view")
    .input(z.object({ creativeId: z.string(), note: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return service.addNote(ctx.db, input.creativeId, input.note)
    }),

  updateNote: permissionProcedure("creatives.view")
    .input(z.object({ id: z.string(), note: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return service.updateNote(ctx.db, input.id, input.note)
    }),

  deleteNote: permissionProcedure("creatives.view")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return service.deleteNote(ctx.db, input.id)
    }),

  setPerformanceTag: permissionProcedure("creatives.view")
    .input(z.object({ creativeId: z.string(), performed: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return service.setPerformanceTag(ctx.db, input.creativeId, input.performed)
    }),
})
