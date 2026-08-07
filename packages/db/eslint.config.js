import { config as baseConfig } from "@adscrush/eslint-config/base"

/**
 * ESLint configuration for the db package.
 *
 * The db package is mostly CLI tooling (partition management, PII purging,
 * migrations, seeds) where `console` is the appropriate output mechanism, so
 * `no-console` is disabled for script/seed entry points.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  ...baseConfig,
  {
    name: "@adscrush/db/cli-output",
    files: ["scripts/**/*.ts", "src/seed/**/*.ts", "drizzle/**/*.ts", "src/sql/apply.ts"],
    rules: {
      "no-console": "off",
    },
  },
]
