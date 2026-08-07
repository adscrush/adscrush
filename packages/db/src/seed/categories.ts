import { createDatabase } from "../client"
import { categories } from "../schema/categories"
import "dotenv/config"

const db = createDatabase()

const categoryData = [
  { name: "E-commerce", description: "Retail, consumer products, and online shops" },
  { name: "Fashion & Beauty", description: "Apparel, skincare, and cosmetics" },
  { name: "Gadgets", description: "Tech accessories and smart devices" },
  { name: "Credit Cards", description: "Financial rewards and business cards" },
  { name: "Loans", description: "Personal, payday, and mortgage loans" },
  { name: "Insurance", description: "Auto, health, life, and pet insurance" },
  { name: "Crypto & Trading", description: "Exchanges and trading platforms" },
  { name: "Nutra", description: "Dietary supplements and wellness products" },
  { name: "Fitness", description: "Online coaching and gym equipment" },
  { name: "Mental Health", description: "Therapy and meditation apps" },
  { name: "VPN & Security", description: "Privacy tools and antivirus software" },
  { name: "Hosting", description: "Web hosting and domain services" },
  { name: "Utilities", description: "Mobile cleaners and productivity tools" },
  { name: "Sweepstakes", description: "Giveaways and win-a-prize offers" },
  { name: "Surveys", description: "Market research and paid panels" },
  { name: "Real Estate", description: "Property buying and selling leads" },
  { name: "Mobile Games", description: "App installs for iOS and Android games" },
  { name: "iGaming", description: "Online betting and casino games" },
  { name: "Streaming/VOD", description: "Subscription video and music services" },
  { name: "Online Courses", description: "EdTech and professional certifications" },
  { name: "Jobs/Recruitment", description: "Career boards and hiring services" },
  { name: "Dating", description: "Relationships and social apps" },
  { name: "Travel", description: "Flights, hotels, and rentals" },
  { name: "Home Services", description: "Repair, solar, and maintenance leads" },
]

async function seed() {
  console.log("🌱 Seeding categories...")
  try {
    for (const cat of categoryData) {
      await db.insert(categories).values(cat).onConflictDoNothing()
      console.log(`✅ Added: ${cat.name}`)
    }
    console.log("✨ Seeding categories completed!")
  } catch (error) {
    console.error("❌ Category seeding failed:", error)
  }
}

export default seed
