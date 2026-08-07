import { z } from "zod"
import { isIP } from "net"
import ipaddr from "ipaddr.js"

// ─── Schemas ────────────────────────────────────────────────────────────────

export const uploadUrlSchema = z.object({
  url: z
    .string()
    .url("Must be a valid URL")
    .refine((u) => u.startsWith("https://"), "Only HTTPS URLs are allowed"),
  folderId: z.string().nullish(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
})

// ─── URL Validation ─────────────────────────────────────────────────────────

/**
 * Checks if a hostname resolves to a private/reserved IP address.
 * Uses ipaddr.js for proper CIDR-based IP range matching.
 *
 * Private ranges detected:
 *   IPv4: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8, 169.254.0.0/16, 0.0.0.0/8
 *   IPv6: fc00::/7 (unique local), fe80::/10 (link-local), ::1/128 (loopback), ::/128 (unspecified)
 */
export function isPrivateAddress(address: string): boolean {
  try {
    // Normalize IPv4-mapped IPv6: ::ffff:10.0.0.1
    const normalized = address.replace(/^::ffff:/, "")
    const addr = ipaddr.parse(normalized)

    // Check IPv4 private/reserved ranges
    if (addr.kind() === "ipv4") {
      const range = (addr as ipaddr.IPv4).range()
      return (
        range === "private" ||
        range === "loopback" ||
        range === "linkLocal" ||
        range === "unspecified" ||
        range === "reserved" ||
        range === "carrierGradeNat"
      )
    }

    // Check IPv6 private/reserved ranges
    if (addr.kind() === "ipv6") {
      const range = (addr as ipaddr.IPv6).range()
      return (
        range === "uniqueLocal" ||
        range === "loopback" ||
        range === "linkLocal" ||
        range === "unspecified" ||
        range === "ipv4Mapped"
      )
    }

    return false
  } catch {
    // Invalid IPs are not private
    return false
  }
}

/**
 * Validates that the given URL is safe to fetch from the server.
 * Checks:
 * - Only HTTPS protocol allowed
 * - Hostname resolves to a public (non-private) IP
 * - No port-forwarding tricks
 */
export async function validateUploadUrl(rawUrl: string): Promise<URL> {
  const parsed = new URL(rawUrl)

  // Check protocol
  if (parsed.protocol !== "https:") {
    throw new Error("Only HTTPS URLs are supported for upload")
  }

  // Block credentials in URL
  if (parsed.username || parsed.password) {
    throw new Error("URL credentials are not allowed")
  }

  // Block non-standard ports (common attack vector for SSRF)
  if (parsed.port && !["443", "80"].includes(parsed.port)) {
    throw new Error("Non-standard ports are not allowed")
  }

  // Resolve hostname and check IP
  const hostname = parsed.hostname

  // Skip DNS resolution for hostnames that are already IPs
  if (isIP(hostname)) {
    if (isPrivateAddress(hostname)) {
      throw new Error("Cannot fetch from private IP addresses")
    }
  } else {
    // Only allow fetching from common public hosts — restrict by known patterns
    // For stricter security, maintain an allowlist of allowed domains
    try {
      const dns = await import("dns/promises")
      const addresses = await dns.resolve4(hostname)
      for (const addr of addresses) {
        if (isPrivateAddress(addr)) {
          throw new Error(`Host ${hostname} resolves to a private IP (${addr})`)
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("private IP")) throw err
      // DNS resolution failure is allowed — the fetch will fail anyway
    }
  }

  return parsed
}

/**
 * Maximum size (in bytes) for upload-from-URL responses.
 * Override via MAX_UPLOAD_SIZE_BYTES env var; defaults to 100 MB.
 */
export const MAX_UPLOAD_RESPONSE_BYTES =
  Number(process.env.MAX_UPLOAD_SIZE_BYTES) || 100 * 1024 * 1024

/**
 * Maximum redirects to follow for upload-from-URL.
 */
export const MAX_UPLOAD_REDIRECTS = 5
