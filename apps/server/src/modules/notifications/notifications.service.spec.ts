import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Database } from "@adscrush/db"
import * as service from "./notifications.service"
import * as repository from "./notifications.repository"

// Mock the repository
vi.mock("./notifications.repository", () => ({
  findNotificationsPaginated: vi.fn(),
  findNotificationById: vi.fn(),
  createNotification: vi.fn(),
  markNotificationsAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn(),
  deleteNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
}))

// Mock the error helpers
vi.mock("~/lib/helpers/errors", () => ({
  throwNotFound: vi.fn((entity: string) => {
    throw new Error(`${entity} not found`)
  }),
  throwForbidden: vi.fn((message: string) => {
    throw new Error(message)
  }),
}))

describe("NotificationsService", () => {
  const mockDb = {} as unknown as Database
  const mockUserId = "user-123"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listNotifications", () => {
    it("should return paginated notifications", async () => {
      const mockResult = {
        items: [{
          id: "1",
          userId: mockUserId,
          type: "info" as const,
          title: "Test",
          message: "Test message",
          read: false,
          channel: "in_app" as const,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
        total: 1,
        pageCount: 1,
        unreadCount: 1,
      }
      vi.mocked(repository.findNotificationsPaginated).mockResolvedValue(mockResult)

      const result = await service.listNotifications(mockDb, mockUserId, {
        page: 1,
        perPage: 20,
      })

      expect(result).toEqual(mockResult)
      expect(repository.findNotificationsPaginated).toHaveBeenCalledWith(mockDb, mockUserId, {
        page: 1,
        perPage: 20,
      })
    })
  })

  describe("getNotificationById", () => {
    it("should return notification when found and owned by user", async () => {
      const mockNotification = {
        id: "1",
        userId: mockUserId,
        type: "info" as const,
        title: "Test",
        message: "Test message",
        read: false,
        channel: "in_app" as const,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      vi.mocked(repository.findNotificationById).mockResolvedValue(mockNotification)

      const result = await service.getNotificationById(mockDb, "1", mockUserId)

      expect(result).toEqual(mockNotification)
    })

    it("should throw when notification not found", async () => {
      vi.mocked(repository.findNotificationById).mockResolvedValue(null)

      await expect(
        service.getNotificationById(mockDb, "1", mockUserId)
      ).rejects.toThrow("Notification not found")
    })

    it("should throw when user does not own notification", async () => {
      const mockNotification = {
        id: "1",
        userId: "other-user",
        type: "info" as const,
        title: "Test",
        message: "Test message",
        read: false,
        channel: "in_app" as const,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      vi.mocked(repository.findNotificationById).mockResolvedValue(mockNotification)

      await expect(
        service.getNotificationById(mockDb, "1", mockUserId)
      ).rejects.toThrow("You do not have access to this notification")
    })
  })

  describe("createNotification", () => {
    it("should create and return notification", async () => {
      const mockNotification = {
        id: "1",
        userId: mockUserId,
        type: "info" as const,
        title: "Test",
        message: "Test message",
        read: false,
        channel: "in_app" as const,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      vi.mocked(repository.createNotification).mockResolvedValue(mockNotification)

      const result = await service.createNotification(mockDb, {
        userId: mockUserId,
        type: "info",
        title: "Test",
        message: "Test message",
      })

      expect(result).toEqual(mockNotification)
    })
  })

  describe("markAsRead", () => {
    it("should mark notifications as read", async () => {
      const mockNotification = {
        id: "1",
        userId: mockUserId,
        type: "info" as const,
        title: "Test",
        message: "Test message",
        read: false,
        channel: "in_app" as const,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      vi.mocked(repository.findNotificationById).mockResolvedValue(mockNotification)
      vi.mocked(repository.markNotificationsAsRead).mockResolvedValue({ success: true })

      const result = await service.markAsRead(mockDb, ["1"], mockUserId)

      expect(result).toEqual({ success: true })
    })

    it("should throw when notification not found", async () => {
      vi.mocked(repository.findNotificationById).mockResolvedValue(null)

      await expect(
        service.markAsRead(mockDb, ["1"], mockUserId)
      ).rejects.toThrow("Notification not found")
    })
  })

  describe("deleteNotification", () => {
    it("should delete notification and return success", async () => {
      vi.mocked(repository.deleteNotification).mockResolvedValue({ id: "1" })

      const result = await service.deleteNotification(mockDb, "1", mockUserId)

      expect(result).toEqual({ success: true })
    })

    it("should throw when notification not found", async () => {
      vi.mocked(repository.deleteNotification).mockResolvedValue(null)

      await expect(
        service.deleteNotification(mockDb, "1", mockUserId)
      ).rejects.toThrow("Notification not found")
    })
  })

  describe("getUnreadCount", () => {
    it("should return unread count", async () => {
      vi.mocked(repository.getUnreadCount).mockResolvedValue(5)

      const result = await service.getUnreadCount(mockDb, mockUserId)

      expect(result).toBe(5)
    })
  })
})
