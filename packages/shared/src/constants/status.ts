export function createEnum<const T extends Record<string, string>>(obj: T): T {
  return obj
}
export const getEnumValues = <const T extends Record<string, string>>(obj: T) =>
  Object.values(obj) as [T[keyof T], ...T[keyof T][]]

/* ---------------------------------- */
/* ENTITY STATUS */
/* ---------------------------------- */

export const ENTITY_STATUS = createEnum({
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
  SUSPENDED: "suspended",
})

export type EntityStatus = (typeof ENTITY_STATUS)[keyof typeof ENTITY_STATUS]

export const ENTITY_STATUS_VALUES = getEnumValues(ENTITY_STATUS)

/* ---------------------------------- */
/* MEDIA BUYER STATUS */
/* ---------------------------------- */

export const MEDIA_BUYER_STATUS = createEnum({
  ACTIVE: "active",
  PENDING: "pending",
  SUSPENDED: "suspended",
})

export type MediaBuyerStatus =
  (typeof MEDIA_BUYER_STATUS)[keyof typeof MEDIA_BUYER_STATUS]

export const MEDIA_BUYER_STATUS_VALUES = getEnumValues(MEDIA_BUYER_STATUS)

/* ---------------------------------- */
/* MEDIA BUYER KIND */
/* ---------------------------------- */

/**
 * Discriminates an in-house media buyer (an employee who also runs traffic)
 * from an external partner. "internal" rows carry an `employeeId`; "external"
 * rows do not. Both are first-class media buyers for attribution/reporting.
 */
export const MEDIA_BUYER_KIND = createEnum({
  INTERNAL: "internal",
  EXTERNAL: "external",
})

export type MediaBuyerKind =
  (typeof MEDIA_BUYER_KIND)[keyof typeof MEDIA_BUYER_KIND]

export const MEDIA_BUYER_KIND_VALUES = getEnumValues(MEDIA_BUYER_KIND)

/* ---------------------------------- */
/* PRODUCT STATUS */
/* ---------------------------------- */

export const PRODUCT_STATUS = createEnum({
  ACTIVE: "active",
  INACTIVE: "inactive",
  PAUSED: "paused",
  EXPIRED: "expired",
})

export type ProductStatus =
  (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS]

export const PRODUCT_STATUS_VALUES = getEnumValues(PRODUCT_STATUS)

/* ---------------------------------- */
/* PRODUCT VISIBILITY */
/* ---------------------------------- */

export const PRODUCT_VISIBILITY = createEnum({
  PUBLIC: "public",
  PRIVATE: "private",
  EXCLUSIVE: "exclusive",
})

export type ProductVisibility =
  (typeof PRODUCT_VISIBILITY)[keyof typeof PRODUCT_VISIBILITY]

export const PRODUCT_VISIBILITY_VALUES = getEnumValues(PRODUCT_VISIBILITY)

/* ---------------------------------- */
/* LANDING PAGE STATUS / FUNNEL STATUS */
/* ---------------------------------- */

export const LANDING_PAGE_STATUS = createEnum({
  ACTIVE: "active",
  INACTIVE: "inactive",
})

export type LandingPageStatus =
  (typeof LANDING_PAGE_STATUS)[keyof typeof LANDING_PAGE_STATUS]

export const LANDING_PAGE_STATUS_VALUES = getEnumValues(LANDING_PAGE_STATUS)

export const FUNNEL_STATUS = LANDING_PAGE_STATUS
export type FunnelStatus = LandingPageStatus
export const FUNNEL_STATUS_VALUES = LANDING_PAGE_STATUS_VALUES

/* ---------------------------------- */
/* PRODUCT MEDIA BUYER STATUS */
/* ---------------------------------- */

export const PRODUCT_MEDIA_BUYER_STATUS = createEnum({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
})

export type ProductMediaBuyerStatus =
  (typeof PRODUCT_MEDIA_BUYER_STATUS)[keyof typeof PRODUCT_MEDIA_BUYER_STATUS]

export const PRODUCT_MEDIA_BUYER_STATUS_VALUES = getEnumValues(
  PRODUCT_MEDIA_BUYER_STATUS
)

/* ---------------------------------- */
/* PAYOUT TYPE */
/* ---------------------------------- */

export const PAYOUT_TYPE = createEnum({
  CPA: "CPA",
  CPC: "CPC",
  CPL: "CPL",
  CPS: "CPS",
})

export type PayoutType = (typeof PAYOUT_TYPE)[keyof typeof PAYOUT_TYPE]

export const PAYOUT_TYPE_VALUES = getEnumValues(PAYOUT_TYPE)

/* ---------------------------------- */
/* REVENUE TYPE */
/* ---------------------------------- */

export const REVENUE_TYPE = createEnum({
  CPA: "CPA",
  CPC: "CPC",
  CPL: "CPL",
  CPS: "CPS",
})

export type RevenueType = (typeof REVENUE_TYPE)[keyof typeof REVENUE_TYPE]

