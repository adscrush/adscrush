import postgres from "postgres"
import "dotenv/config"

const POOLER_URL = process.env["DATABASE_URL"] ?? "postgres://adscrush:adscrush@localhost:5432/adscrush"
const [baseUrl] = POOLER_URL.split("?")

function formatPartitionSuffix(date: Date): string {
  return `${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, "0")}`
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1)
}

async function managePartitions() {
  const sql = postgres(baseUrl)

  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const start = startOfMonth(nextMonth)
  const end = endOfMonth(nextMonth)
  const partSuffix = formatPartitionSuffix(nextMonth)

  const tables = ["clicks", "conversions", "audit_log"]

  // Ensure next month's partitions exist
  for (const tbl of tables) {
    const partName = `${tbl}_${partSuffix}`

    const [exists] = await sql.unsafe<{ exists: boolean }[]>(
      `SELECT EXISTS (SELECT 1 FROM pg_class WHERE relname = '${partName}') AS exists`
    )

    if (exists?.exists) {
      console.log(`Partition ${partName} already exists — skipping`)
      continue
    }

    const startStr = start.toISOString().split("T")[0]
    const endStr = end.toISOString().split("T")[0]
    await sql.unsafe(`
      CREATE TABLE ${partName} PARTITION OF ${tbl}
      FOR VALUES FROM ('${startStr}') TO ('${endStr}')
    `)

    console.log(`Created partition ${partName}`)
  }

  // Detach partitions older than 13 months (data preserved for archival)
  const cutoff = new Date(now.getFullYear(), now.getMonth() - 12, 1)

  for (const tbl of tables) {
    const rows = await sql.unsafe<{ relname: string }[]>(`
      SELECT relname FROM pg_class
      WHERE relname ~ '^${tbl}_\\d{4}_\\d{2}$'
      AND relkind = 'r'
      ORDER BY relname
    `)

    for (const { relname } of rows) {
      // Extract year/month from the partition suffix
      const suffix = relname.replace(`${tbl}_`, "")
      const [yearStr, monthStr] = suffix.split("_")
      const partDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1)

      if (partDate < cutoff) {
        console.log(`Detaching partition ${relname} (older than 12 months)...`)
        await sql.unsafe(`ALTER TABLE ${tbl} DETACH PARTITION ${relname}`)
        console.log(`Detached ${relname}. Data preserved for archival.`)
      }
    }
  }

  await sql.end()
  console.log("Partition management complete")
}

managePartitions()
