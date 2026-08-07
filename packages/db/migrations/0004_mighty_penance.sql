ALTER TABLE "clicks" ADD COLUMN "source_platform" text;--> statement-breakpoint
CREATE INDEX "clicks_source_platform_idx" ON "clicks" USING btree ("source_platform");