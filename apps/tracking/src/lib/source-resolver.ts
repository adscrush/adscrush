const REFERRER_MAP: Record<string, string> = {
  "facebook.com": "facebook",
  "l.facebook.com": "facebook",
  "lm.facebook.com": "facebook",
  "m.facebook.com": "facebook",
  "mbasic.facebook.com": "facebook",
  "instagram.com": "instagram",
  "l.instagram.com": "instagram",
  "twitter.com": "twitter",
  "t.co": "twitter",
  "x.com": "x",
  "linkedin.com": "linkedin",
  "lnkd.in": "linkedin",
  "youtube.com": "youtube",
  "google.com": "google",
  "www.google.com": "google",
  "googleadservices.com": "google",
  "tiktok.com": "tiktok",
  "ads.tiktok.com": "tiktok",
  "pinterest.com": "pinterest",
  "taboola.com": "taboola",
  "outbrain.com": "outbrain",
  "bing.com": "bing",
  "yahoo.com": "yahoo",
  "mail.google.com": "email",
  "outlook.live.com": "email",
  "mail.yahoo.com": "email",
}

function extractDomain(referer: string): string | null {
  try {
    const url = new URL(referer)
    return url.hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

function mapReferrer(referer: string): string {
  const domain = extractDomain(referer)
  if (!domain) return referer
  return REFERRER_MAP[domain] ?? domain
}

export function resolveSource(
  utmSource: string | undefined,
  referer: string | null
): string {
  if (utmSource) return utmSource
  if (referer) return mapReferrer(referer)
  return "direct"
}
