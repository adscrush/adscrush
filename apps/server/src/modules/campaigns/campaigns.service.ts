import { env } from "~/env"
import type { Database } from "@adscrush/db"
import type { CreateCampaignInput, UpdateCampaignInput } from "@adscrush/shared/validators/campaign.schema"
import type { ListCampaignsInput } from "./campaigns.types"
import * as repository from "./campaigns.repository"
import { validateAdvertiserAccess, throwNotFound } from "~/lib/helpers"

// ─── Helper: Date Range Calculation ──────────────────────────────────────────

export function calculateDateRange(period: string, dateFrom?: string, dateTo?: string) {
  const now = new Date()
  let start: Date
  let end: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  switch (period) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      break
    case "yesterday": {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0)
      end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999)
      break
    }
    case "this_week": {
      const dayOfWeek = now.getDay()
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff, 0, 0, 0, 0)
      break
    }
    case "last_week": {
      const lastWeekStart = new Date(now)
      lastWeekStart.setDate(lastWeekStart.getDate() - lastWeekStart.getDay() - 6)
      start = new Date(lastWeekStart.getFullYear(), lastWeekStart.getMonth(), lastWeekStart.getDate(), 0, 0, 0, 0)
      const lastWeekEnd = new Date(lastWeekStart)
      lastWeekEnd.setDate(lastWeekEnd.getDate() + 6)
      end = new Date(lastWeekEnd.getFullYear(), lastWeekEnd.getMonth(), lastWeekEnd.getDate(), 23, 59, 59, 999)
      break
    }
    case "this_month":
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case "last_month":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      break
    case "all_time":
      start = new Date(0)
      break
    case "custom":
      start = dateFrom ? new Date(dateFrom) : new Date(now.getFullYear(), now.getMonth(), 1)
      end = dateTo
        ? new Date(new Date(dateTo).setHours(23, 59, 59, 999))
        : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      break
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  return { start, end }
}

// ─── Helper: Tracking Link Generation ────────────────────────────────────────

function getTrackingDomain() {
  return env.TRACKING_APP_URL || "http://localhost:3002"
}

function generateTrackingLink(campaignId: string, adAccountId: string, creativeId?: string, lpId?: string) {
  const domain = getTrackingDomain()
  let link = `${domain}/c?c=${campaignId}&aa=${adAccountId}`
  if (creativeId) link += `&cr=${creativeId}`
  if (lpId) link += `&lp=${lpId}`
  return link
}

// ─── Campaign Operations ─────────────────────────────────────────────────────

export async function listCampaigns(
  db: Database,
  input: ListCampaignsInput,
  scope: { isAllAdvertisers: boolean; advertiserIds: string[] }
) {
  return repository.findCampaigns(db, input, scope)
}

export async function getCampaignById(db: Database, id: string, scope: { isAllAdvertisers: boolean; advertiserIds: string[] }) {
  const campaign = await repository.findCampaignById(db, id)

  if (!campaign) {
    throwNotFound("Campaign")
  }

  validateAdvertiserAccess(scope, campaign.advertiserId)

  // Remove advertiserId from response
  const { advertiserId, ...campaignResult } = campaign
  void advertiserId
  return campaignResult
}

export async function createCampaign(db: Database, data: CreateCampaignInput) {
  const campaign = await repository.createCampaign(db, data)

  if (!campaign) {
    throwNotFound("Funnel")
  }

  return campaign
}

export async function updateCampaign(
  db: Database,
  id: string,
  data: UpdateCampaignInput,
  scope: { isAllAdvertisers: boolean; advertiserIds: string[] }
) {
  const existing = await repository.findCampaignById(db, id)

  if (!existing) {
    throwNotFound("Campaign")
  }

  validateAdvertiserAccess(scope, existing.advertiserId)

  const updated = await repository.updateCampaign(db, id, data)

  if (!updated) {
    throwNotFound("Campaign")
  }

  return updated
}

