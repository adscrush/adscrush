import { config as baseConfig } from "@adscrush/eslint-config/base"

/**
 * Root ESLint configuration.
 *
 * In flat-config mode ESLint resolves the *nearest* `eslint.config.js` for a
 * given file. Packages with their own config (apps/*, packages/*) are covered
 * by those files. This root config covers the remaining repository files
 * (e.g. `packages/eslint-config/*.js`), which also stops the VS Code ESLint
 * extension from falling back to script-mode parsing and surfacing
 * "The keyword 'import' is reserved" errors on ESM config files.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  ...baseConfig,
  {
    name: "adscrush/root/ignores",
    ignores: ["**/node_modules/**"],
  },
]
