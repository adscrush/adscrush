import type { Database } from "@adscrush/db"
import { throwNotFound, throwForbidden } from "~/lib/helpers/errors"
import type { CreateNotificationInput, ListNotificationsInput } from "./notifications.types"
import * as repository from "./notifications.repository"

// ─── List Notifications ────────────────────────────────────────────────────

export async function listNotifications(
  db: Database,
  userId: string,
  input: ListNotificationsInput
) {
  return repository.findNotificationsPaginated(db, userId, input)
}

// ─── Get Notification By ID ────────────────────────────────────────────────

export async function getNotificationById(db: Database, id: string, userId: string) {
  const result = await repository.findNotificationById(db, id)

  if (!result) {
    throwNotFound("Notification")
  }

  if (result.userId !== userId) {
    throwForbidden("You do not have access to this notification")
  }

  return result
}

// ─── Create Notification ───────────────────────────────────────────────────

export async function createNotification(db: Database, data: CreateNotificationInput) {
  const notification = await repository.createNotification(db, data)

  if (!notification) {
    throw new Error("Failed to create notification")
  }

  return notification
}

// ─── Mark as Read ──────────────────────────────────────────────────────────

export async function markAsRead(db: Database, ids: string[], userId: string) {
  // Verify ownership before marking as read
  for (const id of ids) {
    const notification = await repository.findNotificationById(db, id)
    if (!notification) {
      throwNotFound("Notification")
    }
    if (notification.userId !== userId) {
      throwForbidden("You do not have access to this notification")
    }
  }

  return repository.markNotificationsAsRead(db, ids, userId)
}

export async function markAllAsRead(db: Database, userId: string) {
  return repository.markAllAsRead(db, userId)
}

// ─── Delete ────────────────────────────────────────────────────────────────

export async function deleteNotification(db: Database, id: string, userId: string) {
  const deleted = await repository.deleteNotification(db, id, userId)

  if (!deleted) {
    throwNotFound("Notification")
  }

  return { success: true }
}

export async function deleteNotifications(db: Database, ids: string[], userId: string) {
  return repository.deleteNotifications(db, ids, userId)
}

// ─── Count Queries ─────────────────────────────────────────────────────────

export async function getUnreadCount(db: Database, userId: string) {
  return repository.getUnreadCount(db, userId)
}
