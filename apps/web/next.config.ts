import { createJiti } from "jiti"
import type { NextConfig } from "next"
import { fileURLToPath } from "node:url"
const jiti = createJiti(fileURLToPath(import.meta.url))

jiti.import("./src/env.ts")

const nextConfig: NextConfig = {
  transpilePackages: ["@adscrush/ui", "@adscrush/shared", "@adscrush/auth"],
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://localhost:8989",
    "app.adscrush.local",
    "api.adscrush.local",
    "app.sehatvati.shop"
  ],
  cacheComponents: true,
  // Standalone output enables zero-dependency Docker deployment.
  // Only the server, public assets, and .next/static are copied to the final image.
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
  typescript: {
    // Only ignore build errors in dev (watching, faster refreshes).
    // Production builds MUST pass type checking.
    ignoreBuildErrors: process.env.NODE_ENV !== "development",
  },
}

export default nextConfig
