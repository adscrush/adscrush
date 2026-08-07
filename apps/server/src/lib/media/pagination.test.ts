import { describe, expect, it } from "vitest"
import {
  encodeCursor,
  decodeCursor,
  buildPaginationQuery,
  buildPaginatedResult,
  type CursorPayload,
} from "./pagination"

// ─── encodeCursor / decodeCursor ─────────────────────────────────────────────

describe("encodeCursor", () => {
  it("encodes a payload with string sortValue", () => {
    const payload: CursorPayload = { id: "mfile_abc123", sortValue: "photo.jpg" }
    const cursor = encodeCursor(payload)
    expect(typeof cursor).toBe("string")
    expect(cursor.length).toBeGreaterThan(0)
    // base64url should not contain +, /, or =
    expect(cursor).not.toMatch(/[+/=]/)
  })

  it("encodes a payload with numeric sortValue", () => {
    const payload: CursorPayload = { id: "mfile_xyz", sortValue: 1024000 }
    const cursor = encodeCursor(payload)
    expect(typeof cursor).toBe("string")
  })

  it("produces different cursors for different payloads", () => {
    const cursor1 = encodeCursor({ id: "a", sortValue: "x" })
    const cursor2 = encodeCursor({ id: "b", sortValue: "y" })
    expect(cursor1).not.toBe(cursor2)
  })
})

describe("decodeCursor", () => {
  it("decodes a valid cursor with string sortValue", () => {
    const payload: CursorPayload = { id: "mfile_abc123", sortValue: "photo.jpg" }
    const cursor = encodeCursor(payload)
    const decoded = decodeCursor(cursor)
    expect(decoded).toEqual(payload)
  })

  it("decodes a valid cursor with numeric sortValue", () => {
    const payload: CursorPayload = { id: "mfile_xyz", sortValue: 5000 }
    const cursor = encodeCursor(payload)
    const decoded = decodeCursor(cursor)
    expect(decoded).toEqual(payload)
  })

  it("returns null for empty string", () => {
    expect(decodeCursor("")).toBeNull()
  })

  it("returns null for invalid base64", () => {
    expect(decodeCursor("!!!not-valid-base64!!!")).toBeNull()
  })

  it("returns null for valid base64 but invalid JSON", () => {
    const notJson = Buffer.from("not json at all").toString("base64url")
    expect(decodeCursor(notJson)).toBeNull()
  })

  it("returns null for valid JSON but missing id field", () => {
    const noId = Buffer.from(JSON.stringify({ sortValue: "test" })).toString("base64url")
    expect(decodeCursor(noId)).toBeNull()
  })

  it("returns null for valid JSON but missing sortValue field", () => {
    const noSort = Buffer.from(JSON.stringify({ id: "abc" })).toString("base64url")
    expect(decodeCursor(noSort)).toBeNull()
  })

  it("returns null for valid JSON but wrong types", () => {
    const wrongTypes = Buffer.from(JSON.stringify({ id: 123, sortValue: true })).toString("base64url")
    expect(decodeCursor(wrongTypes)).toBeNull()
  })

  it("roundtrips encode/decode correctly", () => {
    const payloads: CursorPayload[] = [
      { id: "mfile_1", sortValue: "2024-01-15T10:30:00.000Z" },
      { id: "mfile_2", sortValue: 0 },
      { id: "mfile_3", sortValue: "" },
      { id: "mfile_4", sortValue: Number.MAX_SAFE_INTEGER },
    ]
    for (const payload of payloads) {
      const decoded = decodeCursor(encodeCursor(payload))
      expect(decoded).toEqual(payload)
    }
  })
})

// ─── buildPaginationQuery ────────────────────────────────────────────────────

