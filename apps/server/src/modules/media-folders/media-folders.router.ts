import { router, protectedProcedure } from "~/lib/trpc/init"
import {
  createMediaFolderSchema,
  moveMediaFolderSchema,
  listMediaFoldersInputSchema,
  listMediaFoldersChildrenInputSchema,
  renameMediaFolderInputSchema,
  deleteMediaFolderInputSchema,
} from "./media-folders.types"
import * as service from "./media-folders.service"

export const mediaFoldersRouter = router({
  list: protectedProcedure
    .input(listMediaFoldersInputSchema)
    .query(async ({ ctx, input }) => service.listMediaFolders(ctx.db, input?.parentId)),

  listChildren: protectedProcedure
    .input(listMediaFoldersChildrenInputSchema)
    .query(async ({ ctx, input }) => service.listMediaFolderChildren(ctx.db, input.parentId)),

  create: protectedProcedure
    .input(createMediaFolderSchema)
    .mutation(async ({ ctx, input }) => service.createMediaFolder(ctx.db, input.name, input.parentId ?? null, ctx.user.id)),

  rename: protectedProcedure
    .input(renameMediaFolderInputSchema)
    .mutation(async ({ ctx, input }) => service.renameMediaFolder(ctx.db, input.folderId, input.name)),

  move: protectedProcedure
    .input(moveMediaFolderSchema)
    .mutation(async ({ ctx, input }) => service.moveMediaFolder(ctx.db, input.folderId, input.newParentId)),

  delete: protectedProcedure
    .input(deleteMediaFolderInputSchema)
    .mutation(async ({ ctx, input }) => service.deleteMediaFolder(ctx.db, input.folderId)),
})
