import type { Database } from "@adscrush/db"
import type { ListNotificationsInput, CreateNotificationInput, NotificationType, NotificationChannel } from "./notifications.types"

// ─── In-Memory Store (Reference Implementation) ────────────────────────────
// This is a simplified reference implementation.
// In production, you would use a real notifications table.

interface NotificationRecord {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  channel: NotificationChannel
  metadata: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

const notificationsStore = new Map<string, NotificationRecord>()
let nextId = 1

// ─── List Query ────────────────────────────────────────────────────────────

export async function findNotificationsPaginated(
  _db: Database,
  userId: string,
  input: ListNotificationsInput
) {
  const { page, perPage, unreadOnly, type } = input

  const items = Array.from(notificationsStore.values())
    .filter((n) => {
      if (n.userId !== userId) return false
      if (unreadOnly && n.read) return false
      if (type && n.type !== type) return false
      return true
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice((page - 1) * perPage, page * perPage)

  const total = Array.from(notificationsStore.values()).filter((n) => {
    if (n.userId !== userId) return false
    if (unreadOnly && n.read) return false
    if (type && n.type !== type) return false
    return true
  }).length

  const unreadCount = Array.from(notificationsStore.values()).filter(
    (n) => n.userId === userId && !n.read
  ).length

  return { items, total, pageCount: Math.ceil(total / perPage), unreadCount }
}

// ─── By ID Query ───────────────────────────────────────────────────────────

export async function findNotificationById(_db: Database, id: string) {
  return notificationsStore.get(id) ?? null
}

// ─── Create ────────────────────────────────────────────────────────────────

export async function createNotification(_db: Database, data: CreateNotificationInput) {
  const id = `notif-${nextId++}`
  const now = new Date()

  const notification: NotificationRecord = {
    id,
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    read: false,
    channel: data.channel ?? "in_app",
    metadata: data.metadata ?? null,
    createdAt: now,
    updatedAt: now,
  }

  notificationsStore.set(id, notification)
  return notification
}

// ─── Update ────────────────────────────────────────────────────────────────

export async function markNotificationsAsRead(_db: Database, ids: string[], userId: string) {
  for (const id of ids) {
    const notification = notificationsStore.get(id)
    if (notification && notification.userId === userId) {
      notification.read = true
      notification.updatedAt = new Date()
    }
  }
  return { success: true }
}

export async function markAllAsRead(_db: Database, userId: string) {
  for (const notification of notificationsStore.values()) {
    if (notification.userId === userId && !notification.read) {
      notification.read = true
      notification.updatedAt = new Date()
    }
  }
  return { success: true }
}

// ─── Delete ────────────────────────────────────────────────────────────────

export async function deleteNotification(_db: Database, id: string, userId: string) {
  const notification = notificationsStore.get(id)
  if (notification && notification.userId === userId) {
    notificationsStore.delete(id)
    return { id }
  }
  return null
}

export async function deleteNotifications(_db: Database, ids: string[], userId: string) {
  for (const id of ids) {
    const notification = notificationsStore.get(id)
    if (notification && notification.userId === userId) {
      notificationsStore.delete(id)
    }
  }
  return { success: true }
}

// ─── Count Queries ─────────────────────────────────────────────────────────

export async function getUnreadCount(_db: Database, userId: string) {
  return Array.from(notificationsStore.values()).filter(
    (n) => n.userId === userId && !n.read
  ).length
}
