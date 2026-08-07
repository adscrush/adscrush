import { and, eq, isNull, inArray } from "@adscrush/db/drizzle"
import {
  adAccounts,
  campaigns,
  campaignAdAccounts,
} from "@adscrush/db/schema"
import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { MEDIA_BUYER_PERMISSIONS, type Permission } from "@adscrush/shared/constants/permissions"
import { CAMPAIGN_STATUS_VALUES } from "@adscrush/shared/constants/status"
import type { Database } from "@adscrush/db"
import { checkPermission } from "~/lib/trpc/init"

/**
 * Enforces that a media buyer holds the given permission (with the standard
 * fallback to default media buyer permissions). Used by every procedure that
 * mutates campaigns in the portal.
 */
export function assertBuyerPermission(
  user: { role: string },
  mediaBuyer: { permissions: Permission[] },
  permission: Permission,
  message: string
): void {
  const raw = mediaBuyer.permissions
  const effective: Permission[] = raw.length > 0 ? raw : [...MEDIA_BUYER_PERMISSIONS]

  if (!checkPermission(user, effective, permission)) {
    throw new TRPCError({ code: "FORBIDDEN", message })
  }
}

/**
 * Enforces that a media buyer can edit a campaign — either via the explicit
 * `campaigns.edit` permission (any accessible campaign), or as the creator of
 * the campaign (holding `campaigns.create`). The caller passes the campaign
 * row so creator-ownership is checked against the actual record.
 */
export function assertBuyerCanEditCampaign(
  user: { role: string },
  mediaBuyer: { id: string; permissions: Permission[] },
  campaign: { createdByMediaBuyerId: string | null }
): void {
  const raw = mediaBuyer.permissions
  const effective: Permission[] = raw.length > 0 ? raw : [...MEDIA_BUYER_PERMISSIONS]

  const hasEdit = checkPermission(user, effective, "campaigns.edit")
  const isCreator = campaign.createdByMediaBuyerId === mediaBuyer.id
  const hasCreate = checkPermission(user, effective, "campaigns.create")

  if (!hasEdit && !(isCreator && hasCreate)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You don't have permission to edit campaigns" })
  }
}

/**
 * Returns the set of campaign ids a media buyer can access:
 * - campaigns they created (portal create flow), and
 * - campaigns linked to at least one of their own ad accounts.
 *
 * Soft-deleted campaigns are excluded, so every procedure that scopes via
 * this set (list, detail, stats, ad-account management) treats deleted
 * campaigns as inaccessible. Mirrors the scope used by `myCampaigns` /
 * `myCampaignsList`.
 */
export async function getAccessibleCampaignIds(db: Database, mediaBuyerId: string): Promise<Set<string>> {
  const accounts = await db
    .select({ id: adAccounts.id })
    .from(adAccounts)
    .where(and(eq(adAccounts.mediaBuyerId, mediaBuyerId), isNull(adAccounts.deletedAt)))

  const accountIds = accounts.map((a) => a.id)

  const [ownedRows, linkedRows] = await Promise.all([
    db
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(and(eq(campaigns.createdByMediaBuyerId, mediaBuyerId), isNull(campaigns.deletedAt))),
    accountIds.length > 0
      ? db
          .select({ campaignId: campaignAdAccounts.campaignId })
          .from(campaignAdAccounts)
          .innerJoin(campaigns, eq(campaignAdAccounts.campaignId, campaigns.id))
          .where(and(inArray(campaignAdAccounts.adAccountId, accountIds), isNull(campaigns.deletedAt)))
      : Promise.resolve([] as Array<{ campaignId: string }>),
  ])

  const ids = new Set<string>(ownedRows.map((c) => c.id))
  for (const link of linkedRows) ids.add(link.campaignId)
  return ids
}

/**
 * Portal variant of the campaign update input — buyers may not change the
 * funnel (and therefore the product) of a campaign.
 */
export const portalUpdateCampaignSchema = z
  .object({
    name: z.string().min(1).optional(),
    status: z.enum(CAMPAIGN_STATUS_VALUES).optional(),
    startDate: z.coerce.date().optional().nullable(),
    endDate: z.coerce.date().optional().nullable(),
    internalNotes: z.string().optional().nullable(),
  })
  .refine((data) => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
    message: "End date must be equal to or later than start date",
    path: ["endDate"],
  })