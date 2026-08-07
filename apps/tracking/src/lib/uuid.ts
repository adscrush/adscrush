/**
 * Validate a UUID (any version) against the Postgres `uuid` column format.
 *
 * `clicks.tid` is a `uuid` column. Without this guard, a malformed tid
 * (e.g. "fake-test-tid-xyz") makes Postgres throw
 * `invalid input syntax for type uuid`, which surfaces as an HTTP 500.
 * Callers use this to return a clean 404 instead.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value)
}
