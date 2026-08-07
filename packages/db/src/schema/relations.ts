import { relations } from "drizzle-orm"
import { users } from "./auth"
import { departments } from "./departments"
import { mediaBuyers } from "./media-buyers"
import { mediaFiles, mediaFolders } from "./media"
import { advertisers } from "./advertisers"
import { categories } from "./categories"
import {
  employees,
  employeeMediaBuyerAccess,
  employeeAdvertiserAccess,
} from "./employees"
import { products } from "./products"
import { productMedia } from "./product-media"
import { productMediaBuyers } from "./product-media-buyers"
import { funnels } from "./funnels"
import { landingPages } from "./landing-pages"
import { clicks } from "./clicks"
import { conversions } from "./conversions"
import { campaigns, campaignAdAccounts } from "./campaigns"
import { adAccounts, adAccountSpend } from "./ad-accounts"
import { creativeFolders } from "./creative-folders"
import {
  creatives,
  creativeFiles,
  creativeNotes,
  creativePerformanceTags,
} from "./creatives"
import { shareLinks } from "./share-links"
import { campaignCreatives } from "./campaign-creatives"
import { auditLog } from "./audit-log"
import { dailyStats } from "./daily-stats"
import { tidLookup } from "./tid-lookup"
import { retentionPolicies } from "./retention-policies"
import { piiKeyVersions } from "./pii-key-versions"
import { categoryMetafields, productMetafieldValues } from "./category-metafields"

// ── Auth ──────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one }) => ({
  employee: one(employees, {
    fields: [users.id],
    references: [employees.userId],
  }),
}))

// ── Org ───────────────────────────────────────────────────────────────────

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
  managedAdvertisers: many(advertisers),
  managedMediaBuyers: many(mediaBuyers, {
    relationName: "mb_account_manager",
  }),
  mediaBuyerProfile: one(mediaBuyers, {
    fields: [employees.id],
    references: [mediaBuyers.employeeId],
    relationName: "mb_employee_profile",
  }),
  mediaBuyerAccess: many(employeeMediaBuyerAccess),
  advertiserAccess: many(employeeAdvertiserAccess),
}))

export const employeeMediaBuyerAccessRelations = relations(
  employeeMediaBuyerAccess,
  ({ one }) => ({
    employee: one(employees, {
      fields: [employeeMediaBuyerAccess.employeeId],
      references: [employees.id],
    }),
    mediaBuyer: one(mediaBuyers, {
      fields: [employeeMediaBuyerAccess.mediaBuyerId],
      references: [mediaBuyers.id],
    }),
  })
)

export const employeeAdvertiserAccessRelations = relations(
  employeeAdvertiserAccess,
  ({ one }) => ({
    employee: one(employees, {
      fields: [employeeAdvertiserAccess.employeeId],
      references: [employees.id],
    }),
    advertiser: one(advertisers, {
      fields: [employeeAdvertiserAccess.advertiserId],
      references: [advertisers.id],
    }),
  })
)

// ── Parties ───────────────────────────────────────────────────────────────

export const advertisersRelations = relations(advertisers, ({ one, many }) => ({
  accountManager: one(employees, {
    fields: [advertisers.accountManagerId],
    references: [employees.id],
  }),
  products: many(products),
  user: one(users, {
    fields: [advertisers.userId],
    references: [users.id],
  }),
}))

export const mediaBuyersRelations = relations(mediaBuyers, ({ one, many }) => ({
  accountManager: one(employees, {
    fields: [mediaBuyers.accountManagerId],
    references: [employees.id],
    relationName: "mb_account_manager",
  }),
  employee: one(employees, {
    fields: [mediaBuyers.employeeId],
    references: [employees.id],
    relationName: "mb_employee_profile",
  }),
  user: one(users, {
    fields: [mediaBuyers.userId],
    references: [users.id],
  }),
  productMediaBuyers: many(productMediaBuyers),
  clicks: many(clicks),
  conversions: many(conversions),
  adAccounts: many(adAccounts),
}))

// ── Catalog ───────────────────────────────────────────────────────────────

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
  metafields: many(categoryMetafields),
}))

export const categoryMetafieldsRelations = relations(
  categoryMetafields,
  ({ one, many }) => ({
    category: one(categories, {
      fields: [categoryMetafields.categoryId],
      references: [categories.id],
    }),
    values: many(productMetafieldValues),
  })
)

export const productMetafieldValuesRelations = relations(
  productMetafieldValues,
  ({ one }) => ({
    product: one(products, {
      fields: [productMetafieldValues.productId],
      references: [products.id],
    }),
    metafield: one(categoryMetafields, {
      fields: [productMetafieldValues.metafieldId],
      references: [categoryMetafields.id],
    }),
  })
)

