# Adscrush Database Schema (Redesigned)

## Conventions

| Rule | Standard |
|---|---|
| **Naming** | `snake_case` for all domain tables/columns. Auth tables (Better Auth) retain `camelCase` as required by the library. |
| **Timestamps** | `timestamp with time zone, precision 6` everywhere. Never bare `timestamp`. |
| **IDs** | Prefixed text IDs (e.g. `usr_a1B2c3D4e5F6`, `clk_X7y8Z9...`). Sortable, URL-safe, debuggable. |
| **Money** | `numeric(12,4)` — 12 total digits, 4 fractional. Defined once in `_lib.moneyColumn()`. |
| **Soft-delete** | `deleted_at timestamptz` on all business entities (employees, advertisers, media_buyers, products, offers, campaigns, creatives). NULL = active. Event tables (clicks/conversions) are append-only, never soft-deleted. |
| **PII** | `ip_hash` (HMAC-SHA256 with pepper) for equality/dedup. `ip_encrypted` / `user_agent_encrypted` for the raw values (AES-256-GCM at the application layer). Never plaintext. |
| **Enums** | Drizzle `text` columns with `{ enum: [...] }` — uses Postgres CHECK constraints internally. Values imported from `@adscrush/shared/constants/status`. |

## Partitioning

Three tables are range-partitioned monthly on `created_at`:

- **`clicks`** — PK `(id, created_at)`. No inbound FKs. Foreign keys to products, advertisers, etc. are retained.
- **`conversions`** — PK `(id, created_at)`. No FK to `clicks` (logical reference via `click_id`). FKs to other entities retained.
- **`audit_log`** — PK `(id, created_at)`. INSERT-only role enforcement.

DDL managed by `packages/db/src/sql/02_partitions.sql` (run via `db:postinit`). Drizzle declarations in `schema/clicks.ts`, `schema/conversions.ts`, `schema/audit-log.ts` exist for type-safe query building only — not included in migration generation.

## Entity Relationship Diagram

```mermaid
erDiagram
    %% ── Auth ──
    user ||--o{ session : has
    user ||--o{ account : has
    user ||--o{ verification : has

    %% ── Org ──
    user |o--|| employee : is
    employee }o--|| department : belongs_to
    employee }o--o{ media_buyer : manages
    employee }o--o{ advertiser : manages
    employee }o--o{ media_buyer : via_employee_media_buyer_access
    employee }o--o{ advertiser : via_employee_advertiser_access

    %% ── Catalog ──
    advertiser ||--o{ product : has
    category ||--o{ product : classifies
    category ||--o{ category_metafield : defines
    category_metafield ||--o{ product_metafield_value : captures
    product ||--o{ product_metafield_value : has
    product ||--o{ product_variant_option : has
    productVariantOption ||--o{ product_variant_option_value : has
    product ||--o{ product_variant : has
    product ||--o{ product_media : has
    media_file ||--o{ product_media : used_in
    product ||--o{ product_media_buyer : targets
    media_buyer ||--o{ product_media_buyer : applies_for

    %% ── Offers ──
    advertiser ||--o{ offer : creates
    product ||--o{ offer : for
    offer ||--o{ landing_page : uses
    offer ||--o{ offer_creative : references
    creative ||--o{ offer_creative : referenced_in
    product ||--o{ offer_targeting_rule : has
    offer_targeting_rule ||--o{ offer_targeting_condition : has

    %% ── Campaigns ──
    offer ||--o{ campaign : drives
    campaign }o--o{ ad_account : via_campaign_ad_account
    media_buyer ||--o{ ad_account : owns
    ad_account ||--o{ ad_account_spend : has_daily
    campaign ||--o{ campaign_creative : uses
    creative ||--o{ campaign_creative : used_in

    %% ── Creatives ──
    product ||--o{ creative_folder : organizes
    creative_folder ||--o{ creative : contains
    creative_folder ||--o{ creative_folder : nested_in
    product ||--o{ creative : for
    creative ||--o{ creative_file : has_file
    media_file ||--o{ creative_file : stored_as
    creative ||--o{ creative_note : has_note
    media_buyer ||--o{ creative_note : authored
    creative ||--o{ creative_performance_tag : tagged
    media_buyer ||--o{ creative_performance_tag : rated

    %% ── Media ──
    media_folder ||--o{ media_folder : nested_in
    user ||--o{ media_folder : created
    media_folder ||--o{ media_file : contains
    user ||--o{ media_file : uploaded
    creative_folder ||--o{ share_link : shared_via
    user ||--o{ share_link : created

    %% ── Tracking (partitioned) ──
    product ||--o{ click : tracked
    media_buyer ||--o{ click : generated
    advertiser ||--o{ click : attributed
    landing_page ||--o{ click : redirected_to
    campaign ||--o{ click : belongs_to
    ad_account ||--o{ click : sourced_from
    offer_targeting_rule ||--o{ click : matched_by
    click ||--o{ conversion : yields
    product ||--o{ conversion : for
    media_buyer ||--o{ conversion : commissioned
    advertiser ||--o{ conversion : attributed
    campaign ||--o{ conversion : belongs_to
    ad_account ||--o{ conversion : sourced_from
    tid_lookup ||--o| click : resolves
    product ||--o{ daily_stat : rolls_up
    media_buyer ||--o{ daily_stat : rolls_up
    advertiser ||--o{ daily_stat : rolls_up
    campaign ||--o{ daily_stat : rolls_up

    %% ── Audit ──
    user ||--o{ audit_log : acted

    %% ── Misc ──
    setting : standalone
    retention_policy : standalone
    pii_key_version : standalone
```

