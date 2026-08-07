import { describe, it, expect } from "vitest"
import {
  formatCurrency,
  formatPercent,
  escapeCsvValue,
  generateCsv,
} from "../utils"

describe("formatCurrency", () => {
  it("formats zero as $0.00", () => {
    expect(formatCurrency(0)).toBe("$0.00")
  })

  it("formats whole numbers with two decimal places", () => {
    expect(formatCurrency(100)).toBe("$100.00")
  })

  it("formats with comma-separated thousands", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56")
  })

  it("formats large numbers correctly", () => {
    expect(formatCurrency(1000000.99)).toBe("$1,000,000.99")
  })

  it("rounds to two decimal places", () => {
    expect(formatCurrency(1234.567)).toBe("$1,234.57")
  })

  it("formats small decimals with two places", () => {
    expect(formatCurrency(0.1)).toBe("$0.10")
  })

  it("formats negative numbers", () => {
    expect(formatCurrency(-500.5)).toBe("-$500.50")
  })
})

describe("formatPercent", () => {
  it("formats zero as 0.00%", () => {
    expect(formatPercent(0)).toBe("0.00%")
  })

  it("formats with exactly two decimal places", () => {
    expect(formatPercent(12.345)).toBe("12.35%")
  })

  it("formats whole numbers with two decimal places", () => {
    expect(formatPercent(100)).toBe("100.00%")
  })

  it("formats small values", () => {
    expect(formatPercent(0.1)).toBe("0.10%")
  })

  it("formats negative values", () => {
    expect(formatPercent(-5.5)).toBe("-5.50%")
  })
})

describe("escapeCsvValue", () => {
  it("returns plain values unchanged", () => {
    expect(escapeCsvValue("hello")).toBe("hello")
  })

  it("wraps values with commas in double quotes", () => {
    expect(escapeCsvValue("hello,world")).toBe('"hello,world"')
  })

  it("wraps values with double quotes and doubles them", () => {
    expect(escapeCsvValue('say "hi"')).toBe('"say ""hi"""')
  })

  it("wraps values with newlines in double quotes", () => {
    expect(escapeCsvValue("line1\nline2")).toBe('"line1\nline2"')
  })

  it("wraps values with carriage returns in double quotes", () => {
    expect(escapeCsvValue("line1\rline2")).toBe('"line1\rline2"')
  })

  it("handles values with both commas and quotes", () => {
    expect(escapeCsvValue('a "b", c')).toBe('"a ""b"", c"')
  })

  it("returns empty string unchanged", () => {
    expect(escapeCsvValue("")).toBe("")
  })
})

describe("generateCsv", () => {
  const columns = [
    { id: "name", label: "Name" },
    { id: "clicks", label: "Clicks" },
    { id: "revenue", label: "Revenue" },
  ]

  const rows = [
    { name: "Campaign A", clicks: 100, revenue: 1234.56 },
    { name: "Campaign B", clicks: 200, revenue: 5678.9 },
  ]

  it("includes only visible columns", () => {
    const csv = generateCsv(columns, rows, ["name", "revenue"])
    const lines = csv.split("\r\n")
    expect(lines[0]).toBe("Name,Revenue")
    expect(lines[1]).toBe("Campaign A,1234.56")
    expect(lines[2]).toBe("Campaign B,5678.9")
  })

  it("uses column labels as header row", () => {
    const csv = generateCsv(columns, rows, ["name", "clicks", "revenue"])
    const header = csv.split("\r\n")[0]
    expect(header).toBe("Name,Clicks,Revenue")
  })

  it("escapes values containing special characters", () => {
    const specialRows = [{ name: 'Campaign "X", Ltd', clicks: 50, revenue: 100 }]
    const csv = generateCsv(columns, specialRows, ["name", "clicks"])
    const lines = csv.split("\r\n")
    expect(lines[1]).toBe('"Campaign ""X"", Ltd",50')
  })

  it("handles null and undefined values as empty strings", () => {
    const nullRows = [{ name: null, clicks: undefined, revenue: 0 }]
    const csv = generateCsv(columns, nullRows, ["name", "clicks", "revenue"])
    const lines = csv.split("\r\n")
    expect(lines[1]).toBe(",,0")
  })

  it("preserves column order from visibleColumnIds matching columns array order", () => {
    const csv = generateCsv(columns, rows, ["revenue", "name"])
    const lines = csv.split("\r\n")
    // Order follows columns array filtered by visibleColumnIds
    expect(lines[0]).toBe("Name,Revenue")
  })

  it("uses CRLF line endings per RFC 4180", () => {
    const csv = generateCsv(columns, rows, ["name"])
    expect(csv).toContain("\r\n")
    expect(csv.split("\r\n").length).toBe(3) // header + 2 rows
  })

  it("returns only header when rows are empty", () => {
    const csv = generateCsv(columns, [], ["name", "clicks"])
    expect(csv).toBe("Name,Clicks")
  })
})
