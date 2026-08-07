import postgres from "postgres"
import "dotenv/config"

const POOLER_URL = process.env["DATABASE_URL"] ?? "postgres://adscrush:adscrush@localhost:5432/adscrush"
const [baseUrl] = POOLER_URL.split("?")

interface RetentionRule {
  entityType: string
  piiRetentionDays: number
  rowRetentionDays: number
}

async function getRetentionPolicies(sql: postgres.Sql): Promise<RetentionRule[]> {
  return sql.unsafe<RetentionRule[]>(
    "SELECT entity_type, pii_retention_days, row_retention_days FROM retention_policies"
  )
}

async function purgePII() {
  const sql = postgres(baseUrl)

  const policies = await getRetentionPolicies(sql)

  if (policies.length === 0) {
    console.log("No retention policies found. Run seed first.")
    await sql.end()
    return
  }

  for (const policy of policies) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - policy.piiRetentionDays)

    console.log(`Purging PII for ${policy.entityType} (older than ${policy.piiRetentionDays}d)...`)

    switch (policy.entityType) {
      case "clicks":
        await sql.unsafe(`
          UPDATE clicks
          SET ip_encrypted = NULL,
              user_agent_encrypted = NULL
          WHERE created_at < ${cutoff.toISOString()}
          AND ip_encrypted IS NOT NULL
        `)
        break

      case "conversions":
        await sql.unsafe(`
          UPDATE conversions
          SET ip_encrypted = NULL,
              user_agent_encrypted = NULL
          WHERE created_at < ${cutoff.toISOString()}
          AND ip_encrypted IS NOT NULL
        `)
        break

      case "audit_log":
        await sql.unsafe(`
          UPDATE audit_log
          SET request_ip = NULL
          WHERE created_at < ${cutoff.toISOString()}
          AND request_ip IS NOT NULL
        `)
        break

      default:
        console.log(`  No PII scrub handler for ${policy.entityType}`)
    }

    console.log(`  Done.`)
  }

  // Row-level purge (delete entire rows past full retention)
  for (const policy of policies) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - policy.rowRetentionDays)

    console.log(`Purging old rows for ${policy.entityType} (older than ${policy.rowRetentionDays}d)...`)

    switch (policy.entityType) {
      case "audit_log": {
        const deleted = await sql.unsafe<{ count: number }[]>(`
          WITH deleted AS (
            DELETE FROM audit_log
            WHERE created_at < ${cutoff.toISOString()}
            RETURNING 1
          )
          SELECT COUNT(*) AS count FROM deleted
        `)
        console.log(`  Deleted ${deleted[0]?.count ?? 0} old rows`)
        break
      }

      default:
        // clicks and conversions are partition-managed (detach + archive), not row-deleted
        console.log(`  Row purge for ${policy.entityType} is handled by partition rotation`)
    }
  }

  await sql.end()
  console.log("PII purge complete")
}

purgePII()
