import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: [
      // Mock server-only and server-side modules so pure functions can be
      // imported and tested without Next.js / DB / auth infrastructure.
      // These must come BEFORE the generic "@" alias so they take precedence.
      { find: "server-only", replacement: path.resolve(__dirname, "src/__mocks__/server-only.ts") },
      { find: "@/lib/auth/server", replacement: path.resolve(__dirname, "src/__mocks__/empty-module.ts") },
      { find: "@/lib/db", replacement: path.resolve(__dirname, "src/__mocks__/empty-module.ts") },
      { find: "@adscrush/db/schema", replacement: path.resolve(__dirname, "src/__mocks__/empty-module.ts") },
      { find: "@adscrush/db/drizzle", replacement: path.resolve(__dirname, "src/__mocks__/empty-module.ts") },
      // Generic aliases — must come after the specific mocks above
      { find: "@adscrush/shared", replacement: path.resolve(__dirname, "../../packages/shared/src") },
      { find: "@", replacement: path.resolve(__dirname, "./src") },
    ],
  },
})
