import { z } from "zod"
import { adminProcedure, protectedProcedure, router } from "~/lib/trpc/init"
import {
  languageOutputSchema,
  listLanguagesInputSchema,
  createLanguageInputSchema,
  updateLanguageInputSchema,
  bulkDeleteLanguagesInputSchema,
} from "./languages.types"
import * as service from "./languages.service"

export const languagesRouter = router({
  list: protectedProcedure
    .input(listLanguagesInputSchema)
    .output(z.object({ items: z.array(languageOutputSchema), pageCount: z.number(), total: z.number() }))
    .query(async ({ ctx, input }) => service.listLanguages(ctx.db, input)),

  all: protectedProcedure.query(async ({ ctx }) => service.getAllActiveLanguages(ctx.db)),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(languageOutputSchema)
    .query(async ({ ctx, input }) => service.getLanguageById(ctx.db, input.id)),

  search: protectedProcedure
    .input(z.object({ q: z.string().optional() }))
    .query(async ({ ctx, input }) => service.searchLanguages(ctx.db, input.q)),

  create: adminProcedure
    .input(createLanguageInputSchema)
    .mutation(async ({ ctx, input }) => service.createLanguage(ctx.db, input)),

  update: adminProcedure
    .input(updateLanguageInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return service.updateLanguage(ctx.db, id, data)
    }),

  bulkDelete: adminProcedure
    .input(bulkDeleteLanguagesInputSchema)
    .mutation(async ({ ctx, input }) => service.bulkDelete(ctx.db, input.ids)),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => service.deleteLanguage(ctx.db, input.id)),
})
