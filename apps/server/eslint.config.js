import { config as baseConfig } from "@adscrush/eslint-config/base"

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...baseConfig,
  {
    name: "@adscrush/server/logger",
    // The logger module's whole job is writing to stdout — console is the
    // intended output mechanism, not a debug leftover.
    files: ["src/lib/logger.ts"],
    rules: {
      "no-console": "off",
    },
  },
]
