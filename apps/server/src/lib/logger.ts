/**
 * Lightweight structured logger.
 *
 * Provides context-aware logging with ISO timestamps, request IDs, and
 * severity levels. In production, these logs can be forwarded to any
 * structured logging system (Datadog, Grafana Loki, etc.).
 *
 * Usage:
 *   const log = logger({ requestId: ctx.req.id, userId: ctx.user.id })
 *   log.info("Product created", { productId: "abc" })
 *   log.error("Failed to create product", { error: err.message })
 */

type LogContext = Record<string, unknown>

interface Logger {
  info: (message: string, data?: LogContext) => void
  warn: (message: string, data?: LogContext) => void
  error: (message: string, data?: LogContext) => void
}

let _requestIdCounter = 0

/**
 * Generate a short, unique request ID if one isn't provided.
 */
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${(++_requestIdCounter).toString(36)}`
}

/**
 * Format a structured log line.
 * Output: ISO timestamp | LEVEL | requestId | message | { ...json data }
 */
function formatLog(
  level: string,
  message: string,
  context: LogContext,
  data?: LogContext,
): string {
  const timestamp = new Date().toISOString()
  const base = `${timestamp} | ${level.padEnd(5)} | ${context.requestId ?? "-"} | ${message}`
  const merged = { ...context, ...data }
  // Remove requestId from the JSON blob since it's already in the prefix
  const { requestId: _, ...rest } = merged as { requestId?: string } & LogContext
  const suffix =
    Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : ""
  return base + suffix
}

/**
 * Create a structured logger with the given base context.
 *
 * @param context - Base context that will be included in every log line
 *   (e.g., { requestId, userId, operation }).
 */
export function logger(context: LogContext = {}): Logger {
  const resolvedContext = {
    requestId: context.requestId ?? generateRequestId(),
    ...context,
  }

  // Only destructure context away from the closure capture
  const ctx = { ...resolvedContext }

  return {
    info: (message: string, data?: LogContext) => {
      console.log(formatLog("INFO", message, ctx, data))
    },
    warn: (message: string, data?: LogContext) => {
      console.warn(formatLog("WARN", message, ctx, data))
    },
    error: (message: string, data?: LogContext) => {
      console.error(formatLog("ERROR", message, ctx, data))
    },
  }
}

export type { Logger }
