type LogContext = Record<string, unknown>

interface Logger {
  info: (message: string, data?: LogContext) => void
  warn: (message: string, data?: LogContext) => void
  error: (message: string, data?: LogContext) => void
}

function formatLog(level: string, message: string, data?: LogContext): string {
  const timestamp = new Date().toISOString()
  const base = `${timestamp} | ${level.padEnd(5)} | [tracking] | ${message}`
  const suffix = data && Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : ""
  return base + suffix
}

export function logger(context?: LogContext): Logger {
  return {
    info: (message: string, data?: LogContext) => {
      console.log(formatLog("INFO", message, { ...context, ...data }))
    },
    warn: (message: string, data?: LogContext) => {
      console.warn(formatLog("WARN", message, { ...context, ...data }))
    },
    error: (message: string, data?: LogContext) => {
      console.error(formatLog("ERROR", message, { ...context, ...data }))
    },
  }
}
