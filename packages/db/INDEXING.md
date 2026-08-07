# Adscrush Database Indexing Strategy

## Index Design Principles

1. **Local indexes on partitioned tables** — indexes on `clicks`, `conversions`, `audit_log` are per-partition (created automatically on each partition). No global indexes.
2. **Covering indexes for hot paths** — the `isUniqueClick` dedup query drives one composite index with all filter columns.
3. **Partial indexes for conditional queries** — conversion dedup only needs to scan non-duplicate rows.
4. **BRIN for time-ordered scans** — on partitioned event tables where range scans on `created_at` are common.
5. **GIN for JSON/array queries** — permissions JSONB and tags arrays.
6. **GIN trigram (pg_trgm) for fuzzy/leading-wildcard search** — `ILIKE '%…%'` cannot use btree indexes; `gin_trgm_ops` makes entity search index-assisted. See the [Trigram Search Indexes](#trigram-search-indexes) section below.

## Index Catalog

### `clicks` (partitioned, ~10k–500k rows/day)

| Index | Type | Columns | Rationale |
|---|---|---|---|
| `pk_clicks` | primary key | `(id, created_at)` | Partition key required in PK. Composite for unique row identity. |
| `clicks_tid_idx` | btree | `(tid)` | Lookup by transaction ID (conversion attribution). `tid_lookup` sidecar used first; this is fallback. |
| `clicks_dedup_idx` | btree | `(media_buyer_id, product_id, ip_hash, created_at DESC)` | **Hot path.** `isUniqueClick()` filters on these 4 columns. The `ip_hash` (not plaintext IP) enables equality lookup while preserving GDPR compliance. |
| `clicks_product_created_idx` | btree | `(product_id, created_at DESC)` | Reporting: click count by product over time. |
| `clicks_media_buyer_created_idx` | btree | `(media_buyer_id, created_at DESC)` | Reporting: click count by media buyer. |
| `clicks_advertiser_created_idx` | btree | `(advertiser_id, created_at DESC)` | Reporting: advertiser dashboard. |
| `clicks_campaign_idx` | btree | `(campaign_id)` | Campaign-level reporting. |
| `clicks_ad_account_idx` | btree | `(ad_account_id)` | Ad-account-scoped queries. |
| `clicks_source_idx` | btree | `(source)` | Traffic source breakdown. |
| `clicks_geo_country_idx` | btree | `(geo_country)` | Geo reporting (low cardinality filter). |
| `clicks_device_type_idx` | btree | `(device_type)` | Device reporting. |
| `clicks_os_idx` | btree | `(os)` | OS reporting. |
| `clicks_id_lookup_idx` | btree | `(id)` | Bare-id lookups when partition key is not known (rare). |

> **BRIN consideration:** If aggregate/reporting queries scan entire month ranges, replace `clicks_product_created_idx` with a BRIN index on `(created_at)` for ~100x smaller index size. Evaluate at scale.

### `conversions` (partitioned)

| Index | Type | Columns | Rationale |
|---|---|---|---|
| `pk_conversions` | primary key | `(id, created_at)` | Partition key in PK. |
| `conversions_click_idx` | btree | `(click_id, created_at)` | Join to clicks, scoped by time. |
| `conversions_product_created_idx` | btree | `(product_id, created_at)` | Product revenue reporting. |
| `conversions_media_buyer_created_idx` | btree | `(media_buyer_id, created_at)` | Media buyer earnings. |
| `conversions_advertiser_created_idx` | btree | `(advertiser_id, created_at)` | Advertiser spend. |
| `conversions_status_idx` | btree | `(status)` | Queue processing (pending → approved/rejected). |
| `conversions_campaign_idx` | btree | `(campaign_id)` | Campaign ROI. |
| `conversions_ad_account_idx` | btree | `(ad_account_id)` | Ad account cost/revenue. |
| `conversions_id_lookup_idx` | btree | `(id)` | Rare bare-id lookup. |

> **Partial index opportunity (add in future):**
> ```sql
> CREATE INDEX CONCURRENTLY conversions_dedup_idx
>   ON conversions (click_id, event)
>   WHERE is_duplicate = false;
> ```
> Covers the conversion dedup query: `SELECT id FROM conversions WHERE click_id = $1 AND event = $2 AND is_duplicate = false LIMIT 1`.

### `audit_log` (partitioned)

| Index | Type | Columns | Rationale |
|---|---|---|---|
| `pk_audit_log` | primary key | `(id, created_at)` | Partition key in PK. |
| `audit_log_entity_idx` | btree | `(entity_type, entity_id, created_at)` | History for a specific entity. |
| `audit_log_actor_idx` | btree | `(actor_user_id, created_at)` | Actions by a specific user. |
| `audit_log_action_idx` | btree | `(action, created_at)` | Filter by action type. |

### Small tables (unindexable or single PK index)

All standard Drizzle-generated tables get indexes on FK columns and status columns as defined in their respective schema files. Key ones:

| Table | Indexes | Rationale |
|---|---|---|
| `products` | (FKs: advertiser_id, category_id; status) | Dashboard listing, advertiser scope |
| `offers` | (FKs: advertiser_id, product_id; status) | Offer listing |
| `campaigns` | (FKs: offer_id; status) | Campaign listing |
| `daily_stats` | `unique (product_id, media_buyer_id, advertiser_id, campaign_id, date)` + per-entity date composites | Upsert key, reporting rollups |
| `tid_lookup` | `unique (tid)`, btree `(click_id)` | O(1) click lookup by tid |

### GIN indexes

| Table | Column | Type | Rationale |
|---|---|---|---|
| `employees` | `permissions` | jsonb | Find employees with specific permissions |
| `media_files` | `tags` | text[] | Tag-based media search |
| `creatives` | `tags` | text[] | Tag-based creative search (add after migration) |

### Trigram Search Indexes

**Extension:** `pg_trgm` (installed in `src/sql/01_extensions.sql` via `db:postinit`; also created by migration `0014`).

Every list/search endpoint in the API uses leading-wildcard `ILIKE '%…%'` filters (name/email/company/account lookups, portal lead search, media search). Btree indexes cannot satisfy `%…%` patterns — without these indexes those queries degrade to sequential scans once tables grow. Migration `0014_add_pg_trgm_search_indexes.sql` creates one GIN index with `gin_trgm_ops` per searchable column (idempotent; apply via `psql "$DATABASE_URL" -f packages/db/migrations/0014_add_pg_trgm_search_indexes.sql`).

| Table | Columns (gin_trgm_ops) | Backing query |
|---|---|---|
| `ad_accounts` | `name`, `account_id` | ad-accounts list; campaign ad-account picker |
| `advertisers` | `name`, `company_name`, `email` | advertisers list + search |
| `campaigns` | `name` | campaigns list (admin + portal) |
| `categories` | `name` | categories list + search |
| `creatives` | `name` | creatives list |
| `departments` | `name` | departments list + search |
| `funnels` | `name` | funnels list + search |
| `languages` | `name` | languages list + search |
| `media_buyers` | `name`, `email` | media-buyers list + search |
| `media_files` | `name` | media library search |
| `products` | `name` | products list + search; portal product search |
| `"user"` | `name`, `email` | employees list + search (quoted — reserved word) |
| `leads` | `id`, `tid`, `name`, `phone`, `email`, `address`, `city`, `pincode` | portal lead search (OR across all fields) |

**Notes / trade-offs:**

- **Minimum match length** — trigram matching requires search terms of ≥ 3 characters; shorter queries fall back to a sequential scan. Acceptable, since 1–2 char searches are rarely useful on these columns.
- **Write amplification** — GIN indexes add write cost on every insert/update to these columns. All 13 tables are modest-size reference/entity tables (not high-ingest event streams), so the trade-off is favorable. `leads` is the largest; if it grows significantly, consider pruning the low-value `id`/`tid`/`pincode` indexes.
- **Case-insensitivity** — `ILIKE` is handled naturally; pg_trgm lowercases trigrams.
- **Btree complements** — unique btree indexes on `email`/`name` columns remain for exact lookups; trgm GIN indexes only serve substring patterns.
- **Monitoring** — watch `pg_stat_user_indexes.idx_scan` for these indexes; if any show zero scans after rollout, drop them.

## Performance Monitoring (Planned)

- Track index usage via `pg_stat_user_indexes` — drop unused indexes.
- Monitor `pg_stat_all_tables.idx_scan` vs `seq_scan` for hot tables.
- Monthly `REINDEX CONCURRENTLY` on most-frequently-updated indexes if bloat exceeds 30% (measured by `pgstattuple`).
- Consider adding BRIN indexes on `created_at` for partitioned event tables if btree indexes become too large.
