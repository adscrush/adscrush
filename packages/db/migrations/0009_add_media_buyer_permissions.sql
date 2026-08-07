-- Add permissions column to media_buyers for per-buyer permission overrides
ALTER TABLE "media_buyers" ADD COLUMN IF NOT EXISTS "permissions" jsonb NOT NULL DEFAULT '[]'::jsonb;
