import { URL_TOKENS } from "../constants/tokens"

/**
 * MacroValues maps token placeholders (e.g. "{tid}") to their runtime values.
 * Only tokens with a non-empty string value will be substituted.
 * Tokens absent from the map or with empty values are left untouched.
 */
export type MacroValues = Partial<Record<string, string>>

/**
 * applyMacros — central token substitution utility.
 *
 * Replaces all token placeholders defined in URL_TOKENS with their runtime
 * values. Handles both literal tokens ({tid}) and URL-encoded tokens
 * (%7Btid%7D) by decoding the URL before matching.
 *
 * Tokens with no provided value (or an empty string value) are left untouched
 * so that unresolvable placeholders like {payout} are never silently dropped.
 *
 * @param url    - The URL template (may contain literal or URL-encoded tokens)
 * @param values - Map of token placeholder → runtime value
 * @returns      - The URL with all resolvable tokens replaced
 */
export function applyMacros(url: string, values: MacroValues): string {
  // We need to handle both literal tokens ({tid}) and URL-encoded tokens (%7Btid%7D).
  // Rather than decoding the entire URL (which can corrupt path segments or query values
  // that are legitimately percent-encoded), we replace both the literal and encoded forms
  // of each token independently.
  let result = url

  for (const token of URL_TOKENS) {
    const value = values[token.value]
    if (value !== undefined && value !== "") {
      // Replace literal form: {tid}
      result = result.replaceAll(token.value, value)
      // Replace URL-encoded form: %7Btid%7D (handles URLs stored with encoded braces)
      const encoded = encodeURIComponent(token.value)
      if (encoded !== token.value) {
        result = result.replaceAll(encoded, value)
      }
    }
  }

  return result
}
