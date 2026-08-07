ALTER TABLE "clicks" ADD COLUMN "device_vendor" text;--> statement-breakpoint
ALTER TABLE "clicks" ADD COLUMN "device_model" text;--> statement-breakpoint
ALTER TABLE "clicks" ADD COLUMN "os_version" text;--> statement-breakpoint
ALTER TABLE "clicks" ADD COLUMN "browser_version" text;--> statement-breakpoint
CREATE INDEX "clicks_device_vendor_idx" ON "clicks" USING btree ("device_vendor");