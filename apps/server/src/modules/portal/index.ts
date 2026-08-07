/**
 * Portal router — aggregates all media-buyer portal sub-routers.
 *
 * Domain modules:
 * - portal-profile: profile viewing/editing
 * - portal-dashboard: dashboard analytics
 * - portal-campaigns: campaign CRUD, ad account management
 * - portal-reports: report analytics endpoints
 * - portal-creatives: creative listing
 * - portal-ad-accounts: ad account listing
 * - portal-media: media file listing
 * - portal-products: product listing
 * - portal-advertisers: advertiser listing
 * - portal-funnels: funnel listing
 * - portal-leads: lead listing and export
 */

import { mergeRouters } from "~/lib/trpc/init"
import { portalProfileRouter } from "./portal-profile"
import { portalDashboardRouter } from "./portal-dashboard"
import { portalCampaignsRouter } from "./portal-campaigns"
import { portalReportsRouter } from "./portal-reports"
import { portalCreativesRouter } from "./portal-creatives"
import { portalAdAccountsRouter } from "./portal-ad-accounts"
import { portalMediaRouter } from "./portal-media"
import { portalProductsRouter } from "./portal-products"
import { portalAdvertisersRouter } from "./portal-advertisers"
import { portalFunnelsRouter } from "./portal-funnels"
import { portalLeadsRouter } from "./portal-leads"

export const portalRouter = mergeRouters(
  portalProfileRouter,
  portalDashboardRouter,
  portalCampaignsRouter,
  portalReportsRouter,
  portalCreativesRouter,
  portalAdAccountsRouter,
  portalMediaRouter,
  portalProductsRouter,
  portalAdvertisersRouter,
  portalFunnelsRouter,
  portalLeadsRouter,
)
