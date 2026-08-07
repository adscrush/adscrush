import { and, desc, eq, sql, inArray } from "@adscrush/db/drizzle"
import { mediaFiles } from "@adscrush/db/schema"
import { z } from "zod"
import { mediaBuyerProcedure, router } from "~/lib/trpc/init"

const MIME_CATEGORIES_LOOKUP: Record<string, readonly string[]> = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/avif"],
  video: ["video/mp4", "video/quicktime", "video/webm"],
  document: ["application/pdf"],
  font: ["font/woff", "font/woff2", "font/ttf", "font/otf"],
}

export const portalMediaRouter = router({
  myMedia: mediaBuyerProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        perPage: z.number().int().min(1).max(100).default(20),
        search: z.string().optional(),
        mimeCategory: z.enum(["image", "video", "document", "font"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { db } = ctx
      const { page, perPage, search, mimeCategory } = input

      // ctx.user.id is the media buyer's user ID (set by auth session)
      const buyerUserId = ctx.user.id

      const conditions = and(
        eq(mediaFiles.uploadedBy, buyerUserId),
        search ? sql`${mediaFiles.name} ILIKE ${`%${search}%`}` : undefined,
        mimeCategory && MIME_CATEGORIES_LOOKUP[mimeCategory]
          ? inArray(mediaFiles.mimeType, [...MIME_CATEGORIES_LOOKUP[mimeCategory]])
          : undefined
      )

      const [mediaRows, countRows] = await Promise.all([
        db
          .select({
            id: mediaFiles.id,
            name: mediaFiles.name,
            mimeType: mediaFiles.mimeType,
            fileSize: mediaFiles.fileSize,
            cdnUrl: mediaFiles.cdnUrl,
            width: mediaFiles.width,
            height: mediaFiles.height,
            createdAt: mediaFiles.createdAt,
          })
          .from(mediaFiles)
          .where(conditions)
          .orderBy(desc(mediaFiles.createdAt))
          .limit(perPage)
          .offset((page - 1) * perPage),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(mediaFiles)
          .where(conditions),
      ])
      const mediaCount = countRows[0]?.count ?? 0

      return {
        items: mediaRows,
        total: mediaCount,
        pageCount: Math.ceil(mediaCount / perPage),
      }
    }),
})
