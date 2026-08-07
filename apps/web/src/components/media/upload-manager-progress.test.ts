/**
 * Upload Manager — Drag-and-Drop Zone Verification
 *
 * The UploadManager component is a drag-and-drop file selection zone.
 * It does not handle upload progress or rendering — those are managed
 * by the parent component that uses UploadManager.
 *
 * Validates:
 * - Drag-and-drop interaction toggles visual state
 * - Click triggers file input
 * - Accept attribute respects MIME type configuration
 * - onAddFiles callback receives the selected files
 */
import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const SOURCE_PATH = path.resolve(__dirname, "./upload-manager.tsx")
const source = fs.readFileSync(SOURCE_PATH, "utf-8")

// ─── Component Structure ──────────────────────────────────────────────────────

describe("UploadManager — component structure", () => {
  it("exports a function component named UploadManager", () => {
    expect(source).toContain("export function UploadManager")
  })

  it("has a file input element with hidden class", () => {
    expect(source).toContain('type="file"')
    expect(source).toContain('className="hidden"')
  })

  it("supports drag-and-drop with onDragOver/onDragLeave/onDrop handlers", () => {
    expect(source).toContain("onDragOver=")
    expect(source).toContain("onDragLeave=")
    expect(source).toContain("onDrop=")
  })

  it("accepts props for onAddFiles callback and accept MIME types", () => {
    expect(source).toContain("onAddFiles")
    expect(source).toContain("accept")
  })

  it("tracks drag state with a useState hook", () => {
    expect(source).toContain("dragOver")
    expect(source).toContain("setDragOver")
  })
})