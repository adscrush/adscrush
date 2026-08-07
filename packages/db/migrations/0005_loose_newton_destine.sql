ALTER TABLE "clicks" ADD COLUMN "utm_source" text;--> statement-breakpoint
ALTER TABLE "clicks" ADD COLUMN "utm_medium" text;--> statement-breakpoint
ALTER TABLE "clicks" ADD COLUMN "utm_campaign" text;--> statement-breakpoint
ALTER TABLE "clicks" ADD COLUMN "utm_term" text;--> statement-breakpoint
ALTER TABLE "clicks" ADD COLUMN "utm_content" text;--> statement-breakpoint
CREATE INDEX "clicks_utm_source_idx" ON "clicks" USING btree ("utm_source");--> statement-breakpoint
CREATE INDEX "clicks_utm_campaign_idx" ON "clicks" USING btree ("utm_campaign");