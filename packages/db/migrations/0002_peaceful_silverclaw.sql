ALTER TABLE "clicks" ADD COLUMN "creative_id" text;--> statement-breakpoint
ALTER TABLE "clicks" ADD COLUMN "creative_name" text;--> statement-breakpoint
ALTER TABLE "clicks" ADD COLUMN "creative_thumbnail_url" text;--> statement-breakpoint
ALTER TABLE "conversions" ADD COLUMN "creative_id" text;--> statement-breakpoint
ALTER TABLE "conversions" ADD COLUMN "creative_name" text;--> statement-breakpoint
ALTER TABLE "conversions" ADD COLUMN "creative_thumbnail_url" text;--> statement-breakpoint
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_creative_id_creatives_id_fk" FOREIGN KEY ("creative_id") REFERENCES "public"."creatives"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_creative_id_creatives_id_fk" FOREIGN KEY ("creative_id") REFERENCES "public"."creatives"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clicks_creative_idx" ON "clicks" USING btree ("creative_id");--> statement-breakpoint
CREATE INDEX "conversions_creative_idx" ON "conversions" USING btree ("creative_id");