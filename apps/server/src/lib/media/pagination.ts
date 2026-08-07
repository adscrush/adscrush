import { and, asc, desc, gt, lt, or, eq, type SQL } from "@adscrush/db/drizzle"
import { mediaFiles } from "@adscrush/db/schema"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CursorPayload {
  id: string
  sortValue: string | number
}

export type SortField = "name" | "size" | "dateUploaded" | "fileType"
export type SortOrder = "asc" | "desc"

export interface PaginationOptions {
  cursor?: string | null
  pageSize: number
  sortBy: SortField
  sortOrder: SortOrder
}

export interface PaginatedResult<T> {
  items: T[]
  nextCursor: string | null
}

// ─── Cursor Encoding / Decoding ──────────────────────────────────────────────

/**
 * Encodes a cursor payload as a base64url JSON string.
 */
export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url")
}

/**
 * Decodes a base64url cursor string into a CursorPayload.
 * Returns null if the cursor is malformed or cannot be parsed.
 */
export function decodeCursor(cursor: string): CursorPayload | null {
  try {
    const json = Buffer.from(cursor, "base64url").toString("utf-8")
    const parsed = JSON.parse(json)

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.id !== "string" ||
      (typeof parsed.sortValue !== "string" && typeof parsed.sortValue !== "number")
    ) {
      return null
    }

    return { id: parsed.id, sortValue: parsed.sortValue }
  } catch {
    return null
  }
}

// ─── Column Mapping ──────────────────────────────────────────────────────────

function getSortColumn(sortBy: SortField) {
  switch (sortBy) {
    case "name":
      return mediaFiles.name
    case "dateUploaded":
      return mediaFiles.createdAt
    case "size":
      return mediaFiles.fileSize
    case "fileType":
      return mediaFiles.mimeType
  }
}

// ─── Paginated Query Builder ─────────────────────────────────────────────────

/**
 * Builds cursor-based pagination conditions for Drizzle queries on the mediaFiles table.
 *
 * Returns:
 * - `where`: A SQL condition to apply as a WHERE clause (or undefined if no cursor)
 * - `orderBy`: An array of order-by expressions to apply
 * - `limit`: The number of items to fetch (pageSize + 1 to detect next page)
 *
 * The caller fetches `limit` items, then uses `buildPaginatedResult` to construct
 * the final result with the correct nextCursor.
 */
export function buildPaginationQuery(options: PaginationOptions): {
  where: SQL | undefined
  orderBy: SQL[]
  limit: number
} {
  const { cursor, pageSize, sortBy, sortOrder } = options
  const sortColumn = getSortColumn(sortBy)
  const idColumn = mediaFiles.id

  // Order by the sort column, then by id as tiebreaker (same direction)
  const dirFn = sortOrder === "asc" ? asc : desc
  const orderBy = [dirFn(sortColumn), dirFn(idColumn)]

  // Fetch one extra to determine if there's a next page
  const limit = pageSize + 1

  // If no cursor, no additional WHERE condition needed
  if (!cursor) {
    return { where: undefined, orderBy, limit }
  }

  const decoded = decodeCursor(cursor)
  if (!decoded) {
    return { where: undefined, orderBy, limit }
  }

  // Build the cursor WHERE condition using the "seek" method:
  // For ascending: (sortCol > cursorValue) OR (sortCol = cursorValue AND id > cursorId)
  // For descending: (sortCol < cursorValue) OR (sortCol = cursorValue AND id < cursorId)
  const compareFn = sortOrder === "asc" ? gt : lt
  const cursorSortValue = decoded.sortValue
  const cursorId = decoded.id

  // Cast the cursor value to the appropriate type for comparison
  let sortValueCondition: SQL
  let sortEqualCondition: SQL

  if (sortBy === "dateUploaded") {
    // For timestamp columns, compare as timestamps
    const tsValue = typeof cursorSortValue === "string" ? cursorSortValue : new Date(cursorSortValue).toISOString()
    sortValueCondition = compareFn(sortColumn, new Date(tsValue))
    sortEqualCondition = eq(sortColumn, new Date(tsValue))
  } else if (sortBy === "size") {
    // For numeric columns, compare as numbers
    const numValue = typeof cursorSortValue === "number" ? cursorSortValue : Number(cursorSortValue)
    sortValueCondition = compareFn(sortColumn, numValue)
    sortEqualCondition = eq(sortColumn, numValue)
  } else {
    // For text columns (name, fileType), compare as strings
    const strValue = String(cursorSortValue)
    sortValueCondition = compareFn(sortColumn, strValue)
    sortEqualCondition = eq(sortColumn, strValue)
  }

  const where = or(
    sortValueCondition,
    and(sortEqualCondition, compareFn(idColumn, cursorId)),
  )

  return { where: where!, orderBy, limit }
}

/**
 * Constructs a paginated result from a fetched items array.
 *
 * The input `items` should have been fetched with `limit = pageSize + 1`.
 * If more items than `pageSize` were returned, a next page exists and
 * the cursor is built from the last included item.
 */
export function buildPaginatedResult<T extends { id: string }>(
  items: T[],
  pageSize: number,
  sortBy: SortField,
): PaginatedResult<T> {
  const hasMore = items.length > pageSize
  const resultItems = hasMore ? items.slice(0, pageSize) : items

  if (!hasMore || resultItems.length === 0) {
    return { items: resultItems, nextCursor: null }
  }

  const lastItem = resultItems[resultItems.length - 1]!
  const sortValue = extractSortValue(lastItem, sortBy)

  const nextCursor = encodeCursor({ id: lastItem.id, sortValue })

  return { items: resultItems, nextCursor }
}

/**
 * Extracts the sort column value from a result item for cursor encoding.
 */
function extractSortValue(item: Record<string, unknown>, sortBy: SortField): string | number {
  switch (sortBy) {
    case "name":
      return item.name as string
    case "dateUploaded": {
      const val = item.createdAt
      if (val instanceof Date) return val.toISOString()
      return String(val)
    }
    case "size":
      return item.fileSize as number
    case "fileType":
      return item.mimeType as string
  }
}