export const productsRelations = relations(products, ({ one, many }) => ({
  advertiser: one(advertisers, {
    fields: [products.advertiserId],
    references: [advertisers.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  productMediaBuyers: many(productMediaBuyers),
  funnels: many(funnels),
  campaigns: many(campaigns),
  creativeFolders: many(creativeFolders),
  creatives: many(creatives),
  media: many(productMedia),
  dailyStats: many(dailyStats),
}))

export const productMediaRelations = relations(productMedia, ({ one }) => ({
  product: one(products, {
    fields: [productMedia.productId],
    references: [products.id],
  }),
  mediaFile: one(mediaFiles, {
    fields: [productMedia.mediaFileId],
    references: [mediaFiles.id],
  }),
}))

// ── Product media buyers ──────────────────────────────────────────────────

export const productMediaBuyersRelations = relations(productMediaBuyers, ({ one }) => ({
  product: one(products, {
    fields: [productMediaBuyers.productId],
    references: [products.id],
  }),
  mediaBuyer: one(mediaBuyers, {
    fields: [productMediaBuyers.mediaBuyerId],
    references: [mediaBuyers.id],
  }),
}))

export const funnelsRelations = relations(funnels, ({ one, many }) => ({
  product: one(products, {
    fields: [funnels.productId],
    references: [products.id],
  }),
  landingPages: many(landingPages),
  campaigns: many(campaigns),
}))

export const landingPagesRelations = relations(landingPages, ({ one }) => ({
  funnel: one(funnels, {
    fields: [landingPages.funnelId],
    references: [funnels.id],
  }),
}))

// ── Campaigns ─────────────────────────────────────────────────────────────

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  product: one(products, {
    fields: [campaigns.productId],
    references: [products.id],
  }),
  funnel: one(funnels, {
    fields: [campaigns.funnelId],
    references: [funnels.id],
  }),
  campaignAdAccounts: many(campaignAdAccounts),
  campaignCreatives: many(campaignCreatives),
  dailyStats: many(dailyStats),
}))

export const campaignAdAccountsRelations = relations(campaignAdAccounts, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignAdAccounts.campaignId],
    references: [campaigns.id],
  }),
  adAccount: one(adAccounts, {
    fields: [campaignAdAccounts.adAccountId],
    references: [adAccounts.id],
  }),
}))

export const adAccountsRelations = relations(adAccounts, ({ one, many }) => ({
  mediaBuyer: one(mediaBuyers, {
    fields: [adAccounts.mediaBuyerId],
    references: [mediaBuyers.id],
  }),
  campaignAdAccounts: many(campaignAdAccounts),
  spend: many(adAccountSpend),
}))

export const adAccountSpendRelations = relations(adAccountSpend, ({ one }) => ({
  adAccount: one(adAccounts, {
    fields: [adAccountSpend.adAccountId],
    references: [adAccounts.id],
  }),
}))

// ── Creatives & Media ─────────────────────────────────────────────────────

export const creativeFoldersRelations = relations(creativeFolders, ({ one, many }) => ({
  product: one(products, {
    fields: [creativeFolders.productId],
    references: [products.id],
  }),
  parent: one(creativeFolders, {
    fields: [creativeFolders.parentId],
    references: [creativeFolders.id],
    relationName: "folder_children",
  }),
  children: many(creativeFolders, { relationName: "folder_children" }),
  creatives: many(creatives),
  shareLinks: many(shareLinks),
}))

export const creativesRelations = relations(creatives, ({ one, many }) => ({
  product: one(products, {
    fields: [creatives.productId],
    references: [products.id],
  }),
  folder: one(creativeFolders, {
    fields: [creatives.folderId],
    references: [creativeFolders.id],
  }),
  files: many(creativeFiles),
  notes: many(creativeNotes),
  performanceTags: many(creativePerformanceTags),
  campaignCreatives: many(campaignCreatives),
}))

export const creativeFilesRelations = relations(creativeFiles, ({ one }) => ({
  creative: one(creatives, {
    fields: [creativeFiles.creativeId],
    references: [creatives.id],
  }),
  mediaFile: one(mediaFiles, {
    fields: [creativeFiles.mediaFileId],
    references: [mediaFiles.id],
  }),
}))

export const creativeNotesRelations = relations(creativeNotes, ({ one }) => ({
  creative: one(creatives, {
    fields: [creativeNotes.creativeId],
    references: [creatives.id],
  }),
  mediaBuyer: one(mediaBuyers, {
    fields: [creativeNotes.mediaBuyerId],
    references: [mediaBuyers.id],
  }),
}))

