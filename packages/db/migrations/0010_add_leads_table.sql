CREATE TABLE "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"click_id" text NOT NULL,
	"tid" text NOT NULL,
	"product_id" text NOT NULL,
	"media_buyer_id" text NOT NULL,
	"advertiser_id" text NOT NULL,
	"campaign_id" text,
	"name" text,
	"phone" text,
	"phone_normalized" text,
	"email" text,
	"email_normalized" text,
	"sub1" text,
	"sub2" text,
	"sub3" text,
	"sub4" text,
	"sub5" text,
	"payout" numeric(12, 4) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"method" text DEFAULT 'postback' NOT NULL,
	"referrer_url" text,
	"ip_hash" text,
	"ip_encrypted" text,
	"geo_country" text,
	"user_agent_encrypted" text,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_media_buyer_id_media_buyers_id_fk" FOREIGN KEY ("media_buyer_id") REFERENCES "public"."media_buyers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_advertiser_id_advertisers_id_fk" FOREIGN KEY ("advertiser_id") REFERENCES "public"."advertisers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "leads_click_id_unique" ON "leads" USING btree ("click_id");--> statement-breakpoint
CREATE INDEX "leads_tid_idx" ON "leads" USING btree ("tid");--> statement-breakpoint
CREATE INDEX "leads_product_created_idx" ON "leads" USING btree ("product_id","created_at");--> statement-breakpoint
CREATE INDEX "leads_media_buyer_created_idx" ON "leads" USING btree ("media_buyer_id","created_at");--> statement-breakpoint
CREATE INDEX "leads_advertiser_created_idx" ON "leads" USING btree ("advertiser_id","created_at");--> statement-breakpoint
CREATE INDEX "leads_campaign_idx" ON "leads" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leads_phone_normalized_idx" ON "leads" USING btree ("phone_normalized");--> statement-breakpoint
CREATE INDEX "leads_email_normalized_idx" ON "leads" USING btree ("email_normalized");