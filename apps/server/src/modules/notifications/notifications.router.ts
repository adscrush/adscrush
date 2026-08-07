import { z } from "zod"
import { protectedProcedure, router } from "~/lib/trpc/init"
import {
  createNotificationSchema,
  listNotificationsSchema,
  markAsReadSchema,
  notificationsListOutputSchema,
  notificationOutputSchema,
} from "./notifications.types"
import * as service from "./notifications.service"

export const notificationsRouter = router({
  // ─── List Notifications ────────────────────────────────────────────────

  list: protectedProcedure
    .input(listNotificationsSchema)
    .output(notificationsListOutputSchema)
    .query(async ({ ctx, input }) => {
      return service.listNotifications(ctx.db, ctx.user.id, input)
    }),

  // ─── Get Notification By ID ────────────────────────────────────────────

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(notificationOutputSchema)
    .query(async ({ ctx, input }) => {
      return service.getNotificationById(ctx.db, input.id, ctx.user.id)
    }),

  // ─── Create Notification ───────────────────────────────────────────────

  create: protectedProcedure
    .input(createNotificationSchema)
    .mutation(async ({ ctx, input }) => {
      return service.createNotification(ctx.db, input)
    }),

  // ─── Mark as Read ──────────────────────────────────────────────────────

  markAsRead: protectedProcedure
    .input(markAsReadSchema)
    .mutation(async ({ ctx, input }) => {
      return service.markAsRead(ctx.db, input.notificationIds, ctx.user.id)
    }),

  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      return service.markAllAsRead(ctx.db, ctx.user.id)
    }),

  // ─── Delete ────────────────────────────────────────────────────────────

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return service.deleteNotification(ctx.db, input.id, ctx.user.id)
    }),

  deleteMany: protectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      return service.deleteNotifications(ctx.db, input.ids, ctx.user.id)
    }),

  // ─── Count ─────────────────────────────────────────────────────────────

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return service.getUnreadCount(ctx.db, ctx.user.id)
  }),
})
