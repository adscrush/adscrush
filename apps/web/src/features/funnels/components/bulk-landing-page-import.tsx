"use client"

import { Button } from "@adscrush/ui/components/button"
import { toast } from "@adscrush/ui/sonner"
import { IconCircleCheck, IconLoader2, IconUpload, IconX } from "@tabler/icons-react"
import * as React from "react"
import { useBulkAddLandingPages } from "../queries"

interface BulkLandingPageImportProps {
  funnelId: string
  onComplete: () => void
}

interface ParsedPage {
  index: number
  name: string
  url: string
  valid: boolean
  error?: string
}

function deriveName(url: string): string {
  try {
    const parsed = new URL(url)
    const segments = parsed.pathname.split("/").filter(Boolean)
    return segments[segments.length - 1] || "Landing Page"
  } catch {
    return "Landing Page"
  }
}

function parseLines(raw: string): ParsedPage[] {
  const lines = raw.split("\n")
  const result: ParsedPage[] = []

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i]!.trim()
    if (!trimmed) continue

    let name: string
    let url: string

    if (trimmed.includes("|")) {
      const parts = trimmed.split("|").map((p) => p.trim())
      if (parts.length >= 2) {
        name = parts[0]!
        url = parts[1]!
      } else {
        result.push({
          index: i,
          name: "",
          url: trimmed,
          valid: false,
          error: "Invalid format",
        })
        continue
      }
    } else {
      url = trimmed
      name = deriveName(url)
    }

    try {
      new URL(url)
    } catch {
      result.push({ index: i, name, url, valid: false, error: "Invalid URL" })
      continue
    }

    result.push({ index: i, name, url, valid: true })
  }

  return result
}

export function BulkLandingPageImport({ funnelId, onComplete }: BulkLandingPageImportProps) {
  const [raw, setRaw] = React.useState("")
  const [parsed, setParsed] = React.useState<ParsedPage[]>([])
  const mutation = useBulkAddLandingPages()

  const handleParse = () => {
    const pages = parseLines(raw)
    setParsed(pages)
    if (pages.length === 0) {
      toast.error("No valid URLs found")
    }
  }

  const handleImport = () => {
    const valid = parsed.filter((p) => p.valid)
    if (valid.length === 0) {
      toast.error("No valid landing pages to import")
      return
    }

    mutation.mutate(
      {
        funnelId,
        landingPages: valid.map((p) => ({
          name: p.name,
          url: p.url,
        })),
      },
      {
        onSuccess: () => {
          toast.success(`${valid.length} landing page${valid.length > 1 ? "s" : ""} imported`)
          setRaw("")
          setParsed([])
          onComplete()
        },
        onError: (e) => toast.error(e.message),
      }
    )
  }

  const updateParsedRow = (index: number, field: "name" | "url", value: string) => {
    setParsed((prev) =>
      prev.map((p) => {
        if (p.index !== index) return p
        const updated = { ...p, [field]: value }
        if (field === "url") {
          try {
            new URL(value)
            updated.valid = true
            updated.error = undefined
          } catch {
            updated.valid = false
            updated.error = "Invalid URL"
          }
        }
        return updated
      })
    )
  }

  const removeRow = (index: number) => {
    setParsed((prev) => prev.filter((p) => p.index !== index))
  }

  const validCount = parsed.filter((p) => p.valid).length

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Paste URLs (one per line)
        </label>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={
            "https://powerplus.ojasvati.shop/lp1/\nhttps://powerplus.ojasvati.shop/lp2/\nhttps://powerplus.ojasvati.shop/lp3/"
          }
          className="min-h-[100px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          rows={4}
        />
        <p className="text-[10px] text-muted-foreground">
          One offer URL per line. Or: <code className="text-[10px]">Name | Offer URL</code>
        </p>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={handleParse} disabled={!raw.trim()}>
          <IconUpload className="mr-1.5 size-3.5" /> Preview
        </Button>
      </div>

      {parsed.length > 0 && (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Offer URL</th>
                  <th className="w-8 px-2 py-1.5" />
                </tr>
              </thead>
              <tbody>
                {parsed.map((p) => (
                  <tr key={p.index} className="border-b last:border-b-0 hover:bg-muted/20">
                    <td className="px-2 py-1">
                      <input
                        value={p.name}
                        onChange={(e) => updateParsedRow(p.index, "name", e.target.value)}
                        className="h-7 w-full rounded border border-input bg-background px-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        value={p.url}
                        onChange={(e) => updateParsedRow(p.index, "url", e.target.value)}
                        className={`h-7 w-full rounded border bg-background px-1.5 text-xs font-mono text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${p.valid ? "border-input" : "border-destructive/50"}`}
                      />
                      {p.error && (
                        <span className="mt-0.5 block text-[10px] text-destructive">{p.error}</span>
                      )}
                    </td>
                    <td className="px-2 py-1">
                      <button
                        onClick={() => removeRow(p.index)}
                        className="flex size-5 items-center justify-center rounded text-muted-foreground hover:text-destructive"
                      >
                        <IconX className="size-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {validCount} of {parsed.length} valid
            </span>
            <Button
              size="sm"
              onClick={handleImport}
              disabled={validCount === 0 || mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <IconLoader2 className="mr-1.5 size-3.5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <IconCircleCheck className="mr-1.5 size-3.5" />
                  Import {validCount} {validCount === 1 ? "Page" : "Pages"}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
