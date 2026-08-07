# Adscrush Database Operations Guide

## Backup & Recovery

### Strategy Summary

| Layer | Tool | Schedule | Retention | RPO | RTO |
|---|---|---|---|---|---|
| Physical (PITR) | `pgBackRest` | Daily full + continuous WAL | 7 days rolling | WAL-second | < 1 hour |
| Logical (dump) | `pg_dump` | Daily | 30 days | 24h | < 10 min (schema) |
| Partition archive | Object storage | On partition rotation | 12 months | — | Hours (cold restore) |
| Configuration | Git (migrations) | Every migration | Git history | — | < 5 min |

### Physical Backup (pgBackRest)

Config location: `docker-compose.yml` → `pgbackrest` sidecar service.

```bash
# Manual backup
pnpm db:backup

# Restore to point-in-time (dry run)
pnpm db:restore:verify --time "2026-06-20 14:30:00 UTC"

# Full restore into throwaway DB
pnpm db:restore:verify --target-db adscrush_restore_test
```

### Logical Dump

```bash
pg_dump -U adscrush -h localhost -d adscrush \
  --exclude-table-data='clicks_*' \
  --exclude-table-data='conversions_*' \
  --exclude-table-data='audit_log_*' \
  > /tmp/adscrush_schema_$(date +%Y%m%d).sql
```

Event tables are excluded from logical dumps — they are restored via periodic partition archiving.

### Partition Archiving

After a monthly partition is detached (age > 13 months):

```bash
# Archive to Bunny Storage
pg_dump -U app_writer -d adscrush -t clicks_2025_05 \
  | gzip \
  | mc pipe myminio/adscrush-archive/clicks_2025_05.sql.gz

# Drop detached partition
DROP TABLE IF EXISTS clicks_2025_05;
```

### Restore Drill (Quarterly)

1. Spin up throwaway Postgres container
2. Run `pgBackRest restore` to latest available point
3. Apply all migrations from `packages/db/migrations/` — this includes the **hand-written** files that are not in the Drizzle journal (`0003_add_enhanced_device_tracking.sql`, `0008_cleanup_orphaned_media_buyer_users.sql`, `0009_add_media_buyer_permissions.sql`, `0014_add_pg_trgm_search_indexes.sql`); they are idempotent and applied via `psql "$DATABASE_URL" -f <file>`.
4. Run `pnpm db:postinit` (extensions incl. `pg_trgm`, partitions, roles, RLS) — run before step 3 if applying `0014` fresh, since its GIN trigram indexes require the `pg_trgm` extension to exist.
5. Verify row counts on key tables vs production
6. Document any discrepancies

---

## Monitoring & Alerting

### Critical Alerts

| Metric | Threshold | Action |
|---|---|---|
| Connection pool saturation | PgBouncer pool > 80% | Add pool size, check for unclosed connections |
| Slow queries (p95) | > 500ms on event tables | Capture via `pg_stat_statements`, add/optimize index |
| Disk usage | > 75% of volume | Extend volume or archive old partitions |
| Replication lag (future) | > 10 seconds | Check WAL shipping, network |
| Autovacuum behind | `n_dead_tup > 0.2 * n_live_tup` on any event partition | Manual `VACUUM` or increase autovacuum workers |
| Failed partition creation | Next month's partition missing 48h before cutoff | Manual `pnpm db:partition:manage` |

### Observability Queries

```sql
-- Check partition coverage
SELECT
    parent.relname AS parent,
    child.relname AS child,
    pg_get_expr(child.relpartbound, child.oid) AS bound
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
JOIN pg_class child  ON pg_inherits.inhrelid  = child.oid
ORDER BY parent.relname, child.relname;

-- Index usage
SELECT
    schemaname, tablename, indexname,
    idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC
LIMIT 20;

-- Autovacuum activity
SELECT
    relname, n_dead_tup, n_live_tup,
    round(100.0 * n_dead_tup / NULLIF(n_live_tup, 0), 2) AS dead_pct,
    last_vacuum, last_autovacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 0
ORDER BY dead_pct DESC;
```

