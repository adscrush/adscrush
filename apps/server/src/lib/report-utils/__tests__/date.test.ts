import { describe, it, expect } from "vitest"
import { getRange } from "../date"

describe("getRange", () => {
  it("returns today range", () => {
    const { start, end } = getRange("today")
    const now = new Date()
    expect(start.getFullYear()).toBe(now.getFullYear())
    expect(start.getMonth()).toBe(now.getMonth())
    expect(start.getDate()).toBe(now.getDate())
    expect(start.getHours()).toBe(0)
    expect(start.getMinutes()).toBe(0)
    expect(end.getHours()).toBe(23)
    expect(end.getMinutes()).toBe(59)
  })

  it("returns this_month range", () => {
    const { start, end } = getRange("this_month")
    const now = new Date()
    expect(start.getDate()).toBe(1)
    expect(start.getHours()).toBe(0)
    expect(end.getMonth()).toBe(now.getMonth())
  })

  it("returns all_time range starting from epoch", () => {
    const { start } = getRange("all_time")
    expect(start.getTime()).toBe(0)
  })

  it("handles custom range with from/to", () => {
    const { start, end } = getRange("custom", "2024-01-15", "2024-02-15")
    expect(start.getFullYear()).toBe(2024)
    expect(start.getMonth()).toBe(0) // January
    expect(start.getDate()).toBe(15)
    expect(end.getMonth()).toBe(1) // February
    expect(end.getDate()).toBe(15)
  })

  it("uses defaults for custom without from/to", () => {
    const { start, end } = getRange("custom")
    const now = new Date()
    expect(start.getDate()).toBe(1) // start of month
    expect(end.getDate()).toBe(now.getDate())
  })

  it("uses this_month as default for unknown period", () => {
    const now = new Date()
    const { start, end } = getRange("unknown_period" as string)
    expect(start.getDate()).toBe(1)
    expect(end.getMonth()).toBe(now.getMonth())
  })
})
