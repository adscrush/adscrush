import { Elysia } from "elysia"
import { UAParser } from "ua-parser-js"
import { getAsnReader } from "../../config/geoip.js"
import { getDatabase } from "../../config/database.js"
import { ClickQuerySchema } from "./validation.js"
import { validateCampaignAndProduct, resolveFunnel, selectLandingPage, isUniqueClick, recordClick, validateAndLookupCreative } from "./service.js"
import { applyMacros, type MacroValues } from "@adscrush/shared/lib/macros"
import { hashIP } from "@adscrush/db/encrypt"
import { resolveSource } from "../../lib/source-resolver.js"
import { injectTokensIntoUrl } from "../../lib/url-builder.js"
import geoipLib from "geoip-lite"
import { logger } from "../../lib/logger.js"

/**
 * Encrypt PII data with fail-open semantics.
 * If the PII master key is misconfigured, we log a warning and continue
 * without encryption rather than blocking the click.
 */
async function encryptPIIFailOpen(value: string | null | undefined, label: string): Promise<string | undefined> {
  if (!value) return undefined
  try {
    const { encryptPII } = await import("@adscrush/db/encrypt")
    return await encryptPII(value)
  } catch (err) {
    logger({ module: "click" }).warn(`PII encryption failed for ${label}, continuing without encryption`, {
      message: err instanceof Error ? err.message : String(err),
    })
    return undefined
  }
}

const log = logger({ module: "click" })

