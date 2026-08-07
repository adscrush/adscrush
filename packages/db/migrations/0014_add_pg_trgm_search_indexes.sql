-- Migration: Add pg_trgm search indexes
-- Created: 2026-08-04
--
-- Enables GIN trigram indexes for the leading-wildcard `ILIKE '%…%'` searches
-- used across the API routers (ad-accounts, advertisers, campaigns, categories,
-- creatives, departments, employees, funnels, languages, media-buyers, media,
-- products, portal lists, leads). A standard btree index cannot serve a
-- leading-wildcard pattern; pg_trgm GIN indexes make these searches
-- index-assisted instead of sequential scans.
--
-- Applied via psql (idempotent — safe to re-run):
--   psql "$DATABASE_URL" -f packages/db/migrations/0014_add_pg_trgm_search_indexes.sql

-- ─── Extension ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── ad_accounts ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS ad_accounts_name_trgm_idx
  ON ad_accounts USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ad_accounts_account_id_trgm_idx
  ON ad_accounts USING gin (account_id gin_trgm_ops);

-- ─── advertisers ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS advertisers_name_trgm_idx
  ON advertisers USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS advertisers_company_name_trgm_idx
  ON advertisers USING gin (company_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS advertisers_email_trgm_idx
  ON advertisers USING gin (email gin_trgm_ops);

-- ─── campaigns ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS campaigns_name_trgm_idx
  ON campaigns USING gin (name gin_trgm_ops);

-- ─── categories ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS categories_name_trgm_idx
  ON categories USING gin (name gin_trgm_ops);

-- ─── creatives ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS creatives_name_trgm_idx
  ON creatives USING gin (name gin_trgm_ops);

-- ─── departments ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS departments_name_trgm_idx
  ON departments USING gin (name gin_trgm_ops);

-- ─── funnels ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS funnels_name_trgm_idx
  ON funnels USING gin (name gin_trgm_ops);

-- ─── languages ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS languages_name_trgm_idx
  ON languages USING gin (name gin_trgm_ops);

-- ─── media_buyers ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS media_buyers_name_trgm_idx
  ON media_buyers USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS media_buyers_email_trgm_idx
  ON media_buyers USING gin (email gin_trgm_ops);

-- ─── media_files ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS media_files_name_trgm_idx
  ON media_files USING gin (name gin_trgm_ops);

-- ─── products ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS products_name_trgm_idx
  ON products USING gin (name gin_trgm_ops);

-- ─── user (reserved word — must be quoted) ───────────────────────────────────
CREATE INDEX IF NOT EXISTS user_name_trgm_idx
  ON "user" USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS user_email_trgm_idx
  ON "user" USING gin (email gin_trgm_ops);

-- ─── leads ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS leads_id_trgm_idx
  ON leads USING gin (id gin_trgm_ops);
CREATE INDEX IF NOT EXISTS leads_tid_trgm_idx
  ON leads USING gin (tid gin_trgm_ops);
CREATE INDEX IF NOT EXISTS leads_name_trgm_idx
  ON leads USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS leads_phone_trgm_idx
  ON leads USING gin (phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS leads_email_trgm_idx
  ON leads USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS leads_address_trgm_idx
  ON leads USING gin (address gin_trgm_ops);
CREATE INDEX IF NOT EXISTS leads_city_trgm_idx
  ON leads USING gin (city gin_trgm_ops);
CREATE INDEX IF NOT EXISTS leads_pincode_trgm_idx
  ON leads USING gin (pincode gin_trgm_ops);
