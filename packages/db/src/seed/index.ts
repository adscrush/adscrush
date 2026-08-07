import seedCategories from "./categories"
import seedEntities from "./entities"
import seedLanguages from "./languages"
import seedProducts from "./products"
import seedFunnels from "./funnels"
import seedAdAccounts from "./ad-accounts"
import seedPolicies from "./retention-policies"

async function main() {
  console.log("Starting global database seed...")

  try {
    await seedCategories()
    await seedEntities()
    await seedLanguages()
    await seedProducts()
    await seedFunnels()
    await seedAdAccounts()
    await seedPolicies()

    console.log("All seeds completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("Global seed failed:", error)
    process.exit(1)
  }
}

main()