export async function deleteCampaign(db: Database, id: string, scope: { isAllAdvertisers: boolean; advertiserIds: string[] }) {
  const existing = await repository.findCampaignById(db, id)

  if (!existing) {
    throwNotFound("Campaign")
  }

  validateAdvertiserAccess(scope, existing.advertiserId)

  const deleted = await repository.deleteCampaign(db, id)

  if (!deleted) {
    throwNotFound("Campaign")
  }

  return { success: true }
}

// ─── Ad Account Operations ───────────────────────────────────────────────────

export async function getAdAccounts(db: Database, campaignId: string) {
  const assignments = await repository.findCampaignAdAccounts(db, campaignId)
  const trackingDomain = getTrackingDomain()

  return assignments.map((a) => ({
    ...a,
    trackingLink: `${trackingDomain}/c?c=${campaignId}&aa=${a.adAccountId}`,
  }))
}

export async function assignAdAccount(db: Database, campaignId: string, adAccountId: string) {
  const trackingLink = generateTrackingLink(campaignId, adAccountId)
  return repository.assignAdAccount(db, campaignId, adAccountId, trackingLink)
}

export async function removeAdAccount(db: Database, campaignId: string, adAccountId: string) {
  return repository.removeAdAccount(db, campaignId, adAccountId)
}

export async function getTrackingLink(db: Database, campaignId: string, adAccountId: string) {
  const link = await repository.findCampaignAdAccountWithAssignment(db, campaignId, adAccountId)

  if (!link) return null

  return generateTrackingLink(campaignId, adAccountId)
}

export async function getAllAdAccountsWithAssignment(
  db: Database,
  campaignId: string,
  options: {
    search?: string
    filter: "all" | "assigned"
    mediaBuyerIds?: string[]
    page: number
    perPage: number
  }
) {
  const { items, allTotalResult, filteredTotalResult, assignedResult } =
    await repository.findAllAdAccountsWithAssignment(db, campaignId, options)

  const trackingDomain = getTrackingDomain()
  const total = allTotalResult[0]?.count ?? 0
  const pageCount =
    options.filter === "assigned"
      ? Math.ceil((filteredTotalResult[0]?.count ?? 0) / options.perPage)
      : Math.ceil(total / options.perPage)
  const assignedCount = assignedResult[0]?.count ?? 0

  return {
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      platform: item.platform,
      accountId: item.accountId,
      isAssigned: item.assignedId !== null,
      trackingLink: item.assignedId
        ? `${trackingDomain}/c?c=${campaignId}&aa=${item.id}`
        : null,
      mediaBuyer: item.mediaBuyerName
        ? { name: item.mediaBuyerName, image: item.mediaBuyerImage }
        : null,
    })),
    total,
    assignedCount,
    pageCount,
  }
}

// ─── Creative Operations ─────────────────────────────────────────────────────

export async function getCreatives(db: Database, campaignId: string) {
  const results = await repository.findCampaignCreatives(db, campaignId)

  // Deduplicate: take only the first file per campaign_creative
  const seen = new Set<string>()
  return results.filter((row) => {
    if (seen.has(row.id)) return false
    seen.add(row.id)
    return true
  })
}

export async function syncCreatives(db: Database, campaignId: string, creativeIds: string[]) {
  return repository.syncCampaignCreatives(db, campaignId, creativeIds)
}

