/**
 * Mask a phone number for display — hides middle digits.
 *
 * Examples:
 *   maskPhone("+919876543210")  → "+919******3210"
 *   maskPhone("9876543210")     → "987******3210"
 *   maskPhone("+1 555 123 4567") → "+1 5**** 4567"
 *   maskPhone("abc")            → "abc" (too short to mask)
 *   maskPhone(null)             → null
 */
export function maskPhone(value: string | null): string | null {
  if (!value) return null
  const digits = value.replace(/\D/g, "")
  if (digits.length >= 7) {
    const prefix = value.slice(0, Math.min(3, value.length))
    const suffix = value.slice(-4)
    const masked = "*".repeat(Math.max(0, value.length - prefix.length - suffix.length))
    return `${prefix}${masked}${suffix}`
  }
  return value
}

/**
 * Mask an email address for display — hides local part, keeps domain.
 *
 * Examples:
 *   maskEmail("john@example.com")  → "j***@example.com"
 *   maskEmail("ab@x.com")         → "a*@x.com"
 *   maskEmail("a@b.co")           → "a@b.co" (local part too short)
 *   maskEmail(null)               → null
 */
export function maskEmail(value: string | null): string | null {
  if (!value) return null
  const atIndex = value.indexOf("@")
  if (atIndex <= 0) return value
  const local = value.slice(0, atIndex)
  const domain = value.slice(atIndex)
  if (local.length <= 1) return value
  return `${local[0]}${"*".repeat(Math.max(0, local.length - 1))}${domain}`
}

/**
 * Mask a street address for display — a full street address is highly
 * identifying, so no prefix/suffix and no length information is preserved;
 * the output only reveals that an address exists.
 *
 * Examples:
 *   maskAddress("221B Baker Street") → "********"
 *   maskAddress("X")                → "********"
 *   maskAddress(null)               → null
 */
export function maskAddress(value: string | null): string | null {
  if (!value) return null
  return "********"
}

/**
 * Mask a postal/pincode for display — postal codes are short and identifying,
 * so the value is fully redacted.
 *
 * Examples:
 *   maskPincode("560001") → "******"
 *   maskPincode(null)     → null
 */
export function maskPincode(value: string | null): string | null {
  if (!value) return null
  return "******"
}

/**
 * Fields that carry direct contact PII on a lead and are masked for
 * non-sensitive viewers.
 */
export interface LeadContactFields {
  phone?: string | null
  email?: string | null
  address?: string | null
  pincode?: string | null
}

/**
 * Apply the platform-wide lead PII masking policy to a lead row.
 *
 * When `canViewSensitive` is false (any non-admin caller), the direct
 * contact fields — phone, email, address, pincode — are masked. City,
 * state, and geoCountry are broad geographic information and are
 * intentionally left unmasked, consistent with how geoCountry is already
 * exposed to every role.
 *
 * This is the single place that decides what PII leaves the API, so both
 * the admin leads router and the media-buyer portal stay in sync.
 */
export function maskLeadPii<T extends LeadContactFields>(
  lead: T,
  canViewSensitive: boolean
): T {
  if (canViewSensitive) return lead
  return {
    ...lead,
    phone: maskPhone(lead.phone ?? null),
    email: maskEmail(lead.email ?? null),
    address: maskAddress(lead.address ?? null),
    pincode: maskPincode(lead.pincode ?? null),
  }
}
