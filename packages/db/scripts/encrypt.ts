import { createHmac } from "node:crypto"

/**
 * Application-level AES-256-GCM PII encryption/decryption.
 *
 * Envelope encryption:
 *   - `PII_MASTER_KEY` env var (hex-encoded 256-bit key) never changes.
 *   - `PII_DATA_KEY` is derived per-session: HMAC-SHA256(master, version || salt).
 *   - The version is prepended to the ciphertext for key rotation support.
 *
 * Usage:
 *   import { encrypt, decrypt } from "../scripts/encrypt"
 *   const encrypted = await encrypt("192.168.1.1")
 *   const decrypted = await decrypt(encrypted)  // "192.168.1.1"
 */

const ALGORITHM = "AES-GCM"

function getMasterKey(): Buffer {
  const hex = process.env["PII_MASTER_KEY"]
  if (!hex) throw new Error("PII_MASTER_KEY is not set")
  return Buffer.from(hex, "hex")
}

export async function encryptPII(plaintext: string): Promise<string> {
  const masterKey = getMasterKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const salt = crypto.getRandomValues(new Uint8Array(16))

  // Derive data key from master key + salt
  const dataKey = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(masterKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const derived = await crypto.subtle.sign("HMAC", dataKey, salt)

  const aesKey = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(derived),
    { name: ALGORITHM },
    false,
    ["encrypt"]
  )

  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    aesKey,
    encoded
  )

  // Pack: version(1) || salt(16) || iv(12) || ciphertext
  const version = new Uint8Array([1])
  const combined = new Uint8Array(version.length + salt.length + iv.length + ciphertext.byteLength)
  combined.set(version, 0)
  combined.set(salt, version.length)
  combined.set(iv, version.length + salt.length)
  combined.set(new Uint8Array(ciphertext), version.length + salt.length + iv.length)

  return Buffer.from(combined).toString("base64")
}

export async function decryptPII(packed: string): Promise<string> {
  const masterKey = getMasterKey()
  const combined = Buffer.from(packed, "base64")

  const version = combined[0]
  if (version !== 1) throw new Error(`Unsupported PII key version: ${version}`)

  const salt = new Uint8Array(combined.subarray(1, 17))
  const iv = new Uint8Array(combined.subarray(17, 29))
  const ciphertext = combined.subarray(29)

  const dataKey = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(masterKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const derived = await crypto.subtle.sign("HMAC", dataKey, salt)

  const aesKey = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(derived),
    { name: ALGORITHM },
    false,
    ["decrypt"]
  )

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    aesKey,
    ciphertext
  )

  return new TextDecoder().decode(decrypted)
}

/**
 * Deterministic hash of an IP address for dedup (HMAC-SHA256 with pepper).
 * NOT reversible.
 */
export function hashIP(ipAddress: string): string {
  const pepper = process.env["PII_PEPPER"] ?? "change-me-pepper"
  const key = Buffer.from(pepper, "utf-8")
  return createHmac("sha256", key).update(ipAddress).digest("hex")
}
