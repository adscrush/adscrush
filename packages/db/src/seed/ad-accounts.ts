import { createDatabase } from "../client"
import { adAccounts } from "../schema/ad-accounts"
import { AD_ACCOUNT_STATUS } from "@adscrush/shared/constants/status"
import "dotenv/config"

const db = createDatabase()

const adAccountData = [
  { name: "JD Media - FB Main", sourcePlatform: "facebook", accountId: "1023948573920", status: AD_ACCOUNT_STATUS.ACTIVE },
  { name: "JD Media - FB Backup", sourcePlatform: "facebook", accountId: "1023948573921", status: AD_ACCOUNT_STATUS.PAUSED },
  { name: "Traffic Kings - Google Ads", sourcePlatform: "google", accountId: "445-892-1103", status: AD_ACCOUNT_STATUS.ACTIVE },
  { name: "Traffic Kings - TikTok", sourcePlatform: "tiktok", accountId: "7284910384756", status: AD_ACCOUNT_STATUS.RISK_CONTROL },
  { name: "Performance Partners - Native", sourcePlatform: "native", accountId: "PP-NAT-0091", status: AD_ACCOUNT_STATUS.ACTIVE },
  { name: "Performance Partners - Taboola", sourcePlatform: "taboola", accountId: "tbl-556210", status: AD_ACCOUNT_STATUS.DISCONNECTED },
  { name: "Ninja Media - Outbrain", sourcePlatform: "outbrain", accountId: "obn-778912", status: AD_ACCOUNT_STATUS.ACTIVE },
  { name: "Ninja Media - FB", sourcePlatform: "facebook", accountId: "1023948573922", status: AD_ACCOUNT_STATUS.DISABLED },
  { name: "Growth Hackers - Google Ads", sourcePlatform: "google", accountId: "445-892-1104", status: AD_ACCOUNT_STATUS.ACTIVE },
  { name: "Growth Hackers - TikTok", sourcePlatform: "tiktok", accountId: "7284910384757", status: AD_ACCOUNT_STATUS.NOT_IN_USE },
]

async function seed() {
  console.log("🌱 Seeding Ad Accounts...")

  try {
    const allMediaBuyers = await db.query.mediaBuyers.findMany()
    if (allMediaBuyers.length === 0) {
      console.log("⚠️  No media buyers found — run seed:entities first. Skipping ad accounts.")
      return
    }

    for (const [index, account] of adAccountData.entries()) {
      const mediaBuyer = allMediaBuyers[index % allMediaBuyers.length]

      const [inserted] = await db
        .insert(adAccounts)
        .values({
          name: account.name,
          sourcePlatform: account.sourcePlatform,
          accountId: account.accountId,
          mediaBuyerId: mediaBuyer!.id,
          status: account.status,
        })
        .onConflictDoNothing()
        .returning()

      if (inserted) {
        console.log(`✅ Added Ad Account: ${account.name}`)
      } else {
        console.log(`↷ Skipped (exists): ${account.name}`)
      }
    }

    console.log("✨ Seeding ad accounts completed!")
  } catch (error) {
    console.error("❌ Ad account seeding failed:", error)
  }
}

export default seed
