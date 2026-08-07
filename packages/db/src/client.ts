import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema/index"

export interface DatabaseConfig {
  url?: string
  /** Maximum number of connections in the pool. Default: 10 */
  max?: number
  /** Maximum time (ms) a connection can be idle before being closed. Default: no timeout */
  idle_timeout?: number
  /** Maximum time (ms) to wait for a new connection. Default: no timeout */
  connect_timeout?: number
  /** Maximum lifetime (ms) of a connection. Default: no limit */
  max_lifetime?: number
  /** Time (ms) after which idle connections are created. Default: idle_timeout / 2 */
  connection_lifetime?: number
}

export function createDatabase(config?: DatabaseConfig) {
  const connectionString = config?.url ?? process.env["DATABASE_URL"]

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required")
  }

  // Only pass defined options to postgres client
  const pgOptions: Record<string, unknown> = {
    max: config?.max ?? 10,
  }

  if (config?.idle_timeout !== undefined) pgOptions.idle_timeout = config.idle_timeout
  if (config?.connect_timeout !== undefined) pgOptions.connect_timeout = config.connect_timeout
  if (config?.max_lifetime !== undefined) pgOptions.max_lifetime = config.max_lifetime
  if (config?.connection_lifetime !== undefined) pgOptions.connection_lifetime = config.connection_lifetime

  const client = postgres(connectionString, pgOptions)

  return drizzle(client, { schema })
}

export type Database = ReturnType<typeof createDatabase>
