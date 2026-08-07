import { z } from "zod"
import { router, protectedProcedure, adminProcedure, permissionProcedure } from "~/lib/trpc/init"
import {
  uploadMediaSchema,
  mediaListSchema,
  moveFilesSchema,
  uploadFromUrlInputSchema,
  replaceMediaInputSchema,
  addTagsInputSchema,
  removeTagsInputSchema,
  deleteFilesInputSchema,
  deleteOrphansInputSchema,
} from "./media.types"
import * as service from "./media.service"

export const mediaRouter = router({
  list: protectedProcedure
    .input(mediaListSchema)
    .query(async ({ ctx, input }) => service.listMediaFiles(ctx.db, input)),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => service.getMediaFileById(ctx.db, input.id)),

  search: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(200),
      pageSize: z.number().int().min(10).max(100).default(50),
      cursor: z.string().nullish(),
    }))
    .query(async ({ ctx, input }) => service.searchMediaFiles(ctx.db, input.query, input.pageSize, input.cursor)),

  upload: permissionProcedure("media.upload")
    .input(uploadMediaSchema)
    .mutation(async ({ ctx, input }) => service.uploadMedia(ctx.db, ctx.user.id, input)),

  uploadFromUrl: permissionProcedure("media.upload")
    .input(uploadFromUrlInputSchema)
    .mutation(async ({ ctx, input }) => service.uploadFromUrl(ctx.db, ctx.user.id, input.url, input.folderId, input.tags)),

  replace: adminProcedure
    .input(replaceMediaInputSchema)
    .mutation(async ({ ctx, input }) => service.replaceMedia(ctx.db, ctx.user.id, input.fileId, input.file, input.fileName, input.mimeType)),

  delete: adminProcedure
    .input(z.object({ fileId: z.string() }))
    .mutation(async ({ ctx, input }) => service.deleteMedia(ctx.db, ctx.user.id, input.fileId)),

  move: protectedProcedure
    .input(z.object({ fileId: z.string(), folderId: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => service.moveMediaFile(ctx.db, input.fileId, input.folderId)),

  moveFiles: protectedProcedure
    .input(moveFilesSchema)
    .mutation(async ({ ctx, input }) => service.moveMediaFiles(ctx.db, input.fileIds, input.targetFolderId)),

  addTags: protectedProcedure
    .input(addTagsInputSchema)
    .mutation(async ({ ctx, input }) => service.addTags(ctx.db, input.fileId, input.tags)),

  removeTags: protectedProcedure
    .input(removeTagsInputSchema)
    .mutation(async ({ ctx, input }) => service.removeTags(ctx.db, input.fileId, input.tags)),

  deleteFiles: adminProcedure
    .input(deleteFilesInputSchema)
    .mutation(async ({ ctx, input }) => service.deleteFiles(ctx.db, input.fileIds)),

  scanOrphans: adminProcedure.query(async ({ ctx }) => service.scanOrphans(ctx.db)),

  deleteOrphans: adminProcedure
    .input(deleteOrphansInputSchema)
    .mutation(async ({ ctx, input }) => service.deleteOrphans(ctx.db, input.fileIds)),
})
