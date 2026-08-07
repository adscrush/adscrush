-- 04_rls.sql
-- Row-Level Security policies for multi-tenant isolation.
-- Run after tables are created and roles are assigned.
-- The app sets `app.tenant_scope` and `app.tenant_role` per request.
-- app_migrator bypasses RLS (owns DDL).

-- Helper: enable RLS and create scoped policies for a table
-- Pattern: each entity has a filter column (media_buyer_id, advertiser_id, etc.)
-- that is compared to the session's tenant_scope value.

-- ── CLICKS ────────────────────────────────────────────────────────────────
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY clicks_media_buyer_scope ON clicks
    FOR ALL
    USING (media_buyer_id = current_setting('app.tenant_scope', true));

CREATE POLICY clicks_advertiser_scope ON clicks
    FOR ALL
    USING (advertiser_id = current_setting('app.tenant_scope', true));

-- ── CONVERSIONS ───────────────────────────────────────────────────────────
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY conversions_media_buyer_scope ON conversions
    FOR ALL
    USING (media_buyer_id = current_setting('app.tenant_scope', true));

CREATE POLICY conversions_advertiser_scope ON conversions
    FOR ALL
    USING (advertiser_id = current_setting('app.tenant_scope', true));

-- ── PRODUCTS ──────────────────────────────────────────────────────────────
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_scope ON products
    FOR ALL
    USING (advertiser_id = current_setting('app.tenant_scope', true));

-- ── CREATIVES ─────────────────────────────────────────────────────────────
ALTER TABLE creatives ENABLE ROW LEVEL SECURITY;

-- Note: creatives reference products, which reference advertisers.
-- For efficient RLS, we join through the product chain.
CREATE POLICY creatives_scope ON creatives
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM products
            WHERE products.id = creatives.product_id
            AND products.advertiser_id = current_setting('app.tenant_scope', true)
        )
    );

-- ── CAMPAIGNS ─────────────────────────────────────────────────────────────
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY campaigns_scope ON campaigns
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM products
            WHERE products.id = campaigns.product_id
            AND products.advertiser_id = current_setting('app.tenant_scope', true)
        )
    );

-- ── AD_ACCOUNTS ───────────────────────────────────────────────────────────
ALTER TABLE ad_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY ad_accounts_media_buyer_scope ON ad_accounts
    FOR ALL
    USING (media_buyer_id = current_setting('app.tenant_scope', true));

-- ── DAILY_STATS ───────────────────────────────────────────────────────────
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY daily_stats_media_buyer_scope ON daily_stats
    FOR ALL
    USING (media_buyer_id = current_setting('app.tenant_scope', true));

CREATE POLICY daily_stats_advertiser_scope ON daily_stats
    FOR ALL
    USING (advertiser_id = current_setting('app.tenant_scope', true));
