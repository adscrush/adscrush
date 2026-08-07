-- 03_roles.sql
-- Least-privilege database roles for the application.
-- Run after 02_partitions.sql.
--
-- Roles:
--   app_migrator — owns DDL changes, BYPASSRLS. Used by CI/deployment tool.
--   app_writer   — INSERT/UPDATE on domain tables; INSERT only on audit_log.
--   app_reader   — SELECT on all tables (dashboards, reporting).

-- ── Create roles (idempotent) ──────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_migrator') THEN
    CREATE ROLE app_migrator WITH LOGIN PASSWORD 'adscrush_migrator';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_writer') THEN
    CREATE ROLE app_writer WITH LOGIN PASSWORD 'adscrush_writer';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_reader') THEN
    CREATE ROLE app_reader WITH LOGIN PASSWORD 'adscrush_reader';
  END IF;
END $$;

-- ── Grant app_migrator ────────────────────────────────────────────────────
GRANT ALL ON SCHEMA public TO app_migrator;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_migrator;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_migrator;

-- ── Grant app_writer ──────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO app_writer;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_writer;
GRANT INSERT ON audit_log TO app_writer;
REVOKE INSERT, UPDATE, DELETE ON audit_log FROM app_writer;

-- ── Grant app_reader ──────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO app_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_reader;
