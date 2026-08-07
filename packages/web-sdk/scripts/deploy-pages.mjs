import { existsSync, mkdirSync, cpSync, writeFileSync, rmSync } from "node:fs"
import { resolve } from "node:path"
import { spawnSync } from "node:child_process"

const projectName = process.env.CLOUDFLARE_PAGES_PROJECT_NAME ?? "adscrush-sdk"
const workingDirectory = resolve(import.meta.dirname, "..")
const distDirectory = resolve(workingDirectory, "dist")
const deployDirectory = resolve(workingDirectory, "deploy")

// Pre-flight: check dist exists
if (!existsSync(distDirectory)) {
  console.error("Build output not found at packages/web-sdk/dist. Run the build before deploying.")
  process.exit(1)
}

// Clean deploy folder
console.log("🧹 Cleaning deploy folder...")
rmSync(deployDirectory, { recursive: true, force: true })

// Create deploy structure
console.log("📦 Preparing deploy folder...")
mkdirSync(resolve(deployDirectory, "v1"), { recursive: true })

// Copy dist files to deploy/v1/
cpSync(resolve(distDirectory, "index.iife.min.js"), resolve(deployDirectory, "v1", "index.iife.min.js"))
cpSync(resolve(distDirectory, "index.iife.min.js.map"), resolve(deployDirectory, "v1", "index.iife.min.js.map"))
cpSync(resolve(distDirectory, "index.mjs"), resolve(deployDirectory, "v1", "index.mjs"))
cpSync(resolve(distDirectory, "index.mjs.map"), resolve(deployDirectory, "v1", "index.mjs.map"))
cpSync(resolve(distDirectory, "index.js"), resolve(deployDirectory, "v1", "index.js"))
cpSync(resolve(distDirectory, "index.js.map"), resolve(deployDirectory, "v1", "index.js.map"))
cpSync(resolve(distDirectory, "index.d.ts"), resolve(deployDirectory, "v1", "index.d.ts"))
cpSync(resolve(distDirectory, "index.d.cts"), resolve(deployDirectory, "v1", "index.d.cts"))

// Copy IIFE to root for convenience
cpSync(resolve(distDirectory, "index.iife.min.js"), resolve(deployDirectory, "sdk.js"))

// Write _headers for CORS and caching
writeFileSync(
  resolve(deployDirectory, "_headers"),
  `/*
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, OPTIONS
  Access-Control-Allow-Headers: Content-Type
  Cache-Control: public, max-age=31536000, immutable
  X-Content-Type-Options: nosniff

/v1/*
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=31536000, immutable
`
)

console.log("✅ Deploy folder ready:")
console.log("   deploy/v1/index.iife.min.js")
console.log("   deploy/v1/index.mjs")
console.log("   deploy/v1/index.js")
console.log("   deploy/v1/index.d.ts")
console.log("   deploy/sdk.js")
console.log("   deploy/_headers")

// Deploy to Cloudflare Pages
console.log(`\n🚀 Deploying to Cloudflare Pages (project: ${projectName})...`)

const args = [
  "pages",
  "deploy",
  deployDirectory,
  "--project-name",
  projectName,
  ...process.argv.slice(2),
]

const result = spawnSync("npx", ["wrangler", ...args], {
  cwd: workingDirectory,
  stdio: "inherit",
  shell: process.platform === "win32",
})

if (typeof result.status === "number") {
  process.exit(result.status)
}

console.error(result.error ?? "Failed to start Wrangler.")
process.exit(1)
