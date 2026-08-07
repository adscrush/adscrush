import { createDatabase } from "../client"
import { funnels } from "../schema/funnels"
import { landingPages } from "../schema/landing-pages"
import { products } from "../schema/products"
import { FUNNEL_STATUS, type FunnelStatus } from "@adscrush/shared/constants/status"
import "dotenv/config"
import { and, eq } from "drizzle-orm"

const db = createDatabase()

interface FunnelSeed {
  productName: string
  language: string
  domain: string
  pageUrl: string
  thankYouPageUrl: string
  status: FunnelStatus
  landingPages: Array<{ name: string; url: string; weight?: number }>
}

const funnelData: FunnelSeed[] = [
  {
    productName: "PowerPlus Male Enhancement",
    language: "en",
    domain: "powerplus.ojasvati.shop",
    pageUrl: "https://powerplus.ojasvati.shop/page",
    thankYouPageUrl: "https://powerplus.ojasvati.shop/thankyou",
    status: FUNNEL_STATUS.ACTIVE,
    landingPages: [
      { name: "PowerPlus LP1", url: "https://powerplus.ojasvati.shop/lp1/", weight: 50 },
      { name: "PowerPlus LP2", url: "https://powerplus.ojasvati.shop/lp2/", weight: 30 },
      { name: "PowerPlus LP3", url: "https://powerplus.ojasvati.shop/lp3/", weight: 20 },
    ],
  },
  {
    productName: "PowerPlus Male Enhancement",
    language: "es",
    domain: "powerplus.ojasvati.shop",
    pageUrl: "https://powerplus.ojasvati.shop/es/page",
    thankYouPageUrl: "https://powerplus.ojasvati.shop/es/thankyou",
    status: FUNNEL_STATUS.ACTIVE,
    landingPages: [
      { name: "PowerPlus ES LP1", url: "https://powerplus.ojasvati.shop/es/lp1/", weight: 100 },
    ],
  },
  {
    productName: "SlimFast Keto Burn",
    language: "en",
    domain: "slimfastketo.example.com",
    pageUrl: "https://slimfastketo.example.com/page",
    thankYouPageUrl: "https://slimfastketo.example.com/thankyou",
    status: FUNNEL_STATUS.ACTIVE,
    landingPages: [
      { name: "SlimFast LP1", url: "https://slimfastketo.example.com/lp1/", weight: 60 },
      { name: "SlimFast LP2", url: "https://slimfastketo.example.com/lp2/", weight: 40 },
    ],
  },
  {
    productName: "CryptoWave Trading Bot",
    language: "en",
    domain: "cryptowave.example.com",
    pageUrl: "https://cryptowave.example.com/page",
    thankYouPageUrl: "https://cryptowave.example.com/thankyou",
    status: FUNNEL_STATUS.ACTIVE,
    landingPages: [
      { name: "CryptoWave LP1", url: "https://cryptowave.example.com/lp1/", weight: 100 },
    ],
  },
  {
    productName: "QuickCash Payday Loans",
    language: "en",
    domain: "quickcash.example.com",
    pageUrl: "https://quickcash.example.com/page",
    thankYouPageUrl: "https://quickcash.example.com/thankyou",
    status: FUNNEL_STATUS.INACTIVE,
    landingPages: [
      { name: "QuickCash LP1", url: "https://quickcash.example.com/lp1/", weight: 70 },
      { name: "QuickCash LP2", url: "https://quickcash.example.com/lp2/", weight: 30 },
    ],
  },
  {
    productName: "GlowUp Skincare Serum",
    language: "en",
    domain: "glowup.example.com",
    pageUrl: "https://glowup.example.com/page",
    thankYouPageUrl: "https://glowup.example.com/thankyou",
    status: FUNNEL_STATUS.ACTIVE,
    landingPages: [{ name: "GlowUp LP1", url: "https://glowup.example.com/lp1/", weight: 100 }],
  },
]

async function seed() {
  console.log("🌱 Seeding Funnels...")

  try {
    for (const funnel of funnelData) {
      const product = await db.query.products.findFirst({
        where: eq(products.name, funnel.productName),
      })

      if (!product) {
        console.log(`⚠️  Product not found, skipping funnel: ${funnel.productName} (${funnel.language})`)
        continue
      }

      let funnelRow = await db.query.funnels.findFirst({
        where: and(eq(funnels.productId, product.id), eq(funnels.language, funnel.language)),
      })

      if (!funnelRow) {
        const [inserted] = await db
          .insert(funnels)
          .values({
            productId: product.id,
            name: `${funnel.productName} (${funnel.language.toUpperCase()})`,
            language: funnel.language,
            domain: funnel.domain,
            pageUrl: funnel.pageUrl,
            thankYouPageUrl: funnel.thankYouPageUrl,
            status: funnel.status,
          })
          .onConflictDoNothing()
          .returning()

        funnelRow = inserted
        console.log(`✅ Added Funnel: ${funnel.productName} (${funnel.language})`)
      } else {
        console.log(`↷ Skipped (exists): ${funnel.productName} (${funnel.language})`)
      }

      if (!funnelRow) continue

      for (const page of funnel.landingPages) {
        const existingPage = await db.query.landingPages.findFirst({
          where: and(eq(landingPages.funnelId, funnelRow.id), eq(landingPages.url, page.url)),
        })
        if (existingPage) continue

        await db.insert(landingPages).values({
          funnelId: funnelRow.id,
          name: page.name,
          url: page.url,
          weight: page.weight,
        })
        console.log(`  ✅ Added Landing Page: ${page.name}`)
      }
    }

    console.log("✨ Seeding funnels completed!")
  } catch (error) {
    console.error("❌ Funnel seeding failed:", error)
  }
}

export default seed
