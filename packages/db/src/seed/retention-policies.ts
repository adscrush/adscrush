import { createDatabase } from "../client"
import { retentionPolicies } from "../schema/retention-policies"
import "dotenv/config"

const db = createDatabase()

async function seed() {
  console.log("Seeding retention policies...")

  const defaults = [
    { entityType: "clicks", piiRetentionDays: 90, rowRetentionDays: 365, description: "Click event PII scrubbed after 90d, rows retained 1y" },
    { entityType: "conversions", piiRetentionDays: 90, rowRetentionDays: 365, description: "Conversion event PII scrubbed after 90d, rows retained 1y" },
    { entityType: "audit_log", piiRetentionDays: 90, rowRetentionDays: 730, description: "Audit log retained 2y" },
  ]

  for (const policy of defaults) {
    await db
      .insert(retentionPolicies)
      .values(policy)
      .onConflictDoNothing({ target: retentionPolicies.entityType })
    console.log(`  Retention policy: ${policy.entityType} (PII: ${policy.piiRetentionDays}d, row: ${policy.rowRetentionDays}d)`)
  }

  console.log("Retention policies seeded!")
}

export default seed
