import pluginNext from "@next/eslint-plugin-next"
import pluginReact from "eslint-plugin-react"
import pluginReactHooks from "eslint-plugin-react-hooks"
import globals from "globals"

import { config as baseConfig } from "./base.js"

/**
 * Shared ESLint configuration for Next.js applications (apps/web).
 *
 * Extends the repo base config and layers on React, Next.js, and
 * React Hooks rules. The React Compiler-era `react-hooks/*` rules are
 * experimental and produce false positives against TanStack Query,
 * TanStack Virtual, and nuqs, so only the two stable, high-signal rules
 * (`rules-of-hooks`, `exhaustive-deps`) are enabled.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const nextJsConfig = [
  ...baseConfig,
  {
    name: "@adscrush/next/react",
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.browser,
      },
    },
    settings: {
      react: { version: "detect" },
    },
  },
  {
    name: "@adscrush/next/nextjs",
    plugins: {
      "@next/next": pluginNext,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
      // Allow <img> for external images (CDN, avatars, media files).
      "@next/next/no-img-element": "off",
    },
  },
  {
    name: "@adscrush/next/react-hooks",
    plugins: {
      "react-hooks": pluginReactHooks,
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      "react-hooks/exhaustive-deps": "warn",
      // React Compiler-era experimental rules — noisy false positives with
      // TanStack Query/Virtual and nuqs. The two classic rules above cover
      // the genuinely critical guarantees.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/static-components": "off",
      "react-hooks/refs": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/use-memo": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      // React scope is unnecessary with the new JSX transform.
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },
]
