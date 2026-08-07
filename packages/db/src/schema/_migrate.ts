// drizzle-kit schema entry — includes ALL tables (regular + partitioned).
// Partitioned tables (clicks, conversions, audit_log) are created via raw SQL
// in sql/02_partitions.sql, but they are still exported here so that drizzle-kit
// has the full schema for type generation and can detect column-level changes.
// The actual DDL for partitions is managed by raw SQL, not by drizzle-kit.
// App code imports every table via index.ts instead.

export * from "./auth"
export * from "./departments"
export * from "./categories"
export * from "./languages"
export * from "./category-metafields"
export * from "./media"
export * from "./employees"
export * from "./advertisers"
export * from "./media-buyers"
export * from "./products"
export * from "./product-media"
export * from "./product-media-buyers"
export * from "./funnels"
export * from "./landing-pages"
export * from "./clicks"
export * from "./conversions"
export * from "./leads"
export * from "./audit-log"
export * from "./campaigns"
export * from "./ad-accounts"
export * from "./campaign-creatives"
export * from "./creative-folders"
export * from "./creatives"
export * from "./share-links"
export * from "./settings"
export * from "./tid-lookup"
export * from "./daily-stats"
export * from "./retention-policies"
export * from "./pii-key-versions"
export * from "./relations"
