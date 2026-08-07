import { eq } from "@adscrush/db/drizzle"
import { z } from "zod"
import { getScope } from "~/lib/scope"
import { permissionProcedure, router } from "~/lib/trpc/init"
import { creativeFolderOutputSchema, listCreativeFoldersInputSchema, deleteCreativeFolderInputSchema } from "./creative-folders.types"
import { createCreativeFolderSchema, updateCreativeFolderSchema } from "./creative-folders.types"
import * as service from "./creative-folders.service"

export const creativeFoldersRouter = router({
  list: permissionProcedure("creatives.view")
    .input(listCreativeFoldersInputSchema)
    .output(z.array(creativeFolderOutputSchema))
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)

      // Get product's advertiser ID for scope check
      let advertiserId: string | undefined
      if (!scope.isAllAdvertisers) {
        const { products } = await import("@adscrush/db/schema")
        const [product] = await db
          .select({ advertiserId: products.advertiserId })
          .from(products)
          .where(eq(products.id, input.productId))
          .limit(1)
        advertiserId = product?.advertiserId
      }

      return service.listCreativeFolders(db, input.productId, input.parentId, input.flat, scope, advertiserId)
    }),

  byId: permissionProcedure("creatives.view")
    .input(z.object({ id: z.string() }))
    .output(creativeFolderOutputSchema)
    .query(async ({ ctx, input }) => service.getCreativeFolderById(ctx.db, input.id)),

  create: permissionProcedure("creatives.view")
    .input(createCreativeFolderSchema)
    .mutation(async ({ ctx, input }) => service.createCreativeFolder(ctx.db, input)),

  update: permissionProcedure("creatives.view")
    .input(z.object({ id: z.string(), data: updateCreativeFolderSchema }))
    .mutation(async ({ ctx, input }) => service.updateCreativeFolder(ctx.db, input.id, input.data)),

  delete: permissionProcedure("creatives.view")
    .input(deleteCreativeFolderInputSchema)
    .mutation(async ({ ctx, input }) => service.deleteCreativeFolder(ctx.db, input.id, input.recursive)),

  breadcrumb: permissionProcedure("creatives.view")
    .input(z.object({ folderId: z.string() }))
    .query(async ({ ctx, input }) => service.getBreadcrumb(ctx.db, input.folderId)),
})
