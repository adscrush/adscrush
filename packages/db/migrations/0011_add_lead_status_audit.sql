ALTER TABLE "leads" ADD COLUMN "status_updated_at" timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "status_updated_by" text;