## Table Catalog

### Auth (Better Auth — camelCase columns)
| Table | Description |
|---|---|
| `user` | Platform users. Role discriminates `super_admin`, `admin`, `employee`, `advertiser`, `media_buyer`. |
| `session` | Auth sessions. Hierarchical: a user can have many sessions (one per device). |
| `account` | OAuth provider accounts + email/password credentials. |
| `verification` | Email verification, password reset tokens. |

### Org
| Table | Description |
|---|---|
| `departments` | Internal departments (Sales, Support, Tech). Soft-deletable. |
| `employees` | Internal staff. `permissions` jsonb holds fine-grained access control. |
| `employee_media_buyer_access` | Junction: employees with "selected" media-buyer access. |
| `employee_advertiser_access` | Junction: employees with "selected" advertiser access. |

### Parties
| Table | Description |
|---|---|
| `advertisers` | Brands / ad buyers. 1:1 with `user`. Soft-deletable. |
| `media_buyers` | Traffic sources / affiliates. 1:1 with `user`. `kind` discriminates internal (links to employee) vs external. Soft-deletable. |

### Catalog
| Table | Description |
|---|---|
| `categories` | Product categories. |
| `category_metafields` | Dynamic fields per category (e.g. "color", "size"). |
| `product_metafield_values` | Values of dynamic fields per product. |
| `products` | Advertised products/offers. Soft-deletable. |
| `product_variant_options` | Product variant option groups (e.g. "Color", "Size"). |
| `product_variant_option_values` | Individual option values (e.g. "Red", "XL"). |
| `product_variants` | SKU-level product variants with price, quantity. |
| `product_media` | Media attachments to products (images, videos, 3d-models). |
| `product_media_buyers` | Per-product, per-media-buyer pricing/status. |

### Offers
| Table | Description |
|---|---|
| `offers` | Advertiser offers per product. Soft-deletable. |
| `offer_creatives` | Junction: creative ↔ offer. |
| `offer_targeting_rules` | Rules controlling which media buyers can access offers. |
| `offer_targeting_conditions` | Individual conditions within a rule (country, OS, browser, device). |
| `landing_pages` | Campaign landing pages with optional weight-based split. |

### Campaigns
| Table | Description |
|---|---|
| `campaigns` | Advertising campaigns. Soft-deletable. |
| `campaign_ad_accounts` | Junction: ad accounts assigned to a campaign. |
| `campaign_creatives` | Junction: creatives assigned to a campaign. |
| `ad_accounts` | Ad platform accounts (Meta, Google, TikTok, etc.). |
| `ad_account_spend` | Daily spend records per ad account. |

### Creatives
| Table | Description |
|---|---|
| `creative_folders` | Hierarchical folder tree for organizing creatives. |
| `creatives` | Creative assets (ads). Soft-deletable. |
| `creative_files` | File-level breakdown within a creative. |
| `creative_notes` | Media buyer notes on creative performance. |
| `creative_performance_tags` | Binary performance thumbs-up/down per media buyer. |
| `share_links` | Time-limited, optionally password-protected folder shares. |
| `media_folders` | Hierarchical media library folders. |
| `media_files` | Uploaded media files (to Bunny CDN). |

### Tracking (Partitioned Event Tables)
| Table | Description |
|---|---|
| `clicks` | Click events. ~100MB+/month at target scale. Partitioned by month. |
| `conversions` | Conversion events. Partitioned by month. |
| `tid_lookup` | Sidecar: maps `tid` (UUID) → `click_id` for O(1) conversion attribution. |

### Reporting
| Table | Description |
|---|---|
| `daily_stats` | Pre-aggregated daily rollups. Avoids expensive GROUP BY on partitioned event tables. |

### Governance
| Table | Description |
|---|---|
| `audit_log` | Append-only mutation trail. Partitioned by month. |
| `retention_policies` | Per-entity PII/row retention TTLs. |
| `pii_key_versions` | Encryption key metadata (keys themselves live in secrets manager). |

### Misc
| Table | Description |
|---|---|
| `settings` | Key-value application configuration. |
