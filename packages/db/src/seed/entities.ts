import { createDatabase } from "../client"
import { advertisers } from "../schema/advertisers"
import { mediaBuyers } from "../schema/media-buyers"
import { employees } from "../schema/employees"
import { users } from "../schema/auth"
import { ROLES } from "@adscrush/shared/constants/roles"
import { ADVERTISER_STATUS, MEDIA_BUYER_KIND, MEDIA_BUYER_STATUS, EMPLOYEE_STATUS } from "@adscrush/shared/constants/status"
import "dotenv/config"
import { eq } from "drizzle-orm"

const db = createDatabase()

async function seed() {
  console.log("🌱 Seeding Advertisers and Affiliates...")

  try {
    // 1. Ensure we have an employee to assign as AM
    let amEmployee = await db.query.employees.findFirst()

    if (!amEmployee) {
      console.log("Creating a default employee...")
      const [user] = await db
        .insert(users)
        .values({
          name: "Default Employee",
          email: "employee@adscrush.com",
          role: ROLES.EMPLOYEE,
        })
        .onConflictDoNothing()
        .returning()

      const userId =
        user?.id || (await db.query.users.findFirst({ where: eq(users.email, "employee@adscrush.com") }))?.id

      if (userId) {
        const [employee] = await db
          .insert(employees)
          .values({
            userId,
            status: EMPLOYEE_STATUS.APPROVED,
          })
          .onConflictDoNothing()
          .returning()

        amEmployee = employee || (await db.query.employees.findFirst({ where: eq(employees.userId, userId) }))
      }
    }

    const amId = amEmployee?.id

    // 2. Seed Advertisers
    const advertiserData = [
      {
        name: "Global Brands Inc",
        companyName: "Global Brands",
        email: "contact@globalbrands.com",
        website: "https://globalbrands.com",
        country: "USA",
      },
      {
        name: "Tech Solutions Ltd",
        companyName: "Tech Solutions",
        email: "info@techsolutions.io",
        website: "https://techsolutions.io",
        country: "UK",
      },
      {
        name: "Direct Marketing Group",
        companyName: "Direct Marketing",
        email: "sales@directmarketing.com",
        website: "https://directmarketing.com",
        country: "Canada",
      },
      {
        name: "AdMedia Pro",
        companyName: "AdMedia",
        email: "hello@admediapro.com",
        website: "https://admediapro.com",
        country: "Germany",
      },
      {
        name: "Lead Gen Experts",
        companyName: "Lead Gen",
        email: "partners@leadgenexperts.com",
        website: "https://leadgenexperts.com",
        country: "Australia",
      },
    ]

    console.log("Seeding Advertisers...")
    for (const adv of advertiserData) {
      const [user] = await db
        .insert(users)
        .values({
          name: adv.name,
          email: adv.email,
          role: ROLES.ADVERTISER,
        })
        .onConflictDoNothing()
        .returning()

      const userId = user?.id || (await db.query.users.findFirst({ where: eq(users.email, adv.email) }))?.id

      if (userId) {
        await db
          .insert(advertisers)
          .values({
            ...adv,
            userId,
            accountManagerId: amId,
            status: ADVERTISER_STATUS.ACTIVE,
          })
          .onConflictDoNothing()
        console.log(`✅ Added Advertiser: ${adv.name}`)
      }
    }

    // 3. Seed Media Buyers
    const mediaBuyerData = [
      { name: "John Doe Marketing", companyName: "JD Media", email: "john@jdmedia.com" },
      { name: "Traffic Kings", companyName: "Traffic Kings", email: "admin@traffickings.com" },
      { name: "Performance Partners", companyName: "PP Agency", email: "contact@performancepartners.net" },
      { name: "Social Media Ninja", companyName: "Ninja Media", email: "ninja@socialmedianinja.io" },
      { name: "Growth Hackers", companyName: "Growth Hackers", email: "growth@growthhackers.co" },
    ]

    console.log("Seeding Media Buyers...")
    for (const aff of mediaBuyerData) {
      const [user] = await db
        .insert(users)
        .values({
          name: aff.name,
          email: aff.email,
          role: ROLES.MEDIA_BUYER,
        })
        .onConflictDoNothing()
        .returning()

      const userId = user?.id || (await db.query.users.findFirst({ where: eq(users.email, aff.email) }))?.id

      if (userId) {
        await db
          .insert(mediaBuyers)
          .values({
            ...aff,
            userId,
            kind: MEDIA_BUYER_KIND.EXTERNAL,
            accountManagerId: amId,
            status: MEDIA_BUYER_STATUS.ACTIVE,
          })
          .onConflictDoNothing()
        console.log(`✅ Added Media Buyer: ${aff.name}`)
      }
    }

    console.log("✨ Seeding entities completed!")
  } catch (error) {
    console.error("❌ Entity seeding failed:", error)
  }
}

export default seed
