-- 02_partitions.sql
-- Creates partitioned event tables (clicks, conversions, audit_log).
-- Run AFTER the baseline migration (Drizzle creates non-partitioned tables
-- via _migrate.ts; these 3 partitioned tables are excluded from migration
-- and created here instead).
--
-- Monthly range partitioning on created_at.
-- Initial partitions: current month + 2 ahead, 1 behind (3 total).

-- ── Helper: partition name for a given table and month ────────────────────
-- We define partitions manually for the first 3 months; pg_partman can take
-- over for ongoing automated management in production.

-- ── CLICKS ────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS clicks CASCADE;
CREATE TABLE IF NOT EXISTS clicks (
    id                  TEXT        NOT NULL,
    tid                 UUID        NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    product_id          TEXT        NOT NULL,
    media_buyer_id      TEXT        NOT NULL,
    advertiser_id       TEXT        NOT NULL,
    landing_page_id     TEXT,
    campaign_id         TEXT,
    funnel_id           TEXT,
    ad_account_id       TEXT,
    source              TEXT        NOT NULL DEFAULT '',
    -- Snapshot of the ad account's source platform (e.g. facebook, google) at
    -- click time, so reporting stays accurate even if the ad account changes.
    source_platform     TEXT,
    -- Marketing attribution (UTM parameters)
    utm_source          TEXT,
    utm_medium          TEXT,
    utm_campaign        TEXT,
    utm_term            TEXT,
    utm_content         TEXT,
    -- Creative attribution
    creative_id         TEXT,
    creative_name       TEXT,
    creative_thumbnail_url TEXT,
    ip_hash             TEXT,
    ip_encrypted        TEXT,
    geo_country         TEXT,
    geo_city            TEXT,
    geo_state           TEXT,
    geo_asn             TEXT,
    geo_isp             TEXT,
    user_agent_encrypted TEXT,
    device_type         TEXT,
    device_vendor       TEXT,
    device_model        TEXT,
    os                  TEXT,
    os_version          TEXT,
    browser             TEXT,
    browser_version     TEXT,
    referer             TEXT,
    aff_click_id        TEXT,
    sub_aff_id          TEXT,
    aff_sub1            TEXT,
    aff_sub2            TEXT,
    aff_sub3            TEXT,
    aff_sub4            TEXT,
    aff_sub5            TEXT,
    aff_sub6            TEXT,
    aff_sub7            TEXT,
    aff_sub8            TEXT,
    aff_sub9            TEXT,
    aff_sub10           TEXT,
    is_unique           BOOLEAN     NOT NULL DEFAULT false,
    redirect_url        TEXT,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Indexes (local per partition, inherits to all children automatically)
CREATE INDEX ON clicks (tid);
CREATE INDEX ON clicks (media_buyer_id, product_id, ip_hash, created_at);
CREATE INDEX ON clicks (product_id, created_at);
CREATE INDEX ON clicks (media_buyer_id, created_at);
CREATE INDEX ON clicks (advertiser_id, created_at);
CREATE INDEX ON clicks (campaign_id);
CREATE INDEX ON clicks (funnel_id);
CREATE INDEX ON clicks (ad_account_id);
CREATE INDEX ON clicks (source);
CREATE INDEX ON clicks (source_platform);
CREATE INDEX ON clicks (utm_source);
CREATE INDEX ON clicks (utm_campaign);
CREATE INDEX ON clicks (creative_id);
CREATE INDEX ON clicks (geo_country);
CREATE INDEX ON clicks (device_type);
CREATE INDEX ON clicks (device_vendor);
CREATE INDEX ON clicks (os);
CREATE INDEX ON clicks (id);

-- ── CONVERSIONS ───────────────────────────────────────────────────────────

DROP TABLE IF EXISTS conversions CASCADE;
CREATE TABLE IF NOT EXISTS conversions (
    id                   TEXT        NOT NULL,
    click_id             TEXT        NOT NULL,
    product_id           TEXT        NOT NULL,
    media_buyer_id       TEXT        NOT NULL,
    advertiser_id        TEXT        NOT NULL,
    campaign_id          TEXT,
    funnel_id            TEXT,
    ad_account_id        TEXT,
    -- Creative attribution (copied from click)
    creative_id          TEXT,
    creative_name        TEXT,
    creative_thumbnail_url TEXT,
    event                TEXT        NOT NULL DEFAULT 'conversion',
    payout               NUMERIC(12,4) NOT NULL DEFAULT '0',
    revenue              NUMERIC(12,4) NOT NULL DEFAULT '0',
    sale_amount          NUMERIC(12,4),
    currency             TEXT        NOT NULL DEFAULT 'USD',
    status               TEXT        NOT NULL DEFAULT 'pending',
    is_duplicate         BOOLEAN     NOT NULL DEFAULT false,
    method               TEXT        NOT NULL DEFAULT 'pixel',
    postback_url         TEXT,
    referrer_url         TEXT,
    ip_encrypted         TEXT,
    user_agent_encrypted TEXT,
    adv_sub1             TEXT,
    adv_sub2             TEXT,
    adv_sub3             TEXT,
    adv_sub4             TEXT,
    adv_sub5             TEXT,
    coupon               TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE INDEX ON conversions (click_id, created_at);
CREATE INDEX ON conversions (product_id, created_at);
CREATE INDEX ON conversions (media_buyer_id, created_at);
CREATE INDEX ON conversions (advertiser_id, created_at);
CREATE INDEX ON conversions (status);
CREATE INDEX ON conversions (campaign_id);
CREATE INDEX ON conversions (creative_id);
CREATE INDEX ON conversions (ad_account_id);
CREATE INDEX ON conversions (id);

-- ── AUDIT LOG ─────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS audit_log CASCADE;
CREATE TABLE IF NOT EXISTS audit_log (
    id              TEXT        NOT NULL,
    actor_user_id   TEXT,
    action          TEXT        NOT NULL,
    entity_type     TEXT        NOT NULL,
    entity_id       TEXT        NOT NULL,
    before          JSONB,
    after           JSONB,
    request_ip      TEXT,
    request_id      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE INDEX ON audit_log (entity_type, entity_id, created_at);
CREATE INDEX ON audit_log (actor_user_id, created_at);
CREATE INDEX ON audit_log (action, created_at);

-- ── Initial monthly partitions (3-month rolling window) ───────────────────

DO $$
DECLARE
    start_date  DATE;
    end_date    DATE;
    part_name   TEXT;
    tables      TEXT[] := ARRAY['clicks', 'conversions', 'audit_log'];
    tbl         TEXT;
    m           INT;
BEGIN
    -- Start from first day of previous month
    start_date := date_trunc('month', now() - interval '1 month')::DATE;
    FOR i IN 0..2 LOOP
        m := i;
        start_date := date_trunc('month', now() - interval '1 month' + (m || ' months')::INTERVAL)::DATE;
        end_date   := (start_date + interval '1 month')::DATE;
        part_name  := to_char(start_date, 'YYYY_MM');
        FOREACH tbl IN ARRAY tables LOOP
            EXECUTE format(
                'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
                tbl || '_' || part_name,
                tbl,
                start_date,
                end_date
            );
        END LOOP;
    END LOOP;
END $$;

-- ── Backward-compatible views for app code referring to old table names ───
-- Not needed here — app code imports directly via Drizzle references.