export const clickRoute = new Elysia().get("/c", async ({ query, request, redirect, server }) => {
  // Normalize query parameters to lowercase for case-insensitive UTM handling
  const normalizedQuery: Record<string, string> = {}
  for (const [key, value] of Object.entries(query)) {
    normalizedQuery[key.toLowerCase()] = typeof value === "string" ? value : String(value ?? "")
  }
  
  const result = ClickQuerySchema.safeParse(normalizedQuery)

  if (!result.success) {
    log.error("Invalid click parameters", { errors: result.error.format() })
    return { error: "INVALID_PARAMETERS", message: "Missing required parameters c and aa" }
  }

  const { c: campaignId, aa: adAccountId, cr: creativeIdParam, f: funnelParam, lp: lpId, mo: moName, utm_source, utm_medium, utm_campaign, utm_term, utm_content } = result.data

  const tid = crypto.randomUUID()
  const referer = request.headers.get("referer")
  const resolvedSource = resolveSource(utm_source, referer)

  const partialValues: MacroValues = {
    "{tid}": tid,
    "{campaign_id}": campaignId,
    "{ad_account_id}": adAccountId,
    "{source}": resolvedSource,
    "{funnel}": funnelParam ?? "",
  }

  try {
    // ── IP Resolution ─────────────────────────────────────────────────────────
    // Prefer proxy-forwarded client IP; fall back to the raw socket address so
    // IP/geo still populate in local dev and setups without a proxy in front.
    const ipAddress =
      request.headers.get("x-real-ip") ??
      request.headers.get("x-forwarded-for")?.split(",").at(0)?.trim() ??
      server?.requestIP(request)?.address ??
      null

    // ── Geo Lookup ────────────────────────────────────────────────────────────
    const geo = ipAddress ? geoipLib.lookup(ipAddress) : null
    const geoCountry = geo?.country ?? null
    const geoCity = geo?.city ?? null
    const geoState = geo?.region ?? null

    // ── ASN / ISP Lookup ──────────────────────────────────────────────────────
    const asnReader = getAsnReader()
    let geoAsn: string | null = null
    let geoIsp: string | null = null
    if (asnReader && ipAddress) {
      try {
        const asnResponse = asnReader.asn(ipAddress)
        geoAsn = `AS${asnResponse.autonomousSystemNumber}`
        geoIsp = asnResponse.autonomousSystemOrganization ?? null
      } catch {
        // IP not in database or lookup error — fail open
      }
    }

    // ── User-Agent Parsing ────────────────────────────────────────────────────
    const userAgent = request.headers.get("user-agent") ?? ""
    const parser = new UAParser(userAgent)
    const uaResult = parser.getResult()

    // Enhanced device detection with fallback logic for analytics accuracy
    const getDeviceType = (): string => {
      // If UAParser detected a device type (mobile, tablet, wearable, tv, console, embedded)
      if (uaResult.device.type) {
        return uaResult.device.type
      }

      // Fallback: Check if it's a mobile OS without device type
      const mobileOS = ['Android', 'iOS', 'Windows Phone', 'BlackBerry', 'webOS']
      if (uaResult.os.name && mobileOS.includes(uaResult.os.name)) {
        return 'mobile'
      }

      // Fallback: Check for tablet indicators in UA string
      if (/tablet|ipad/i.test(userAgent)) {
        return 'tablet'
      }

      // Default: It's a desktop/laptop
      return 'desktop'
    }

    const deviceType = getDeviceType()
    const deviceVendor = uaResult.device.vendor ?? null
    const deviceModel = uaResult.device.model ?? null
    const browserName = uaResult.browser.name ?? null
    const browserVersion = uaResult.browser.version ?? null
    const osName = uaResult.os.name ?? null
    const osVersion = uaResult.os.version ?? null

    // ── Campaign & Product Validation ─────────────────────────────────────────
    const db = getDatabase()
    const validation = await validateCampaignAndProduct(db, campaignId, adAccountId)

    if (!validation.valid || !validation.product || !validation.advertiserId) {
      log.warn(
        `Click validation failed: ${validation.error}`,
        { campaignId, adAccountId }
      )
      return { error: "INVALID_LINK", message: "This link is no longer valid or has expired" }
    }

    const { product, advertiserId, mediaBuyerId, sourcePlatform, funnelId: campaignFunnelId } = validation

    // ── Funnel Resolution ────────────────────────────────────────────────────
    // Use explicit funnel param if provided, otherwise use campaign's linked funnel
    const funnel = funnelParam
      ? await resolveFunnel(db, funnelParam, product.id)
      : campaignFunnelId ? { id: campaignFunnelId } : null
    const funnelId = funnel?.id ?? null

    // ── Landing Page Selection (funnel-scoped) ──────────────────────────────
    const selected = await selectLandingPage(db, funnelId, lpId, moName)
    const landingPageId = selected?.id ?? null

    // ── Macro Substitution ────────────────────────────────────────────────────
    let redirectUrlStr: string = selected?.url ?? ""
    if (!redirectUrlStr) {
      return { error: "NO_REDIRECT_URL", message: "No landing page or fallback URL configured" }
    }
    redirectUrlStr = applyMacros(redirectUrlStr, partialValues)

    // ── Token Injection ───────────────────────────────────────────────────────
    // Automatically inject clickid parameter into the landing page URL
    redirectUrlStr = injectTokensIntoUrl({
      url: redirectUrlStr,
      tokens: {
        clickid: tid,
      },
      override: false, // Don't override if clickid already exists in URL
    })

    // ── PII Encryption (fail-open) ───────────────────────────────────────────
    const ipHashValue = ipAddress ? hashIP(ipAddress) : undefined
    const ipEncrypted = await encryptPIIFailOpen(ipAddress, "ip")
    const userAgentEncrypted = await encryptPIIFailOpen(userAgent, "user-agent")

    // ── Deduplication Check ───────────────────────────────────────────────────
    const unique = ipAddress && mediaBuyerId
      ? await isUniqueClick(db, mediaBuyerId, product.id, ipAddress)
      : true

    // ── Creative Validation ──────────────────────────────────────────────────
    let creativeData = null
    if (creativeIdParam) {
      creativeData = await validateAndLookupCreative(db, campaignId, creativeIdParam)
      if (creativeData) {
        partialValues["{creative_id}"] = creativeData.id
      }
    }

    // ── Record Click ─────────────────────────────────────────────────────────
    recordClick(db, {
      tid,
      mediaBuyerId: mediaBuyerId ?? "",
      advertiserId,
      productId: product.id,
      campaignId,
      adAccountId,
      funnelId,
      sourcePlatform: sourcePlatform ?? undefined,
      landingPageId,
      creativeId: creativeData?.id ?? undefined,
      creativeName: creativeData?.name ?? undefined,
      creativeThumbnailUrl: creativeData?.thumbnailUrl ?? undefined,
      ipHash: ipHashValue,
      ipEncrypted,
      geoCountry: geoCountry ?? undefined,
      geoCity: geoCity ?? undefined,
      geoState: geoState ?? undefined,
      geoAsn: geoAsn ?? undefined,
      geoIsp: geoIsp ?? undefined,
      userAgentEncrypted,
      deviceType: deviceType ?? undefined,
      deviceVendor: deviceVendor ?? undefined,
      deviceModel: deviceModel ?? undefined,
      os: osName ?? undefined,
      osVersion: osVersion ?? undefined,
      browser: browserName ?? undefined,
      browserVersion: browserVersion ?? undefined,
      referer: referer ?? undefined,
      utmSource: utm_source ?? undefined,
      utmMedium: utm_medium ?? undefined,
      utmCampaign: utm_campaign ?? undefined,
      utmTerm: utm_term ?? undefined,
      utmContent: utm_content ?? undefined,
      affClickId: result.data.aff_click_id ?? undefined,
      subAffId: result.data.sub_aff_id ?? undefined,
      affSub1: result.data.aff_sub1 ?? undefined,
      affSub2: result.data.aff_sub2 ?? undefined,
      affSub3: result.data.aff_sub3 ?? undefined,
      affSub4: result.data.aff_sub4 ?? undefined,
      affSub5: result.data.aff_sub5 ?? undefined,
      affSub6: result.data.aff_sub6 ?? undefined,
      affSub7: result.data.aff_sub7 ?? undefined,
      affSub8: result.data.aff_sub8 ?? undefined,
      affSub9: result.data.aff_sub9 ?? undefined,
      affSub10: result.data.aff_sub10 ?? undefined,
      source: resolvedSource,
      isUnique: unique,
      redirectUrl: redirectUrlStr,
    }).catch((err) => log.error("Failed to record click", { message: err instanceof Error ? err.message : String(err) }))

    return redirect(redirectUrlStr)
  } catch (error) {
    log.error("Critical error in click tracking", { message: error instanceof Error ? error.message : String(error) })
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return { error: "TRACKING_ERROR", message: `An error occurred during tracking: ${errorMessage}` }
  }
})
