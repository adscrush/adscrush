import { createDatabase } from "../client"
import { products } from "../schema/products"
import { categories } from "../schema/categories"
import { PRODUCT_STATUS, PRODUCT_VISIBILITY } from "@adscrush/shared/constants/status"
import "dotenv/config"
import { eq } from "drizzle-orm"

const db = createDatabase()

const productData = [
  {
    name: "PowerPlus Male Enhancement",
    category: "Nutra",
    description: "Daily supplement for male vitality and performance.",
    status: PRODUCT_STATUS.ACTIVE,
    visibility: PRODUCT_VISIBILITY.PUBLIC,
    price: "59.99",
    compareAtPrice: "89.99",
    costPerItem: "18.00",
    defaultRevenue: "45.00",
    defaultPayout: "25.00",
  },
  {
    name: "SlimFast Keto Burn",
    category: "Nutra",
    description: "Fat-burning keto capsules for accelerated weight loss.",
    status: PRODUCT_STATUS.ACTIVE,
    visibility: PRODUCT_VISIBILITY.PUBLIC,
    price: "49.99",
    compareAtPrice: "74.99",
    costPerItem: "14.00",
    defaultRevenue: "38.00",
    defaultPayout: "20.00",
  },
  {
    name: "CryptoWave Trading Bot",
    category: "Crypto & Trading",
    description: "Automated trading signals and portfolio management.",
    status: PRODUCT_STATUS.ACTIVE,
    visibility: PRODUCT_VISIBILITY.EXCLUSIVE,
    price: "199.00",
    compareAtPrice: "299.00",
    costPerItem: "0.00",
    defaultRevenue: "150.00",
    defaultPayout: "90.00",
  },
  {
    name: "QuickCash Payday Loans",
    category: "Loans",
    description: "Fast approval short-term loans up to $1000.",
    status: PRODUCT_STATUS.ACTIVE,
    visibility: PRODUCT_VISIBILITY.PUBLIC,
    price: null,
    compareAtPrice: null,
    costPerItem: null,
    defaultRevenue: "60.00",
    defaultPayout: "35.00",
  },
  {
    name: "GlowUp Skincare Serum",
    category: "Fashion & Beauty",
    description: "Anti-aging vitamin C serum for radiant skin.",
    status: PRODUCT_STATUS.PAUSED,
    visibility: PRODUCT_VISIBILITY.PUBLIC,
    price: "34.99",
    compareAtPrice: "54.99",
    costPerItem: "9.00",
    defaultRevenue: "28.00",
    defaultPayout: "15.00",
  },
  {
    name: "FitTrack Pro",
    category: "Fitness",
    description: "AI-driven workout and nutrition coaching app.",
    status: PRODUCT_STATUS.ACTIVE,
    visibility: PRODUCT_VISIBILITY.PUBLIC,
    price: "29.99",
    compareAtPrice: null,
    costPerItem: "2.00",
    defaultRevenue: "22.00",
    defaultPayout: "12.00",
  },
  {
    name: "SecureVPN Elite",
    category: "VPN & Security",
    description: "No-log VPN with unlimited bandwidth across 60 countries.",
    status: PRODUCT_STATUS.ACTIVE,
    visibility: PRODUCT_VISIBILITY.PUBLIC,
    price: "9.99",
    compareAtPrice: "14.99",
    costPerItem: "1.00",
    defaultRevenue: "8.00",
    defaultPayout: "4.50",
  },
  {
    name: "LuckySpin Casino",
    category: "iGaming",
    description: "Real-money slots and live dealer casino games.",
    status: PRODUCT_STATUS.ACTIVE,
    visibility: PRODUCT_VISIBILITY.EXCLUSIVE,
    price: null,
    compareAtPrice: null,
    costPerItem: null,
    defaultRevenue: "120.00",
    defaultPayout: "70.00",
  },
  {
    name: "TravelDeals Explorer",
    category: "Travel",
    description: "Discounted flights and hotel bundles worldwide.",
    status: PRODUCT_STATUS.INACTIVE,
    visibility: PRODUCT_VISIBILITY.PUBLIC,
    price: null,
    compareAtPrice: null,
    costPerItem: null,
    defaultRevenue: "18.00",
    defaultPayout: "9.00",
  },
  {
    name: "JobBoost Career Platform",
    category: "Jobs/Recruitment",
    description: "Resume building and job matching subscription.",
    status: PRODUCT_STATUS.ACTIVE,
    visibility: PRODUCT_VISIBILITY.PUBLIC,
    price: "19.99",
    compareAtPrice: null,
    costPerItem: "3.00",
    defaultRevenue: "16.00",
    defaultPayout: "8.00",
  },
]

async function seed() {
  console.log("🌱 Seeding Products...")

  try {
    const allAdvertisers = await db.query.advertisers.findMany()
    if (allAdvertisers.length === 0) {
      console.log("⚠️  No advertisers found — run seed:entities first. Skipping products.")
      return
    }

    for (const [index, product] of productData.entries()) {
      const existing = await db.query.products.findFirst({
        where: eq(products.name, product.name),
      })
      if (existing) {
        console.log(`↷ Skipped (exists): ${product.name}`)
        continue
      }

      const category = await db.query.categories.findFirst({
        where: eq(categories.name, product.category),
      })
      const advertiser = allAdvertisers[index % allAdvertisers.length]

      await db.insert(products).values({
        advertiserId: advertiser!.id,
        categoryId: category?.id ?? null,
        name: product.name,
        description: product.description,
        status: product.status,
        visibility: product.visibility,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        costPerItem: product.costPerItem,
        defaultRevenue: product.defaultRevenue,
        defaultPayout: product.defaultPayout,
      })
      console.log(`✅ Added Product: ${product.name}`)
    }

    console.log("✨ Seeding products completed!")
  } catch (error) {
    console.error("❌ Product seeding failed:", error)
  }
}

export default seed
