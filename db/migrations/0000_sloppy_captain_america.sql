CREATE SCHEMA "auth";
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"emoji" text DEFAULT '🛍️' NOT NULL,
	"color" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"notif_enabled" boolean DEFAULT true NOT NULL,
	"notif_frequency" text DEFAULT 'on_schedule' NOT NULL,
	"notif_time" text,
	"notif_weekday" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"collection_id" uuid,
	"title" text NOT NULL,
	"notes" text,
	"price" numeric(10, 2),
	"currency" text DEFAULT '€' NOT NULL,
	"source_url" text,
	"tiktok_url" text,
	"instagram_url" text,
	"image_path" text,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"added_hour" integer NOT NULL,
	"delay_type" text NOT NULL,
	"remind_at" timestamp NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"regret_score" integer DEFAULT 0 NOT NULL,
	"score_factors" jsonb,
	"notif_id" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_prefs" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"global_enabled" boolean DEFAULT true NOT NULL,
	"quiet_hours_start" text DEFAULT '22:00',
	"quiet_hours_end" text DEFAULT '08:00',
	"notify_on_remind" boolean DEFAULT true NOT NULL,
	"notify_digest" boolean DEFAULT false NOT NULL,
	"digest_frequency" text DEFAULT 'weekly',
	"digest_time" text DEFAULT '09:00',
	"digest_weekday" integer DEFAULT 1,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"currency" text DEFAULT '€' NOT NULL,
	"payday_day" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"id" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_prefs" ADD CONSTRAINT "notification_prefs_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;