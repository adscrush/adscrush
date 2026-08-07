import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@/lib/auth/server"
import { ROLES } from "@adscrush/shared/constants/roles"

/**
 * Public paths that don't require authentication.
 * These are explicitly allowed through even though the matcher catches them.
 */
const PUBLIC_PATHS = ["/", "/design-system", "/access-denied"]

/**
 * Internal roles — admin and employees who can access the full dashboard.
 */
const INTERNAL_ROLES: readonly string[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.EMPLOYEE,
]

/**
 * External roles that have no access to the internal dashboard at all.
 */
const EXTERNAL_RESTRICTED_ROLES: readonly string[] = [
  ROLES.USER,
  ROLES.ADVERTISER,
]

/**
 * Mapping from portal path prefixes to their internal equivalents.
 * Paths are matched longest-first so that `/p/reports/kpi` matches before
 * `/p/reports`. Unlisted portal routes fall back to `/dashboard`.
 */
const PORTAL_TO_INTERNAL: [string, string][] = [
  ["/p/products", "/products"],
  ["/p/funnels", "/funnels"],
  ["/p/advertisers", "/advertisers"],
  ["/p/campaigns", "/campaigns"],
  ["/p/creatives", "/creatives"],
  ["/p/media", "/media"],
  ["/p/ad-accounts", "/ad-accounts"],
  ["/p/reports/kpi", "/reports/kpi"],
  ["/p/reports/conversions", "/reports/conversions"],
  ["/p/reports/clicks", "/reports/clicks"],
  ["/p/reports", "/reports"],
  ["/p/profile", "/dashboard"],
  // Portal-only pages also fall through to /dashboard below
]

/**
 * Given a portal path like `/p/products?foo=bar`, returns the internal
 * equivalent path (e.g. `/products`) or falls back to `/dashboard`.
 */
function mapPortalToInternal(pathname: string): string {
  for (const [portal, internal] of PORTAL_TO_INTERNAL) {
    // Match exact or sub-path (e.g. /p/reports/kpi matches /p/reports/kpi/...)
    if (pathname === portal || pathname.startsWith(portal + "/")) {
      // Preserve any sub-path beyond the prefix
      const suffix = pathname.slice(portal.length)
      return suffix ? `${internal}${suffix}` : internal
    }
  }
  return "/dashboard"
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow explicitly public paths
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next()
  }

  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    // ── Not logged in → sign-in ──────────────────────────────────────
    if (!session?.user) {
      const signInUrl = new URL("/auth/sign-in", request.url)
      signInUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(signInUrl)
    }

    const { role } = session.user
    // Must start with /p/ — NOT just /p — so /products and /public are not
    // mistaken for portal routes. Only /p/... paths are portal routes.
    const isOnPortal = pathname.startsWith("/p/")

    // ── Media buyer ──────────────────────────────────────────────────
    if (role === ROLES.MEDIA_BUYER) {
      if (!isOnPortal) {
        // Send media buyers to their portal
        return NextResponse.redirect(new URL("/p/dashboard", request.url))
      }
      // Already on a portal route — let through
      return NextResponse.next()
    }

    // ── Internal roles (admin, employee, super_admin) ────────────────
    if (INTERNAL_ROLES.includes(role)) {
      if (isOnPortal) {
        // Internal users shouldn't be on the portal — redirect to the
        // correct internal equivalent, or fall back to /dashboard
        const internalPath = mapPortalToInternal(pathname)
        return NextResponse.redirect(new URL(internalPath, request.url))
      }
      // Already on an internal route — let through
      return NextResponse.next()
    }

    // ── Restricted roles (user, advertiser) ──────────────────────────
    if (EXTERNAL_RESTRICTED_ROLES.includes(role)) {
      return NextResponse.redirect(new URL("/access-denied", request.url))
    }

    // ── Fallback: unknown role → access denied ───────────────────────
    return NextResponse.redirect(new URL("/access-denied", request.url))
  } catch {
    // Auth server unavailable — fail closed (redirect to sign-in)
    const signInUrl = new URL("/auth/sign-in", request.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /auth/*        (sign-in, sign-up, etc.)
     * - /api/*         (API routes)
     * - /_next/static  (static files)
     * - /_next/image   (image optimization)
     * - favicon.ico, logo.png, fixed-overlay.png (public assets)
     */
    "/((?!auth|api|_next/static|_next/image|favicon\\.ico|logo\\.png|fixed-overlay\\.png).*)",
  ],
}