export const REVENUE_TYPE_VALUES = getEnumValues(REVENUE_TYPE)

/* ---------------------------------- */
/* CAMPAIGN STATUS */
/* ---------------------------------- */

export const CAMPAIGN_STATUS = createEnum({
  ACTIVE: "active",
  INACTIVE: "inactive",
  PAUSED: "paused",
  EXPIRED: "expired",
})

export type CampaignStatus =
  (typeof CAMPAIGN_STATUS)[keyof typeof CAMPAIGN_STATUS]

export const CAMPAIGN_STATUS_VALUES = getEnumValues(CAMPAIGN_STATUS)

/* ---------------------------------- */
/* AD ACCOUNT STATUS */
/* ---------------------------------- */

export const AD_ACCOUNT_STATUS = createEnum({
  ACTIVE: "active",
  PAUSED: "paused",
  DISCONNECTED: "disconnected",
  RISK_CONTROL: "risk_control",
  DISABLED: "disabled",
  NOT_IN_USE: "not_in_use",
})

export type AdAccountStatus =
  (typeof AD_ACCOUNT_STATUS)[keyof typeof AD_ACCOUNT_STATUS]

export const AD_ACCOUNT_STATUS_VALUES = getEnumValues(AD_ACCOUNT_STATUS)

export function parseAdAccountStatusLabel(label: string): AdAccountStatus | null {
  const normalized = label.trim().toLowerCase().replace(/\s+/g, "_")
  const match = AD_ACCOUNT_STATUS_VALUES.find((v) => v === normalized)
  return match ?? null
}

/* ---------------------------------- */
/* CREATIVE STATUS */
/* ---------------------------------- */

export const CREATIVE_STATUS = createEnum({
  ACTIVE: "active",
  INACTIVE: "inactive",
})

export type CreativeStatus =
  (typeof CREATIVE_STATUS)[keyof typeof CREATIVE_STATUS]

export const CREATIVE_STATUS_VALUES = getEnumValues(CREATIVE_STATUS)

/* ---------------------------------- */
/* CONVERSION STATUS */
/* ---------------------------------- */

export const CONVERSION_STATUS = createEnum({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CHARGEBACK: "chargeback",
})

export type ConversionStatus =
  (typeof CONVERSION_STATUS)[keyof typeof CONVERSION_STATUS]

export const CONVERSION_STATUS_VALUES = getEnumValues(CONVERSION_STATUS)

/* ---------------------------------- */
/* LEAD STATUS */
/* ---------------------------------- */

export const LEAD_STATUS = createEnum({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
})

export type LeadStatus =
  (typeof LEAD_STATUS)[keyof typeof LEAD_STATUS]

export const LEAD_STATUS_VALUES = getEnumValues(LEAD_STATUS)

/**
 * Valid status transitions for lead status postback.
 * Prevents fraud by restricting which transitions are allowed.
 * - pending → approved, rejected
 * - approved → rejected (chargeback)
 * - rejected → (terminal, no transitions)
 */
export const LEAD_STATUS_TRANSITIONS: Record<LeadStatus, readonly LeadStatus[]> = {
  [LEAD_STATUS.PENDING]: [LEAD_STATUS.APPROVED, LEAD_STATUS.REJECTED],
  [LEAD_STATUS.APPROVED]: [LEAD_STATUS.REJECTED], // Allow chargeback
  [LEAD_STATUS.REJECTED]: [], // Terminal state
}

/** Maximum age in days for status updates. Leads older than this cannot be updated. */
export const LEAD_STATUS_MAX_AGE_DAYS = 30

/* ---------------------------------- */
/* SHARED BASE STATUS */
/* ---------------------------------- */

export const BASE_ACTIVE_STATUS = createEnum({
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
})

/* ---------------------------------- */
/* ADVERTISER STATUS */
/* ---------------------------------- */

export const ADVERTISER_STATUS = BASE_ACTIVE_STATUS

export type AdvertiserStatus =
  (typeof ADVERTISER_STATUS)[keyof typeof ADVERTISER_STATUS]

export const ADVERTISER_STATUS_VALUES = getEnumValues(ADVERTISER_STATUS)

/* ---------------------------------- */
/* EMPLOYEE STATUS */
/* ---------------------------------- */

export const EMPLOYEE_STATUS = createEnum({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
})

export const EMPLOYEE_STATUS_VALUES = getEnumValues(EMPLOYEE_STATUS)
export type EmployeeStatus =
  (typeof EMPLOYEE_STATUS)[keyof typeof EMPLOYEE_STATUS]

/* ---------------------------------- */
/* ACCESS LEVEL */
/* ---------------------------------- */

export const ACCESS_LEVEL = createEnum({
  ALL: "all",
  SELECTED: "selected",
})

export type AccessLevel = (typeof ACCESS_LEVEL)[keyof typeof ACCESS_LEVEL]

export const ACCESS_LEVEL_VALUES = getEnumValues(ACCESS_LEVEL)
