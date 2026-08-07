import { config as baseConfig } from "@adscrush/eslint-config/base"

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...baseConfig,
  {
    name: "@adscrush/web-sdk/deploy-script",
    // The deploy script's whole job is writing to stdout — console is the
    // intended output mechanism for a CLI script.
    files: ["scripts/**/*.mjs"],
    rules: {
      "no-console": "off",
    },
  },
  {
    name: "@adscrush/web-sdk/logger",
    // The SDK ships a Logger whose methods write to the console by design
    // (browser-visible debug output for consumers).
    files: ["src/utils.ts"],
    rules: {
      "no-console": "off",
    },
  },
]
