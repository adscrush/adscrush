import { describe, it, expect } from "vitest"
import { rowGroupKey, NULL_GROUP_KEY } from "../registry"

describe("rowGroupKey", () => {
  it("returns the id when non-null", () => {
    expect(rowGroupKey("abc-123")).toBe("abc-123")
  })

  it("returns NULL_GROUP_KEY when null", () => {
    expect(rowGroupKey(null)).toBe(NULL_GROUP_KEY)
  })
})

// Note: getGroupByColumns and BREAKDOWN_FIELDS depend on Drizzle column
// references (clicks.id, products.id, etc.) which require the full Drizzle
// ORM to be initialized. Integration tests for these would need a database
// connection or the Drizzle client to be mocked.
