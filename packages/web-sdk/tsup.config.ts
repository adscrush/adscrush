import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs", "iife"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  treeshake: true,
  outDir: "dist",
  globalName: "AdsCrushSDK",
  output: {
    exports: "named",
  },
  outExtension({ format }) {
    if (format === "iife") {
      return {
        js: ".iife.min.js",
      }
    }
    return {
      js: `.${format === "esm" ? "mjs" : "js"}`,
    }
  },
})
