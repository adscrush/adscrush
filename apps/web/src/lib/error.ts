/* ── Helpers ───────────────────────────────────────────────────────── */

export function parseApiError(errorPayload: unknown): string {
  if (!errorPayload) return "An unexpected error occurred"

  // Handle Eden error object: { status, value, ... }
  const obj = errorPayload as Record<string, unknown> | unknown[]
  let data: unknown

  if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
    const record = obj as Record<string, unknown>
    // Eden wraps errors: { status: number, value: {...} }
    if (record.status !== undefined && record.value !== undefined) {
      data = record.value
    } else {
      data = record
    }
  } else {
    data = obj
  }

  // If data itself is a string, return it
  if (typeof data === "string") return data

  // If data is an array, stringify it
  if (Array.isArray(data)) return JSON.stringify(data)

  // If data is an object, look for common error fields
  if (typeof data === "object" && data !== null) {
    const dataObj = data as Record<string, unknown>
    if (dataObj.error) return String(dataObj.error)
    if (dataObj.message) return String(dataObj.message)
    if (dataObj.details) return String(dataObj.details)
    // Fallback: stringify the object
    try {
      return JSON.stringify(dataObj)
    } catch {
      return "An unexpected error occurred"
    }
  }

  // For any other type (number, boolean, etc.)
  return String(data) || "An unexpected error occurred"
}
