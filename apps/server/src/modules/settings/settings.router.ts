import { adminProcedure, protectedProcedure, router } from "~/lib/trpc/init"
import { updateSettingsInputSchema } from "./settings.types"
import * as service from "./settings.service"

export const settingsRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => service.getAllSettings(ctx.db)),

  update: adminProcedure
    .input(updateSettingsInputSchema)
    .mutation(async ({ ctx, input }) => service.updateSettings(ctx.db, input)),
})
