/**
 * Shared CSV utilities with formula injection protection.
 *
 * Spreadsheet formula injection occurs when a cell value starts with
 * `=`, `+`, `-`, or `@`. Excel, Google Sheets, and LibreOffice treat
 * these as formula prefixes. We prepend a single quote to neutralise them.
 */

const FORMULA_PREFIXES = ["=", "+", "-", "@"]

/**
 * Escape a single CSV cell value.
 * - Wraps in double-quotes if the value contains a comma, double-quote, or newline.
 * - Doubles any existing double-quotes inside the value.
 * - Prepends a single-quote to prevent spreadsheet formula injection
 *   when the value starts with a dangerous prefix (=, +, -, @).
 *   Note: newline-containing values are already handled by RFC 4180 double-quoting.
 */
export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ""

  const str = String(value)

  // Formula injection protection
  const needsQuoting = FORMULA_PREFIXES.some((prefix) => str.startsWith(prefix))
  const safe = needsQuoting ? `'${str}` : str

  // Standard CSV escaping (RFC 4180)
  if (safe.includes(",") || safe.includes('"') || safe.includes("\n") || safe.includes("\r")) {
    return `"${safe.replace(/"/g, '""')}"`
  }

  return safe
}
