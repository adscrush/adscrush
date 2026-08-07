CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp (6) with time zone,
	"refreshTokenExpiresAt" timestamp (6) with time zone,
	"scope" text,
	"password" text,
	"createdAt" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp (6) with time zone NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	"impersonated_by" text,
	"role" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'user' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"ban_reason" text,
	"ban_expires" timestamp (6) with time zone,
	"createdAt" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp (6) with time zone NOT NULL,
	"createdAt" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"deleted_at" timestamp (6) with time zone,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "departments_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"deleted_at" timestamp (6) with time zone,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "category_metafields" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"options" jsonb,
	"required" boolean DEFAULT false NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_metafield_values" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"metafield_id" text NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_files" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" bigint NOT NULL,
	"width" integer,
	"height" integer,
	"cdn_url" text,
	"storage_path" text NOT NULL,
	"content_hash" text NOT NULL,
	"folder_id" text,
	"uploaded_by" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_folders" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"parent_id" text,
	"depth" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_advertiser_access" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"advertiser_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_media_buyer_access" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"media_buyer_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"department_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"advertiser_access" text DEFAULT 'all' NOT NULL,
	"media_buyer_access" text DEFAULT 'all' NOT NULL,
	"phone_number" text,
	"social_contact" text,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"deleted_at" timestamp (6) with time zone,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advertisers" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"company_name" text,
	"email" text NOT NULL,
	"phone_number" text,
	"website" text,
	"country" text,
	"billing_address" text,
	"payment_terms_days" integer,
	"account_manager_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"internal_notes" text,
	"deleted_at" timestamp (6) with time zone,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "advertisers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "media_buyers" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" text DEFAULT 'external' NOT NULL,
	"employee_id" text,
	"name" text NOT NULL,
	"company_name" text,
	"email" text NOT NULL,
	"phone_number" text,
	"country" text,
	"traffic_sources" text[],
	"payment_method" text,
	"payment_details" text,
	"account_manager_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"internal_notes" text,
	"deleted_at" timestamp (6) with time zone,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_buyers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"advertiser_id" text NOT NULL,
	"category_id" text,
	"name" text NOT NULL,
	"image" text,
	"description" text,
	"private_note" text,
	"status" text DEFAULT 'active' NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"daily_cap" integer,
	"total_cap" integer,
	"quantity" integer DEFAULT 0,
	"price" numeric(12, 4),
	"compare_at_price" numeric(12, 4),
	"cost_per_item" numeric(12, 4),
	"revenue_type" text DEFAULT 'CPA' NOT NULL,
	"default_revenue" numeric(12, 4) DEFAULT '0' NOT NULL,
	"payout_type" text DEFAULT 'CPA' NOT NULL,
	"default_payout" numeric(12, 4) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"deleted_at" timestamp (6) with time zone,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_media" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"media_file_id" text,
	"url" text NOT NULL,
	"type" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_media_buyers" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"media_buyer_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"custom_payout" numeric(12, 4),
	"custom_revenue" numeric(12, 4),
	"approved_at" timestamp (6) with time zone,
	"approved_by" text,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "funnels" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"name" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"domain" text,
	"page_url" text,
	"thank_you_page_url" text,
	"status" text DEFAULT 'active' NOT NULL,
	"deleted_at" timestamp (6) with time zone,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "landing_pages" (
	"id" text PRIMARY KEY NOT NULL,
	"funnel_id" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"weight" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"deleted_at" timestamp (6) with time zone,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clicks" (
	"id" text NOT NULL,
	"tid" uuid NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"product_id" text NOT NULL,
	"media_buyer_id" text NOT NULL,
	"advertiser_id" text NOT NULL,
	"landing_page_id" text,
	"campaign_id" text,
	"funnel_id" text,
	"ad_account_id" text,
	"source" text DEFAULT '' NOT NULL,
	"ip_hash" text,
	"ip_encrypted" text,
	"geo_country" text,
	"geo_city" text,
	"geo_state" text,
	"geo_asn" text,
	"geo_isp" text,
	"user_agent_encrypted" text,
	"device_type" text,
	"os" text,
	"browser" text,
	"referer" text,
	"aff_click_id" text,
	"sub_aff_id" text,
	"aff_sub1" text,
	"aff_sub2" text,
	"aff_sub3" text,
	"aff_sub4" text,
	"aff_sub5" text,
	"aff_sub6" text,
	"aff_sub7" text,
	"aff_sub8" text,
	"aff_sub9" text,
	"aff_sub10" text,
	"is_unique" boolean DEFAULT false NOT NULL,
	"redirect_url" text,
	CONSTRAINT "clicks_id_created_at_pk" PRIMARY KEY("id","created_at"),
	CONSTRAINT "clicks_tid_unique" UNIQUE("tid")
);
--> statement-breakpoint
CREATE TABLE "conversions" (
	"id" text NOT NULL,
	"click_id" text NOT NULL,
	"product_id" text NOT NULL,
	"media_buyer_id" text NOT NULL,
	"advertiser_id" text NOT NULL,
	"campaign_id" text,
	"ad_account_id" text,
	"event" text DEFAULT 'conversion' NOT NULL,
	"payout" numeric(12, 4) DEFAULT '0' NOT NULL,
	"revenue" numeric(12, 4) DEFAULT '0' NOT NULL,
	"sale_amount" numeric(12, 4),
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"is_duplicate" boolean DEFAULT false NOT NULL,
	"ip_encrypted" text,
	"user_agent_encrypted" text,
	"adv_sub1" text,
	"adv_sub2" text,
	"adv_sub3" text,
	"adv_sub4" text,
	"adv_sub5" text,
	"coupon" text,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversions_id_created_at_pk" PRIMARY KEY("id","created_at")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text NOT NULL,
	"actor_user_id" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"request_ip" text,
	"request_id" text,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_log_id_created_at_pk" PRIMARY KEY("id","created_at")
);
--> statement-breakpoint
CREATE TABLE "campaign_ad_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"ad_account_id" text NOT NULL,
	"tracking_link" text NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"product_id" text NOT NULL,
	"funnel_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" timestamp (6) with time zone,
	"end_date" timestamp (6) with time zone,
	"internal_notes" text,
	"deleted_at" timestamp (6) with time zone,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ad_account_spend" (
	"id" text PRIMARY KEY NOT NULL,
	"ad_account_id" text NOT NULL,
	"date" date NOT NULL,
	"spend" numeric(12, 4) NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ad_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"source_platform" text NOT NULL,
	"account_id" text NOT NULL,
	"media_buyer_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"deleted_at" timestamp (6) with time zone,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_creatives" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"creative_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creative_folders" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"parent_id" text,
	"product_id" text NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creative_files" (
	"id" text PRIMARY KEY NOT NULL,
	"creative_id" text NOT NULL,
	"media_file_id" text,
	"file_type" text,
	"cdn_url" text,
	"thumbnail_url" text,
	"file_size" integer,
	"width" integer,
	"height" integer,
	"duration" integer,
	"mime_type" text,
	"original_file_name" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creative_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"creative_id" text NOT NULL,
	"media_buyer_id" text NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creative_performance_tags" (
	"id" text PRIMARY KEY NOT NULL,
	"creative_id" text NOT NULL,
	"media_buyer_id" text NOT NULL,
	"performed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creatives" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"product_id" text NOT NULL,
	"folder_id" text,
	"alt_text" text,
	"tags" text[],
	"status" text DEFAULT 'active' NOT NULL,
	"deleted_at" timestamp (6) with time zone,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "share_links" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"folder_id" text NOT NULL,
	"created_by" text NOT NULL,
	"expires_at" timestamp (6) with time zone,
	"max_downloads" integer,
	"download_count" integer DEFAULT 0 NOT NULL,
	"password_hash" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "share_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "tid_lookup" (
	"id" text PRIMARY KEY NOT NULL,
	"tid" text NOT NULL,
	"click_id" text NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tid_lookup_tid_unique" UNIQUE("tid")
);
--> statement-breakpoint
CREATE TABLE "daily_stats" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"media_buyer_id" text NOT NULL,
	"advertiser_id" text NOT NULL,
	"campaign_id" text,
	"date" text NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"unique_clicks" integer DEFAULT 0 NOT NULL,
	"conversions" integer DEFAULT 0 NOT NULL,
	"pending_conversions" integer DEFAULT 0 NOT NULL,
	"approved_conversions" integer DEFAULT 0 NOT NULL,
	"rejected_conversions" integer DEFAULT 0 NOT NULL,
	"revenue" numeric(12, 4) DEFAULT '0' NOT NULL,
	"payout" numeric(12, 4) DEFAULT '0' NOT NULL,
	"profit" numeric(12, 4) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retention_policies" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"pii_retention_days" integer DEFAULT 90 NOT NULL,
	"row_retention_days" integer DEFAULT 365 NOT NULL,
	"description" text,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "retention_policies_entity_type_unique" UNIQUE("entity_type")
);
--> statement-breakpoint
CREATE TABLE "pii_key_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"key_version" text NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pii_key_versions_key_version_unique" UNIQUE("key_version")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_metafields" ADD CONSTRAINT "category_metafields_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_metafield_values" ADD CONSTRAINT "product_metafield_values_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_metafield_values" ADD CONSTRAINT "product_metafield_values_metafield_id_category_metafields_id_fk" FOREIGN KEY ("metafield_id") REFERENCES "public"."category_metafields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_folder_id_media_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."media_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_folders" ADD CONSTRAINT "media_folders_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_folders" ADD CONSTRAINT "media_folders_parent_id_media_folders_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."media_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_advertiser_access" ADD CONSTRAINT "employee_advertiser_access_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_advertiser_access" ADD CONSTRAINT "employee_advertiser_access_advertiser_id_advertisers_id_fk" FOREIGN KEY ("advertiser_id") REFERENCES "public"."advertisers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_media_buyer_access" ADD CONSTRAINT "employee_media_buyer_access_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_media_buyer_access" ADD CONSTRAINT "employee_media_buyer_access_media_buyer_id_media_buyers_id_fk" FOREIGN KEY ("media_buyer_id") REFERENCES "public"."media_buyers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advertisers" ADD CONSTRAINT "advertisers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advertisers" ADD CONSTRAINT "advertisers_account_manager_id_employees_id_fk" FOREIGN KEY ("account_manager_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_buyers" ADD CONSTRAINT "media_buyers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_buyers" ADD CONSTRAINT "media_buyers_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_buyers" ADD CONSTRAINT "media_buyers_account_manager_id_employees_id_fk" FOREIGN KEY ("account_manager_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_advertiser_id_advertisers_id_fk" FOREIGN KEY ("advertiser_id") REFERENCES "public"."advertisers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_media_file_id_media_files_id_fk" FOREIGN KEY ("media_file_id") REFERENCES "public"."media_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media_buyers" ADD CONSTRAINT "product_media_buyers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media_buyers" ADD CONSTRAINT "product_media_buyers_media_buyer_id_media_buyers_id_fk" FOREIGN KEY ("media_buyer_id") REFERENCES "public"."media_buyers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media_buyers" ADD CONSTRAINT "product_media_buyers_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funnels" ADD CONSTRAINT "funnels_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_funnel_id_funnels_id_fk" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_media_buyer_id_media_buyers_id_fk" FOREIGN KEY ("media_buyer_id") REFERENCES "public"."media_buyers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_advertiser_id_advertisers_id_fk" FOREIGN KEY ("advertiser_id") REFERENCES "public"."advertisers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_landing_page_id_landing_pages_id_fk" FOREIGN KEY ("landing_page_id") REFERENCES "public"."landing_pages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_ad_account_id_ad_accounts_id_fk" FOREIGN KEY ("ad_account_id") REFERENCES "public"."ad_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_media_buyer_id_media_buyers_id_fk" FOREIGN KEY ("media_buyer_id") REFERENCES "public"."media_buyers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_advertiser_id_advertisers_id_fk" FOREIGN KEY ("advertiser_id") REFERENCES "public"."advertisers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_ad_account_id_ad_accounts_id_fk" FOREIGN KEY ("ad_account_id") REFERENCES "public"."ad_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_ad_accounts" ADD CONSTRAINT "campaign_ad_accounts_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_ad_accounts" ADD CONSTRAINT "campaign_ad_accounts_ad_account_id_ad_accounts_id_fk" FOREIGN KEY ("ad_account_id") REFERENCES "public"."ad_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_funnel_id_funnels_id_fk" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_account_spend" ADD CONSTRAINT "ad_account_spend_ad_account_id_ad_accounts_id_fk" FOREIGN KEY ("ad_account_id") REFERENCES "public"."ad_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_accounts" ADD CONSTRAINT "ad_accounts_media_buyer_id_media_buyers_id_fk" FOREIGN KEY ("media_buyer_id") REFERENCES "public"."media_buyers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_creatives" ADD CONSTRAINT "campaign_creatives_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_creatives" ADD CONSTRAINT "campaign_creatives_creative_id_creatives_id_fk" FOREIGN KEY ("creative_id") REFERENCES "public"."creatives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_folders" ADD CONSTRAINT "creative_folders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_folders" ADD CONSTRAINT "creative_folders_parent_id_creative_folders_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."creative_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_files" ADD CONSTRAINT "creative_files_creative_id_creatives_id_fk" FOREIGN KEY ("creative_id") REFERENCES "public"."creatives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_files" ADD CONSTRAINT "creative_files_media_file_id_media_files_id_fk" FOREIGN KEY ("media_file_id") REFERENCES "public"."media_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_notes" ADD CONSTRAINT "creative_notes_creative_id_creatives_id_fk" FOREIGN KEY ("creative_id") REFERENCES "public"."creatives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_notes" ADD CONSTRAINT "creative_notes_media_buyer_id_media_buyers_id_fk" FOREIGN KEY ("media_buyer_id") REFERENCES "public"."media_buyers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_performance_tags" ADD CONSTRAINT "creative_performance_tags_creative_id_creatives_id_fk" FOREIGN KEY ("creative_id") REFERENCES "public"."creatives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_performance_tags" ADD CONSTRAINT "creative_performance_tags_media_buyer_id_media_buyers_id_fk" FOREIGN KEY ("media_buyer_id") REFERENCES "public"."media_buyers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatives" ADD CONSTRAINT "creatives_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatives" ADD CONSTRAINT "creatives_folder_id_creative_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."creative_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_folder_id_creative_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."creative_folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_stats" ADD CONSTRAINT "daily_stats_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_stats" ADD CONSTRAINT "daily_stats_media_buyer_id_media_buyers_id_fk" FOREIGN KEY ("media_buyer_id") REFERENCES "public"."media_buyers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_stats" ADD CONSTRAINT "daily_stats_advertiser_id_advertisers_id_fk" FOREIGN KEY ("advertiser_id") REFERENCES "public"."advertisers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_stats" ADD CONSTRAINT "daily_stats_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "departments_name_idx" ON "departments" USING btree ("name");--> statement-breakpoint
CREATE INDEX "category_metafields_category_id_idx" ON "category_metafields" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "product_metafield_values_product_id_idx" ON "product_metafield_values" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_metafield_values_metafield_id_idx" ON "product_metafield_values" USING btree ("metafield_id");--> statement-breakpoint
CREATE INDEX "media_files_folder_id_idx" ON "media_files" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "media_files_content_hash_idx" ON "media_files" USING btree ("content_hash");--> statement-breakpoint
CREATE INDEX "media_files_mime_type_idx" ON "media_files" USING btree ("mime_type");--> statement-breakpoint
CREATE INDEX "media_files_created_at_idx" ON "media_files" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "media_folders_parent_id_idx" ON "media_folders" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "media_folders_name_parent_idx" ON "media_folders" USING btree ("name","parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "emp_adv_access_idx" ON "employee_advertiser_access" USING btree ("employee_id","advertiser_id");--> statement-breakpoint
CREATE UNIQUE INDEX "emp_mb_access_idx" ON "employee_media_buyer_access" USING btree ("employee_id","media_buyer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "employees_user_id_idx" ON "employees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "employees_status_idx" ON "employees" USING btree ("status");--> statement-breakpoint
CREATE INDEX "employees_department_id_idx" ON "employees" USING btree ("department_id");--> statement-breakpoint
CREATE UNIQUE INDEX "advertisers_user_id_idx" ON "advertisers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "advertisers_status_idx" ON "advertisers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "advertisers_account_manager_id_idx" ON "advertisers" USING btree ("account_manager_id");--> statement-breakpoint
CREATE UNIQUE INDEX "media_buyers_user_id_idx" ON "media_buyers" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "media_buyers_employee_id_idx" ON "media_buyers" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "media_buyers_status_idx" ON "media_buyers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "media_buyers_kind_idx" ON "media_buyers" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "media_buyers_account_manager_id_idx" ON "media_buyers" USING btree ("account_manager_id");--> statement-breakpoint
CREATE INDEX "products_advertiser_id_idx" ON "products" USING btree ("advertiser_id");--> statement-breakpoint
CREATE INDEX "product_media_product_id_idx" ON "product_media" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_media_media_file_id_idx" ON "product_media" USING btree ("media_file_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_media_buyer_idx" ON "product_media_buyers" USING btree ("product_id","media_buyer_id");--> statement-breakpoint
CREATE INDEX "funnels_product_id_idx" ON "funnels" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "funnels_status_idx" ON "funnels" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "funnels_product_language_unique_idx" ON "funnels" USING btree ("product_id","language");--> statement-breakpoint
CREATE INDEX "landing_pages_funnel_id_idx" ON "landing_pages" USING btree ("funnel_id");--> statement-breakpoint
CREATE INDEX "clicks_tid_idx" ON "clicks" USING btree ("tid");--> statement-breakpoint
CREATE INDEX "clicks_dedup_idx" ON "clicks" USING btree ("media_buyer_id","product_id","ip_hash","created_at");--> statement-breakpoint
CREATE INDEX "clicks_product_created_idx" ON "clicks" USING btree ("product_id","created_at");--> statement-breakpoint
CREATE INDEX "clicks_media_buyer_created_idx" ON "clicks" USING btree ("media_buyer_id","created_at");--> statement-breakpoint
CREATE INDEX "clicks_advertiser_created_idx" ON "clicks" USING btree ("advertiser_id","created_at");--> statement-breakpoint
CREATE INDEX "clicks_campaign_idx" ON "clicks" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "clicks_funnel_id_idx" ON "clicks" USING btree ("funnel_id");--> statement-breakpoint
CREATE INDEX "clicks_ad_account_idx" ON "clicks" USING btree ("ad_account_id");--> statement-breakpoint
CREATE INDEX "clicks_source_idx" ON "clicks" USING btree ("source");--> statement-breakpoint
CREATE INDEX "clicks_geo_country_idx" ON "clicks" USING btree ("geo_country");--> statement-breakpoint
CREATE INDEX "clicks_device_type_idx" ON "clicks" USING btree ("device_type");--> statement-breakpoint
CREATE INDEX "clicks_os_idx" ON "clicks" USING btree ("os");--> statement-breakpoint
CREATE INDEX "clicks_id_lookup_idx" ON "clicks" USING btree ("id");--> statement-breakpoint
CREATE INDEX "conversions_click_idx" ON "conversions" USING btree ("click_id","created_at");--> statement-breakpoint
CREATE INDEX "conversions_product_created_idx" ON "conversions" USING btree ("product_id","created_at");--> statement-breakpoint
CREATE INDEX "conversions_media_buyer_created_idx" ON "conversions" USING btree ("media_buyer_id","created_at");--> statement-breakpoint
CREATE INDEX "conversions_advertiser_created_idx" ON "conversions" USING btree ("advertiser_id","created_at");--> statement-breakpoint
CREATE INDEX "conversions_status_idx" ON "conversions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "conversions_campaign_idx" ON "conversions" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "conversions_ad_account_idx" ON "conversions" USING btree ("ad_account_id");--> statement-breakpoint
CREATE INDEX "conversions_id_lookup_idx" ON "conversions" USING btree ("id");--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_log_actor_idx" ON "audit_log" USING btree ("actor_user_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "audit_log" USING btree ("action","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_ad_account_unique_idx" ON "campaign_ad_accounts" USING btree ("campaign_id","ad_account_id");--> statement-breakpoint
CREATE INDEX "campaigns_product_id_idx" ON "campaigns" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "campaigns_funnel_id_idx" ON "campaigns" USING btree ("funnel_id");--> statement-breakpoint
CREATE INDEX "campaigns_status_idx" ON "campaigns" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "ad_account_spend_unique_idx" ON "ad_account_spend" USING btree ("ad_account_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "ad_accounts_platform_account_unique_idx" ON "ad_accounts" USING btree ("source_platform","account_id");--> statement-breakpoint
CREATE INDEX "ad_accounts_status_idx" ON "ad_accounts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ad_accounts_media_buyer_id_idx" ON "ad_accounts" USING btree ("media_buyer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_creatives_campaign_creative_unique_idx" ON "campaign_creatives" USING btree ("campaign_id","creative_id");--> statement-breakpoint
CREATE INDEX "campaign_creatives_campaign_id_idx" ON "campaign_creatives" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_creatives_creative_id_idx" ON "campaign_creatives" USING btree ("creative_id");--> statement-breakpoint
CREATE INDEX "folders_product_id_idx" ON "creative_folders" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "folders_parent_id_idx" ON "creative_folders" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "creative_files_creative_id_idx" ON "creative_files" USING btree ("creative_id");--> statement-breakpoint
CREATE INDEX "creative_files_media_file_id_idx" ON "creative_files" USING btree ("media_file_id");--> statement-breakpoint
CREATE INDEX "creative_notes_creative_id_idx" ON "creative_notes" USING btree ("creative_id");--> statement-breakpoint
CREATE INDEX "creative_notes_media_buyer_id_idx" ON "creative_notes" USING btree ("media_buyer_id");--> statement-breakpoint
CREATE INDEX "creative_performance_tags_creative_id_idx" ON "creative_performance_tags" USING btree ("creative_id");--> statement-breakpoint
CREATE INDEX "creative_performance_tags_media_buyer_id_idx" ON "creative_performance_tags" USING btree ("media_buyer_id");--> statement-breakpoint
CREATE INDEX "creatives_product_id_idx" ON "creatives" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "creatives_folder_id_idx" ON "creatives" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "creatives_status_idx" ON "creatives" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "tid_lookup_tid_idx" ON "tid_lookup" USING btree ("tid");--> statement-breakpoint
CREATE INDEX "tid_lookup_click_id_idx" ON "tid_lookup" USING btree ("click_id");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_stats_unique_idx" ON "daily_stats" USING btree ("product_id","media_buyer_id","advertiser_id","campaign_id","date");--> statement-breakpoint
CREATE INDEX "daily_stats_product_date_idx" ON "daily_stats" USING btree ("product_id","date");--> statement-breakpoint
CREATE INDEX "daily_stats_media_buyer_date_idx" ON "daily_stats" USING btree ("media_buyer_id","date");--> statement-breakpoint
CREATE INDEX "daily_stats_advertiser_date_idx" ON "daily_stats" USING btree ("advertiser_id","date");--> statement-breakpoint
CREATE INDEX "daily_stats_campaign_date_idx" ON "daily_stats" USING btree ("campaign_id","date");