/**
 * Utility functions for the Reports KPI feature.
 * Formatting and CSV export helpers.
 */

/**
 * Formats a number as currency: $X,XXX.XX
 * Always uses dollar sign, comma-separated thousands, exactly two decimal places.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Formats a number as a percentage: X.XX%
 * Always uses exactly two decimal places followed by percent symbol.
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`
}

/**
 * Escapes a CSV cell value per RFC 4180.
 * Wraps in double quotes if value contains commas, double quotes, or newlines.
 * Doubles any internal double quotes.
 */
export function escapeCsvValue(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Generates a CSV string from column definitions, row data, and visible column IDs.
 * - Header row uses column labels
 * - Only includes columns whose IDs are in visibleColumnIds
 * - Escapes all cell values per RFC 4180
 * - Rows are separated by CRLF per RFC 4180
 */
export function generateCsv<T extends object>(
  columns: { id: string; label: string }[],
  rows: T[],
  visibleColumnIds: string[]
): string {
  const visibleColumns = columns.filter((col) =>
    visibleColumnIds.includes(col.id)
  )

  const headerRow = visibleColumns
    .map((col) => escapeCsvValue(col.label))
    .join(",")

  const dataRows = rows.map((row) =>
    visibleColumns
      .map((col) => {
        const cellValue = (row as Record<string, unknown>)[col.id]
        const stringValue = cellValue == null ? "" : String(cellValue)
        return escapeCsvValue(stringValue)
      })
      .join(",")
  )

  return [headerRow, ...dataRows].join("\r\n")
}