describe("buildPaginationQuery", () => {
  it("returns no WHERE condition when cursor is null", () => {
    const result = buildPaginationQuery({
      cursor: null,
      pageSize: 50,
      sortBy: "dateUploaded",
      sortOrder: "desc",
    })
    expect(result.where).toBeUndefined()
    expect(result.limit).toBe(51) // pageSize + 1
    expect(result.orderBy).toHaveLength(2)
  })

  it("returns no WHERE condition when cursor is undefined", () => {
    const result = buildPaginationQuery({
      cursor: undefined,
      pageSize: 20,
      sortBy: "name",
      sortOrder: "asc",
    })
    expect(result.where).toBeUndefined()
    expect(result.limit).toBe(21)
  })

  it("returns no WHERE condition for malformed cursor", () => {
    const result = buildPaginationQuery({
      cursor: "garbage-cursor-value",
      pageSize: 10,
      sortBy: "size",
      sortOrder: "desc",
    })
    expect(result.where).toBeUndefined()
    expect(result.limit).toBe(11)
  })

  it("returns WHERE condition for valid cursor with createdAt sort", () => {
    const cursor = encodeCursor({ id: "mfile_abc", sortValue: "2024-06-01T12:00:00.000Z" })
    const result = buildPaginationQuery({
      cursor,
      pageSize: 50,
      sortBy: "dateUploaded",
      sortOrder: "desc",
    })
    expect(result.where).toBeDefined()
    expect(result.limit).toBe(51)
    expect(result.orderBy).toHaveLength(2)
  })

  it("returns WHERE condition for valid cursor with name sort", () => {
    const cursor = encodeCursor({ id: "mfile_xyz", sortValue: "banner.png" })
    const result = buildPaginationQuery({
      cursor,
      pageSize: 25,
      sortBy: "name",
      sortOrder: "asc",
    })
    expect(result.where).toBeDefined()
    expect(result.limit).toBe(26)
  })

  it("returns WHERE condition for valid cursor with fileSize sort", () => {
    const cursor = encodeCursor({ id: "mfile_123", sortValue: 2048000 })
    const result = buildPaginationQuery({
      cursor,
      pageSize: 100,
      sortBy: "size",
      sortOrder: "desc",
    })
    expect(result.where).toBeDefined()
    expect(result.limit).toBe(101)
  })
})

// ─── buildPaginatedResult ────────────────────────────────────────────────────

describe("buildPaginatedResult", () => {
  it("returns null nextCursor when items count <= pageSize", () => {
    const items = [
      { id: "1", name: "a.jpg", createdAt: new Date(), fileSize: 100 },
      { id: "2", name: "b.jpg", createdAt: new Date(), fileSize: 200 },
    ]
    const result = buildPaginatedResult(items, 10, "name")
    expect(result.items).toHaveLength(2)
    expect(result.nextCursor).toBeNull()
  })

  it("returns null nextCursor for empty items", () => {
    const result = buildPaginatedResult([], 50, "dateUploaded")
    expect(result.items).toHaveLength(0)
    expect(result.nextCursor).toBeNull()
  })

  it("returns nextCursor when items count > pageSize", () => {
    const items = Array.from({ length: 11 }, (_, i) => ({
      id: `mfile_${i}`,
      name: `file_${i}.png`,
      createdAt: new Date("2024-01-01"),
      fileSize: (i + 1) * 1000,
    }))
    const result = buildPaginatedResult(items, 10, "name")
    expect(result.items).toHaveLength(10)
    expect(result.nextCursor).not.toBeNull()

    // Verify the cursor encodes the last included item
    const decoded = decodeCursor(result.nextCursor!)
    expect(decoded).not.toBeNull()
    expect(decoded!.id).toBe("mfile_9") // last item in the 10-item slice
    expect(decoded!.sortValue).toBe("file_9.png")
  })

  it("encodes createdAt as ISO string in cursor", () => {
    const date = new Date("2024-06-15T08:30:00.000Z")
    const items = Array.from({ length: 3 }, (_, i) => ({
      id: `mfile_${i}`,
      name: `file_${i}.png`,
      createdAt: date,
      fileSize: 500,
    }))
    const result = buildPaginatedResult(items, 2, "dateUploaded")
    expect(result.nextCursor).not.toBeNull()

    const decoded = decodeCursor(result.nextCursor!)
    expect(decoded!.sortValue).toBe("2024-06-15T08:30:00.000Z")
  })

  it("encodes fileSize as number in cursor", () => {
    const items = Array.from({ length: 6 }, (_, i) => ({
      id: `mfile_${i}`,
      name: `file_${i}.png`,
      createdAt: new Date(),
      fileSize: (i + 1) * 1024,
    }))
    const result = buildPaginatedResult(items, 5, "size")
    expect(result.nextCursor).not.toBeNull()

    const decoded = decodeCursor(result.nextCursor!)
    expect(decoded!.sortValue).toBe(5 * 1024)
  })

  it("exactly pageSize items returns no nextCursor", () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      id: `mfile_${i}`,
      name: `file_${i}.png`,
      createdAt: new Date(),
      fileSize: 100,
    }))
    const result = buildPaginatedResult(items, 50, "name")
    expect(result.items).toHaveLength(50)
    expect(result.nextCursor).toBeNull()
  })
})