---

## Maintenance Schedule

### Daily
- `daily_stats` rollup refresh (scheduled worker, runs at 00:15 UTC)
- PII scrub: `pnpm db:purge:pii` (null encrypted IP/UA past TTL per `retention_policies`)
- Monitor `pg_stat_activity` for long-running queries

### Weekly
- `ANALYZE` on `daily_stats` and small tables (stats freshness)
- Review slow query log from `pg_stat_statements`
- Check partition creation: next month's partitions exist

### Monthly
- `REINDEX CONCURRENTLY` on event table indexes if bloat > 30%
- `pgBackRest` full backup (in addition to daily WAL archiving)
- Restore drill against throwaway DB
- Review `pg_stat_user_indexes` — drop unused indexes

### Quarterly
- Full disaster recovery drill (restore from scratch)
- Key rotation: generate new PII encryption key, re-encrypt active PII
- Review `retention_policies` TTLs for regulatory compliance

### Annually
- Major PG version upgrade assessment
- Capacity planning (storage, connections, partition growth)

---

## Proactive Troubleshooting

### Common Issues & Resolutions

| Symptom | Likely Cause | Check | Resolution |
|---|---|---|---|
| Conversion dedup slow | Missing `is_duplicate` partial index | `EXPLAIN ANALYZE` on dedup query | Create partial index (see INDEXING.md) |
| Dashboard reports slow | Full scan of event table instead of `daily_stats` | Check query plan — is `daily_stats` being used? | Verify rollup worker ran; add missing combos to `daily_stats` rollup |
| Connection exhaustion | PgBouncer pool max too low for burst traffic | `SHOW POOLS` in PgBouncer admin | Increase pool size, add app-side connection retry with backoff |
| Disk filling fast | Large transaction that didn't partition prune | Check `pg_stat_user_tables.n_dead_tup`, partition sizes | `VACUUM` the affected partition, verify WHERE clause includes `created_at` |
| RLS policy violation | App forgot to set `app.tenant_scope` session var | Check app logs for `ERROR: column "media_buyer_id" does not exist` | Ensure `SELECT set_config('app.tenant_scope', $1, true)` runs before every DB query |
| Backup stuck | WAL accumulation during peak traffic | `pg_stat_archiver` | Increase `max_wal_senders`, verify archive command |

### Runbook: Partition Miss (next month's partition doesn't exist)

```sql
-- 1. Check what's missing
SELECT to_char(now() + interval '1 month', 'YYYY_MM');

-- 2. Create manually
CREATE TABLE clicks_2026_07 PARTITION OF clicks
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

-- 3. Verify
\d+ clicks;

-- 4. Fix automation
-- Check pg_partman config or cron job
```

### Runbook: PII Key Rotation

```bash
# 1. Generate new key
openssl enc -aes-256-gcm -k "$(openssl rand -hex 32)" -P -md sha256

# 2. Add to .env as PII_MASTER_KEY (keep old key in secure backup)

# 3. Run re-encrypt
pnpm db:purge:pii --re-encrypt

# 4. Record in pii_key_versions
INSERT INTO pii_key_versions (key_version, active) VALUES ('v2', true);
UPDATE pii_key_versions SET active = false, retired_at = now() WHERE key_version = 'v1';
```

---

## Runbook: Greenfield Reset (first-time setup or full rebuild)

```bash
# 1. Start services
pnpm docker:up

# 2. Drop existing schema (if rebuilding)
#    psql -U adscrush -d adscrush -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# 3. Remove old migrations (if any)
rm -rf packages/db/migrations/

# 4. Generate fresh baseline
pnpm db:generate

# 5. Apply migration
pnpm db:migrate

# 6. Apply extensions, partitions, roles, RLS
pnpm db:postinit

# 7. Seed
pnpm db:seed

# 8. Verify
pnpm db:studio
```
