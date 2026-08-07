CREATE TABLE "languages" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"deleted_at" timestamp (6) with time zone,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "languages_code_idx" ON "languages" USING btree ("code");
--> statement-breakpoint
-- Seed initial languages
INSERT INTO "languages" ("id", "name", "code", "created_at", "updated_at") VALUES
('lang_01HXYZ000000000000000001', 'English', 'en', NOW(), NOW()),
('lang_01HXYZ000000000000000002', 'Spanish', 'es', NOW(), NOW()),
('lang_01HXYZ000000000000000003', 'French', 'fr', NOW(), NOW()),
('lang_01HXYZ000000000000000004', 'German', 'de', NOW(), NOW()),
('lang_01HXYZ000000000000000005', 'Italian', 'it', NOW(), NOW()),
('lang_01HXYZ000000000000000006', 'Portuguese', 'pt', NOW(), NOW()),
('lang_01HXYZ000000000000000007', 'Japanese', 'ja', NOW(), NOW()),
('lang_01HXYZ000000000000000008', 'Chinese', 'zh', NOW(), NOW()),
('lang_01HXYZ000000000000000009', 'Tamil', 'ta', NOW(), NOW()),
('lang_01HXYZ000000000000000010', 'Marathi', 'mr', NOW(), NOW());