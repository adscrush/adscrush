import type { Database } from "@adscrush/db"
import { isAtLeastRole } from "@adscrush/shared/utils/roles"
import { ROLES } from "@adscrush/shared/constants/roles"
import { maskLeadPii } from "@adscrush/shared/lib/mask"
import { csvEscape } from "@adscrush/shared/lib/csv"
import {
  validateAll,
  isAlreadyInStatus,
  buildStatusUpdatePayload,
} from "@adscrush/shared/lib/lead-status"
import { safeDecryptIp } from "~/lib/report-utils"
import { throwNotFound, throwBadRequest } from "~/lib/helpers/errors"
import type { ListLeadsInput, LeadScope } from "./leads.types"
import * as repository from "./leads.repository"

// ─── Scope Helpers ──────────────────────────────────────────────────────────

/**
 * Build scope conditions from a combined scope object.
 * Leads use both advertiser AND media buyer scoping.
 */
export function buildLeadsScopeConditions(scope: LeadScope) {
  return repository.buildScopeConditions(scope)
}

// ─── List Leads ─────────────────────────────────────────────────────────────

/**
 * List leads with pagination, filtering, and PII masking
 */
export async function listLeads(
  db: Database,
  input: ListLeadsInput,
  scope: LeadScope,
  _userId: string,
  userRole: string
) {
  const canViewSensitive = isAtLeastRole(userRole, ROLES.ADMIN)
  const scopeConditions = repository.buildScopeConditions(scope)
  const basicConditions = repository.buildFilterConditions(input, scopeConditions)
  const finalWhere = repository.buildFinalWhere(input, scopeConditions, basicConditions)

  const { items, total, pageCount } = await repository.findLeadsPaginated(db, input, finalWhere)

  return {
    items: await Promise.all(
      items.map(async (item) => {
        const masked = maskLeadPii(item, canViewSensitive)
        return {
          ...masked,
          payout: String(masked.payout),
          ipEncrypted: canViewSensitive ? item.ipEncrypted : null,
          ipAddress: canViewSensitive ? await safeDecryptIp(item.ipEncrypted) : null,
        }
      })
    ),
    total,
    pageCount,
  }
}

// ─── Get Lead By ID ────────────────────────────────────────────────────────

/**
 * Get a single lead by ID with PII masking
 */
export async function getLeadById(
  db: Database,
  id: string,
  scope: LeadScope,
  userRole: string
) {
  const canViewSensitive = isAtLeastRole(userRole, ROLES.ADMIN)
  const scopeConditions = repository.buildScopeConditions(scope)

  const result = await repository.findLeadById(db, id, scopeConditions)

  if (!result) {
    throwNotFound("Lead")
  }

  return {
    ...maskLeadPii(result, canViewSensitive),
    payout: String(result.payout),
    ipEncrypted: canViewSensitive ? result.ipEncrypted : null,
    ipAddress: canViewSensitive ? await safeDecryptIp(result.ipEncrypted) : null,
  }
}

// ─── Update Lead Status ────────────────────────────────────────────────────

/**
 * Update lead status with validation of transition rules
 */
export async function updateLeadStatus(
  db: Database,
  id: string,
  requestedStatus: "pending" | "approved" | "rejected",
  userId: string
) {
  const lead = await repository.findLeadForStatusUpdate(db, id)

  if (!lead) {
    throwNotFound("Lead")
  }

  // Run all validations via shared service (status validity, transition rules, age limit)
  const validation = validateAll({
    currentStatus: lead.status,
    requestedStatus,
    createdAt: lead.createdAt,
  })

  if (!validation.valid) {
    const { code, message } = validation.error!
    throwBadRequest(`${code}: ${message}`)
  }

  // Check for no-op: already in requested status
  if (isAlreadyInStatus(lead.status, requestedStatus)) {
    return { id: lead.id, status: lead.status }
  }

  // Build update payload via shared service
  const updatePayload = buildStatusUpdatePayload(
    {
      currentStatus: lead.status,
      requestedStatus,
      createdAt: lead.createdAt,
    },
    userId,
  )

  const updated = await repository.updateLeadStatus(db, id, updatePayload)

  if (!updated) {
    throwNotFound("Lead")
  }

  return updated
}

// ─── Export Leads ───────────────────────────────────────────────────────────

/**
 * Export leads to CSV format
 */
export async function exportLeads(
  db: Database,
  input: ListLeadsInput,
  scope: LeadScope,
  userRole: string
) {
  const canViewSensitive = isAtLeastRole(userRole, ROLES.ADMIN)
  const scopeConditions = repository.buildScopeConditions(scope)
  const basicConditions = repository.buildFilterConditions(input, scopeConditions)
  const finalWhere = repository.buildFinalWhere(input, scopeConditions, basicConditions)

  const rows = await repository.findLeadsForExport(db, finalWhere)

  const header = "ID,Click ID,Name,Phone,Email,Address,City,State,Pincode,Status,Payout,Currency,Product,Campaign,Media Buyer,Advertiser,Country,IP,Sub1,Sub2,Sub3,Sub4,Sub5,Date\n"
  const csvRows = (
    await Promise.all(
      rows.map(async (r) => {
        const masked = maskLeadPii(r, canViewSensitive)
        const ip = canViewSensitive ? await safeDecryptIp(r.ipAddress) : null
        return [r.id, r.tid, masked.name ?? "", masked.phone ?? "", masked.email ?? "", masked.address ?? "", masked.city ?? "", masked.state ?? "", masked.pincode ?? "", masked.status, masked.payout, masked.currency, masked.productName, masked.campaignName ?? "", masked.mediaBuyerName ?? "", masked.advertiserName ?? "", masked.geoCountry ?? "", ip ?? "", masked.sub1 ?? "", masked.sub2 ?? "", masked.sub3 ?? "", masked.sub4 ?? "", masked.sub5 ?? "", masked.createdAt?.toISOString() ?? ""]
          .map(csvEscape)
          .join(",")
      })
    )
  ).join("\n")

  return header + csvRows
}
