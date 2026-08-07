import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import postgres from "postgres"

const __dirname = dirname(fileURLToPath(import.meta.url))
const SQL_DIR = join(__dirname, "..", "sql")

const FILES = [
  "01_extensions.sql",
  "02_partitions.sql",
  "03_roles.sql",
  "04_rls.sql",
]

function parseStatements(raw: string): string[] {
  const lines = raw.split("\n")
  const statements: string[] = []
  const current: string[] = []
  let inBlockComment = false
  let inDollarQuote = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === "" && !inDollarQuote) continue

    // Track dollar-quoting ($$...$$ for PL/pgSQL blocks)
    if (trimmed.includes("$$")) {
      inDollarQuote = !inDollarQuote
    }

    // Toggle block comment state (not applicable inside dollar-quotes)
    if (!inDollarQuote) {
      if (trimmed.startsWith("/*")) {
        inBlockComment = true
        if (trimmed.endsWith("*/")) inBlockComment = false
        continue
      }
      if (inBlockComment) {
        if (trimmed.endsWith("*/")) inBlockComment = false
        continue
      }

      // Skip single-line comments outside dollar-quotes
      if (trimmed.startsWith("--")) continue

      // Remove inline comments (-- to end of line) — NOT inside dollar-quotes
    if (trimmed.includes("--") && !inDollarQuote) {
      const parts = trimmed.split("--")
      const before = parts[0]!.trimEnd()
        if (before.length > 0) {
          current.push(before)
        }
        continue
      }
    }

    current.push(trimmed)

    // End of statement (semicolon outside dollar-quoting or at top level)
    if (!inDollarQuote && trimmed.endsWith(";")) {
      const stmt = current.join("\n").trim()
      if (stmt.length > 1) {
        statements.push(stmt)
      }
      current.length = 0
    }
  }

  if (current.length > 0) {
    const stmt = current.join("\n").trim()
    if (stmt.length > 1) {
      statements.push(stmt)
    }
  }

  return statements
}

async function applySQL() {
  const connectionString = process.env["DATABASE_URL"]
  if (!connectionString) {
    console.error("DATABASE_URL environment variable is required")
    process.exit(1)
  }

  const sql = postgres(connectionString)

  for (const file of FILES) {
    const filePath = join(SQL_DIR, file)
    const raw = readFileSync(filePath, "utf-8")
    const statements = parseStatements(raw)

    console.log(`Applying ${file} (${statements.length} statements)...`)

    for (const stmt of statements) {
      try {
        await sql.unsafe(stmt)
      } catch (err: unknown) {
        const pgErr = err as { code?: string; message?: string }
        if (
          pgErr.code === "42710" ||
          pgErr.code === "23505" ||
          pgErr.code === "0A000" ||
          pgErr.message?.includes("already exists")
        ) {
          continue
        }
        console.error(`Error in ${file}: ${pgErr.message}`)
        console.error(`Statement: ${stmt.slice(0, 200)}...`)
        throw err
      }
    }
  }

  await sql.end()
  console.log("All SQL files applied successfully.")
  process.exit(0)
}

applySQL()
