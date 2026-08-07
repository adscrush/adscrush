import { z } from "zod"

// ─── Enums ─────────────────────────────────────────────────────────────────

export const NOTIFICATION_TYPES = {
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  SUCCESS: "success",
} as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES]

export const NOTIFICATION_CHANNELS = {
  IN_APP: "in_app",
  EMAIL: "email",
  SMS: "sms",
  WEBHOOK: "webhook",
} as const

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[keyof typeof NOTIFICATION_CHANNELS]

// ─── Interfaces ────────────────────────────────────────────────────────────

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  channel: NotificationChannel
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  message: string
  channel?: NotificationChannel
  metadata?: Record<string, unknown>
}

export interface ListNotificationsInput {
  page: number
  perPage: number
  unreadOnly?: boolean
  type?: NotificationType
}

// ─── Schemas ───────────────────────────────────────────────────────────────

export const createNotificationSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  type: z.enum(["info", "warning", "error", "success"]),
  title: z.string().min(1, "Title is required").max(200),
  message: z.string().min(1, "Message is required").max(2000),
  channel: z.enum(["in_app", "email", "sms", "webhook"]).default("in_app"),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const listNotificationsSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(100).default(20),
  unreadOnly: z.boolean().optional(),
  type: z.enum(["info", "warning", "error", "success"]).optional(),
})

export const markAsReadSchema = z.object({
  notificationIds: z.array(z.string()).min(1, "At least one notification ID is required"),
})

// ─── Output Schemas ────────────────────────────────────────────────────────

export const notificationOutputSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(["info", "warning", "error", "success"]),
  title: z.string(),
  message: z.string(),
  read: z.boolean(),
  channel: z.enum(["in_app", "email", "sms", "webhook"]),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const notificationsListOutputSchema = z.object({
  items: z.array(notificationOutputSchema),
  total: z.number(),
  pageCount: z.number(),
  unreadCount: z.number(),
})
