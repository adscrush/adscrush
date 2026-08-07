import js from "@eslint/js"
import checkFile from "eslint-plugin-check-file"
import eslintConfigPrettier from "eslint-config-prettier"
import turboPlugin from "eslint-plugin-turbo"
import tseslint from "typescript-eslint"
import globals from "globals"

/**
 * Shared ESLint configuration for the AdScrush monorepo.
 *
 * Used by non-React packages (server, db, shared, env, auth, tracking).
 * Layered on top of ESLint's recommended preset + typescript-eslint's
 * recommended preset. Every config object is named so it can be debugged
 * with `npx eslint --print-config <file>`.
 *
 * Design principles:
 * - Errors are real errors: CI (`turbo lint`) fails on them.
 * - Warnings are reserved for things that are legitimately non-blocking
 *   (unused vars with underscore convention, missing env vars, console).
 * - Formatting is delegated to Prettier (`eslint-config-prettier` disables
 *   all conflicting stylistic rules).
 * - File naming (kebab-case) is enforced via eslint-plugin-check-file.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  {
    name: "@adscrush/base/ignores",
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/deploy/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/__mocks__/**",
      "**/*.d.ts",
      // Leading-underscore files with an intentional convention (_app.ts is
      // the tRPC root router, _lib/_migrate are Drizzle-generated).
      "**/_app.ts",
      "**/src/schema/_lib.ts",
      "**/src/schema/_migrate.ts",
      "**/db/migrations/**",
    ],
  },
  {
    name: "@adscrush/base/globals",
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
  {
    name: "@adscrush/base/javascript",
    ...js.configs.recommended,
  },
  // typescript-eslint's recommended is an array of configs — spread it into
  // the top level rather than into a single config object.
  ...tseslint.configs.recommended,
  {
    name: "@adscrush/base/turbo",
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
    },
  },
  {
    name: "@adscrush/base/naming-conventions",
    plugins: {
      "check-file": checkFile,
    },
    rules: {
      "check-file/filename-naming-convention": [
        "error",
        {
          "**/*.{ts,js,mts,cts}": "KEBAB_CASE",
          "**/*.{tsx,jsx}": "KEBAB_CASE",
        },
        {
          ignoreMiddleExtensions: true,
        },
      ],
    },
  },
  {
    name: "@adscrush/base/typescript-quality",
    rules: {
      // Underscore-prefixed identifiers are intentionally unused (e.g. `_userId`
      // params kept for API-signature compatibility, `_` in destructuring).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      // Enforce `import type` for type-only imports.
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
    },
  },
  {
    name: "@adscrush/base/best-practices",
    rules: {
      // Prefer the dedicated logger. `warn`/`error` are legitimate output for
      // error boundaries, analytics catch-blocks and feature detection.
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "warn",
      eqeqeq: ["error", "smart"],
      "prefer-const": "error",
    },
  },

  // Keep Prettier as the single source of truth for formatting.
  eslintConfigPrettier,
]
