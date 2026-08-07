export function deriveName(url: string): string {
  try {
    const parsed = new URL(url)
    const segments = parsed.pathname.split("/").filter(Boolean)
    return segments[segments.length - 1] || "Landing Page"
  } catch {
    return "Landing Page"
  }
}

export function parsePasteText(raw: string): Array<{ name: string; url: string }> {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.includes("|")) {
        const parts = line.split("|").map((p) => p.trim())
        return {
          name: parts[0] || "Landing Page",
          url: parts[1] || "",
        }
      }
      return { name: deriveName(line), url: line }
    })
    .filter((p) => {
      try {
        new URL(p.url)
        return true
      } catch {
        return false
      }
    })
}