export const creativePerformanceTagsRelations = relations(
  creativePerformanceTags,
  ({ one }) => ({
    creative: one(creatives, {
      fields: [creativePerformanceTags.creativeId],
      references: [creatives.id],
    }),
    mediaBuyer: one(mediaBuyers, {
      fields: [creativePerformanceTags.mediaBuyerId],
      references: [mediaBuyers.id],
    }),
  })
)

export const shareLinksRelations = relations(shareLinks, ({ one }) => ({
  folder: one(creativeFolders, {
    fields: [shareLinks.folderId],
    references: [creativeFolders.id],
  }),
  createdByUser: one(users, {
    fields: [shareLinks.createdBy],
    references: [users.id],
  }),
}))

export const campaignCreativesRelations = relations(campaignCreatives, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignCreatives.campaignId],
    references: [campaigns.id],
  }),
  creative: one(creatives, {
    fields: [campaignCreatives.creativeId],
    references: [creatives.id],
  }),
}))

export const mediaFoldersRelations = relations(mediaFolders, ({ one, many }) => ({
  parent: one(mediaFolders, {
    fields: [mediaFolders.parentId],
    references: [mediaFolders.id],
    relationName: "media_folder_children",
  }),
  children: many(mediaFolders, { relationName: "media_folder_children" }),
  createdByUser: one(users, {
    fields: [mediaFolders.createdBy],
    references: [users.id],
  }),
}))

export const mediaFilesRelations = relations(mediaFiles, ({ one, many }) => ({
  folder: one(mediaFolders, {
    fields: [mediaFiles.folderId],
    references: [mediaFolders.id],
  }),
  uploadedByUser: one(users, {
    fields: [mediaFiles.uploadedBy],
    references: [users.id],
  }),
  productMedia: many(productMedia),
  creativeFiles: many(creativeFiles),
}))

// ── Tracking (partitioned events) ─────────────────────────────────────────

export const clicksRelations = relations(clicks, ({ one, many }) => ({
  product: one(products, {
    fields: [clicks.productId],
    references: [products.id],
  }),
  mediaBuyer: one(mediaBuyers, {
    fields: [clicks.mediaBuyerId],
    references: [mediaBuyers.id],
  }),
  advertiser: one(advertisers, {
    fields: [clicks.advertiserId],
    references: [advertisers.id],
  }),
  landingPage: one(landingPages, {
    fields: [clicks.landingPageId],
    references: [landingPages.id],
  }),
  campaign: one(campaigns, {
    fields: [clicks.campaignId],
    references: [campaigns.id],
  }),
  funnel: one(funnels, {
    fields: [clicks.funnelId],
    references: [funnels.id],
  }),
  adAccount: one(adAccounts, {
    fields: [clicks.adAccountId],
    references: [adAccounts.id],
  }),
  conversions: many(conversions),
}))

export const conversionsRelations = relations(conversions, ({ one }) => ({
  click: one(clicks, {
    fields: [conversions.clickId],
    references: [clicks.id],
  }),
  product: one(products, {
    fields: [conversions.productId],
    references: [products.id],
  }),
  mediaBuyer: one(mediaBuyers, {
    fields: [conversions.mediaBuyerId],
    references: [mediaBuyers.id],
  }),
  advertiser: one(advertisers, {
    fields: [conversions.advertiserId],
    references: [advertisers.id],
  }),
  campaign: one(campaigns, {
    fields: [conversions.campaignId],
    references: [campaigns.id],
  }),
  adAccount: one(adAccounts, {
    fields: [conversions.adAccountId],
    references: [adAccounts.id],
  }),
}))

// ── Append-only audit log ─────────────────────────────────────────────────

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  actor: one(users, {
    fields: [auditLog.actorUserId],
    references: [users.id],
  }),
}))

// ── Reporting rollups ─────────────────────────────────────────────────────

export const dailyStatsRelations = relations(dailyStats, ({ one }) => ({
  product: one(products, {
    fields: [dailyStats.productId],
    references: [products.id],
  }),
  mediaBuyer: one(mediaBuyers, {
    fields: [dailyStats.mediaBuyerId],
    references: [mediaBuyers.id],
  }),
  advertiser: one(advertisers, {
    fields: [dailyStats.advertiserId],
    references: [advertisers.id],
  }),
  campaign: one(campaigns, {
    fields: [dailyStats.campaignId],
    references: [campaigns.id],
  }),
}))

// ── Sidecars ──────────────────────────────────────────────────────────────

export const tidLookupRelations = relations(tidLookup, ({ one }) => ({
  click: one(clicks, {
    fields: [tidLookup.clickId],
    references: [clicks.id],
  }),
}))

export const retentionPoliciesRelations = relations(retentionPolicies, () => ({}))
export const piiKeyVersionsRelations = relations(piiKeyVersions, () => ({}))