export async function getCreativeTrackingLinks(db: Database, campaignId: string) {
  const campaign = await repository.findCampaignForCreativeTracking(db, campaignId)
  const adAccountAssignments = await repository.findCampaignAdAccountsForTracking(db, campaignId)
  const creativeAssignments = await repository.findCampaignCreativesForTracking(db, campaignId)

  // Deduplicate creatives (take first file only)
  const seenCreative = new Set<string>()
  const creativesList = creativeAssignments.filter((row) => {
    if (seenCreative.has(row.creativeId)) return false
    seenCreative.add(row.creativeId)
    return true
  })

  // Get landing pages from funnel
  let landingPagesList: Array<{ id: string; name: string | null }> = []
  if (campaign?.funnelId) {
    landingPagesList = await repository.findLandingPagesByFunnelId(db, campaign.funnelId)
  }

  const trackingDomain = getTrackingDomain()

  return adAccountAssignments.map((adAccount) => ({
    adAccountId: adAccount.adAccountId,
    adAccountName: adAccount.adAccountName,
    adAccountPlatform: adAccount.adAccountPlatform,
    creatives: creativesList.map((creative) => {
      const baseUrl = `${trackingDomain}/c?c=${campaignId}&aa=${adAccount.adAccountId}&cr=${creative.creativeId}`
      
      // Generate URLs for each landing page
      const landingPageUrls = landingPagesList.map((lp) => ({
        landingPageId: lp.id,
        landingPageName: lp.name || lp.id,
        trackingLink: `${baseUrl}&lp=${lp.id}`,
      }))

      return {
        creativeId: creative.creativeId,
        creativeName: creative.creativeName,
        creativeThumbnailUrl: creative.creativeThumbnailUrl ?? creative.creativeCdnUrl ?? null,
        randomTrackingLink: baseUrl,
        landingPages: landingPageUrls,
      }
    }),
  }))
}

// ─── Stats Operations ────────────────────────────────────────────────────────

export async function getStats(db: Database, campaignId: string) {
  const row = await repository.getCampaignStats(db, campaignId)

  const totalClicks = Number(row?.clicks ?? 0)
  const totalConversions = Number(row?.conversions ?? 0)
  const totalRevenue = Number(row?.revenue ?? 0)
  const totalPayout = Number(row?.payout ?? 0)
  const epc = totalClicks > 0 ? totalPayout / totalClicks : 0

  return {
    clicks: totalClicks,
    conversions: totalConversions,
    revenue: totalRevenue,
    payout: totalPayout,
    epc,
  }
}

export async function getCreativePerformance(
  db: Database,
  campaignId: string,
  period: string,
  dateFrom?: string,
  dateTo?: string
) {
  const { start, end } = calculateDateRange(period, dateFrom, dateTo)
  const results = await repository.getCampaignCreativePerformance(db, campaignId, start, end)

  // Filter out null creative IDs
  const filtered = results.filter((r) => r.creativeId !== null)

  return filtered.map((row) => {
    const clicksCount = Number(row.clicks ?? 0)
    const conversionsCount = Number(row.conversions ?? 0)
    const revenue = Number(row.revenue ?? 0)
    const payout = Number(row.payout ?? 0)

    return {
      creativeId: row.creativeId,
      creativeName: row.creativeName ?? "Unknown",
      creativeThumbnailUrl: row.creativeThumbnailUrl,
      clicks: clicksCount,
      uniqueClicks: Number(row.uniqueClicks ?? 0),
      conversions: conversionsCount,
      approvedConversions: Number(row.approvedConversions ?? 0),
      revenue,
      payout,
      profit: revenue - payout,
      cr: clicksCount > 0 ? (conversionsCount / clicksCount) * 100 : 0,
      rpc: clicksCount > 0 ? revenue / clicksCount : 0,
      epc: clicksCount > 0 ? payout / clicksCount : 0,
    }
  })
}

// ─── Tracking Link Operations ────────────────────────────────────────────────

export async function regenerateTrackingLinks(db: Database) {
  const assignments = await repository.regenerateAllTrackingLinks(db)
  const trackingDomain = getTrackingDomain()

  for (const assignment of assignments) {
    const newTrackingLink = `${trackingDomain}/c?c=${assignment.campaignId}&aa=${assignment.adAccountId}`
    await repository.updateTrackingLink(db, assignment.id, newTrackingLink)
  }

  return { updated: assignments.length }
}
