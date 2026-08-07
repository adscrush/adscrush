-- 01_extensions.sql
-- Extensions required by the redesigned schema.
-- Run once after the baseline migration (db:migrate). Idempotent.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Trigram similarity for fuzzy search — supports the GIN `gin_trgm_ops`
-- indexes created by migration 0014 (leading-wildcard ILIKE '%…%' search).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- pg_cron requires shared_preload_libraries in postgresql.conf and a
-- separate image (timescaledev/pg_cron or custom Dockerfile).
-- Partition management runs via `pnpm db:partition:manage` (cron or k8s CronJob).
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- pg_partman is extension v4+; requires manual install on PG16
-- For Docker: use pg_partman image or install in init script
-- CREATE EXTENSION IF NOT EXISTS pg_partman;
-- CREATE SCHEMA IF NOT EXISTS partman;
-- GRANT ALL ON SCHEMA partman TO app_migrator;
