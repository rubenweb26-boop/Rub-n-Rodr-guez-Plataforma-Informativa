CREATE TABLE `ad_campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`advertiser_id` text NOT NULL,
	`advertisement_id` text NOT NULL,
	`billing_model` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`amount_minor` integer,
	`currency` text,
	`payment_transaction_id` text,
	`starts_at` integer,
	`ends_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`advertiser_id`) REFERENCES `advertisers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`advertisement_id`) REFERENCES `advertisements`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`payment_transaction_id`) REFERENCES `payment_transactions`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "ad_campaigns_billing_model_check" CHECK("ad_campaigns"."billing_model" in ('fixed', 'monthly', 'verified_commission')),
	CONSTRAINT "ad_campaigns_status_check" CHECK("ad_campaigns"."status" in ('draft', 'pending_payment', 'active', 'paused', 'ended')),
	CONSTRAINT "ad_campaigns_currency_check" CHECK("ad_campaigns"."currency" is null or "ad_campaigns"."currency" in ('USD', 'CRC')),
	CONSTRAINT "ad_campaigns_amount_check" CHECK("ad_campaigns"."amount_minor" is null or "ad_campaigns"."amount_minor" > 0),
	CONSTRAINT "ad_campaigns_amount_currency_check" CHECK(("ad_campaigns"."amount_minor" is null and "ad_campaigns"."currency" is null) or ("ad_campaigns"."amount_minor" is not null and "ad_campaigns"."currency" is not null))
);
--> statement-breakpoint
CREATE INDEX `ad_campaigns_advertiser_status_idx` ON `ad_campaigns` (`advertiser_id`,`status`);--> statement-breakpoint
CREATE INDEX `ad_campaigns_schedule_idx` ON `ad_campaigns` (`status`,`starts_at`,`ends_at`);--> statement-breakpoint
CREATE TABLE `ad_click_events` (
	`id` text PRIMARY KEY NOT NULL,
	`advertisement_id` text NOT NULL,
	`campaign_id` text,
	`viewer_profile_id` text,
	`destination_type` text NOT NULL,
	`session_hash` text,
	`referrer_path` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`advertisement_id`) REFERENCES `advertisements`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`campaign_id`) REFERENCES `ad_campaigns`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`viewer_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "ad_click_events_destination_type_check" CHECK("ad_click_events"."destination_type" in ('website', 'whatsapp'))
);
--> statement-breakpoint
CREATE INDEX `ad_click_events_ad_created_idx` ON `ad_click_events` (`advertisement_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `ad_click_events_campaign_created_idx` ON `ad_click_events` (`campaign_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `advertisement_media` (
	`id` text PRIMARY KEY NOT NULL,
	`advertisement_id` text NOT NULL,
	`r2_object_key` text NOT NULL,
	`alt_text` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`advertisement_id`) REFERENCES `advertisements`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `advertisement_media_r2_key_unique` ON `advertisement_media` (`r2_object_key`);--> statement-breakpoint
CREATE INDEX `advertisement_media_order_idx` ON `advertisement_media` (`advertisement_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `advertisements` (
	`id` text PRIMARY KEY NOT NULL,
	`advertiser_id` text NOT NULL,
	`slug` text NOT NULL,
	`type` text NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`price_minor` integer,
	`currency` text,
	`location` text,
	`external_url` text,
	`whatsapp_number` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`is_sponsored` integer DEFAULT true NOT NULL,
	`reviewed_by_profile_id` text,
	`reviewed_at` integer,
	`moderation_note` text,
	`starts_at` integer,
	`ends_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`advertiser_id`) REFERENCES `advertisers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewed_by_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "advertisements_type_check" CHECK("advertisements"."type" in ('product', 'service')),
	CONSTRAINT "advertisements_status_check" CHECK("advertisements"."status" in ('pending', 'approved', 'rejected', 'suspended', 'expired')),
	CONSTRAINT "advertisements_currency_check" CHECK("advertisements"."currency" is null or "advertisements"."currency" in ('USD', 'CRC')),
	CONSTRAINT "advertisements_price_check" CHECK("advertisements"."price_minor" is null or "advertisements"."price_minor" >= 0),
	CONSTRAINT "advertisements_price_currency_check" CHECK(("advertisements"."price_minor" is null and "advertisements"."currency" is null) or ("advertisements"."price_minor" is not null and "advertisements"."currency" is not null))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `advertisements_slug_unique` ON `advertisements` (`slug`);--> statement-breakpoint
CREATE INDEX `advertisements_advertiser_idx` ON `advertisements` (`advertiser_id`,`status`);--> statement-breakpoint
CREATE INDEX `advertisements_catalog_idx` ON `advertisements` (`status`,`category`,`created_at`);--> statement-breakpoint
CREATE TABLE `advertisers` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_profile_id` text NOT NULL,
	`slug` text NOT NULL,
	`business_name` text NOT NULL,
	`description` text,
	`website_url` text,
	`whatsapp_number` text,
	`logo_r2_object_key` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewed_by_profile_id` text,
	`reviewed_at` integer,
	`moderation_note` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`owner_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`reviewed_by_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "advertisers_status_check" CHECK("advertisers"."status" in ('pending', 'approved', 'rejected', 'suspended', 'expired'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `advertisers_slug_unique` ON `advertisers` (`slug`);--> statement-breakpoint
CREATE INDEX `advertisers_owner_idx` ON `advertisers` (`owner_profile_id`);--> statement-breakpoint
CREATE INDEX `advertisers_status_idx` ON `advertisers` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_profile_id` text,
	`action` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text,
	`target_profile_id` text,
	`request_id` text,
	`ip_hash` text,
	`user_agent_hash` text,
	`outcome` text NOT NULL,
	`metadata_json` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`actor_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`target_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "audit_logs_outcome_check" CHECK("audit_logs"."outcome" in ('success', 'denied', 'failure'))
);
--> statement-breakpoint
CREATE INDEX `audit_logs_actor_created_idx` ON `audit_logs` (`actor_profile_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_logs_resource_idx` ON `audit_logs` (`resource_type`,`resource_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_logs_request_idx` ON `audit_logs` (`request_id`);--> statement-breakpoint
CREATE TABLE `cantons` (
	`code` text PRIMARY KEY NOT NULL,
	`province_code` text NOT NULL,
	`name` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`province_code`) REFERENCES `provinces`(`code`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `cantons_province_idx` ON `cantons` (`province_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `cantons_province_name_unique` ON `cantons` (`province_code`,`name`);--> statement-breakpoint
CREATE TABLE `complaint_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `complaint_categories_code_unique` ON `complaint_categories` (`code`);--> statement-breakpoint
CREATE TABLE `complaint_contacts` (
	`complaint_id` text PRIMARY KEY NOT NULL,
	`encrypted_payload` text NOT NULL,
	`encryption_key_version` text NOT NULL,
	`contact_fingerprint` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `complaint_contacts_fingerprint_idx` ON `complaint_contacts` (`contact_fingerprint`);--> statement-breakpoint
CREATE TABLE `complaint_evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`complaint_id` text NOT NULL,
	`uploaded_by_profile_id` text NOT NULL,
	`r2_object_key` text NOT NULL,
	`original_filename` text NOT NULL,
	`safe_filename` text NOT NULL,
	`detected_mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`sha256` text NOT NULL,
	`scan_status` text DEFAULT 'pending' NOT NULL,
	`is_sensitive` integer DEFAULT true NOT NULL,
	`removed_at` integer,
	`removed_by_profile_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`removed_by_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "complaint_evidence_size_check" CHECK("complaint_evidence"."size_bytes" > 0),
	CONSTRAINT "complaint_evidence_scan_status_check" CHECK("complaint_evidence"."scan_status" in ('pending', 'clean', 'quarantined', 'rejected'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `complaint_evidence_r2_key_unique` ON `complaint_evidence` (`r2_object_key`);--> statement-breakpoint
CREATE INDEX `complaint_evidence_complaint_idx` ON `complaint_evidence` (`complaint_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `complaint_evidence_scan_status_idx` ON `complaint_evidence` (`scan_status`);--> statement-breakpoint
CREATE TABLE `complaint_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`complaint_id` text NOT NULL,
	`from_status` text,
	`to_status` text NOT NULL,
	`changed_by_profile_id` text,
	`internal_note` text,
	`user_visible_note` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`changed_by_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "complaint_status_history_to_status_check" CHECK("complaint_status_history"."to_status" in ('received', 'in_review', 'additional_information_requested', 'investigating', 'closed', 'rejected')),
	CONSTRAINT "complaint_status_history_from_status_check" CHECK("complaint_status_history"."from_status" is null or "complaint_status_history"."from_status" in ('received', 'in_review', 'additional_information_requested', 'investigating', 'closed', 'rejected'))
);
--> statement-breakpoint
CREATE INDEX `complaint_status_history_complaint_idx` ON `complaint_status_history` (`complaint_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `complaints` (
	`id` text PRIMARY KEY NOT NULL,
	`tracking_code` text NOT NULL,
	`owner_profile_id` text NOT NULL,
	`category_id` text NOT NULL,
	`province_code` text NOT NULL,
	`canton_code` text NOT NULL,
	`district_code` text NOT NULL,
	`locality` text,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`occurred_on` text,
	`approximate_location` text,
	`status` text DEFAULT 'received' NOT NULL,
	`assigned_to_profile_id` text,
	`truth_declaration_accepted` integer DEFAULT false NOT NULL,
	`privacy_consent_accepted` integer DEFAULT false NOT NULL,
	`urgent_channel_notice_accepted` integer DEFAULT false NOT NULL,
	`publication_authorized` integer DEFAULT false NOT NULL,
	`resolution_summary` text,
	`closed_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`owner_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`category_id`) REFERENCES `complaint_categories`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`province_code`) REFERENCES `provinces`(`code`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`canton_code`) REFERENCES `cantons`(`code`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`district_code`) REFERENCES `districts`(`code`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`assigned_to_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "complaints_status_check" CHECK("complaints"."status" in ('received', 'in_review', 'additional_information_requested', 'investigating', 'closed', 'rejected'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `complaints_tracking_code_unique` ON `complaints` (`tracking_code`);--> statement-breakpoint
CREATE INDEX `complaints_owner_created_idx` ON `complaints` (`owner_profile_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `complaints_status_location_idx` ON `complaints` (`status`,`province_code`,`canton_code`);--> statement-breakpoint
CREATE INDEX `complaints_category_status_idx` ON `complaints` (`category_id`,`status`);--> statement-breakpoint
CREATE INDEX `complaints_assignee_status_idx` ON `complaints` (`assigned_to_profile_id`,`status`);--> statement-breakpoint
CREATE TABLE `content_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_categories_slug_unique` ON `content_categories` (`slug`);--> statement-breakpoint
CREATE TABLE `content_items` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text,
	`author_profile_id` text,
	`kind` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`excerpt` text,
	`body` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`access_level` text DEFAULT 'public' NOT NULL,
	`cover_r2_object_key` text,
	`cover_alt_text` text,
	`seo_title` text,
	`seo_description` text,
	`is_featured` integer DEFAULT false NOT NULL,
	`scheduled_for` integer,
	`published_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `content_categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`author_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "content_items_kind_check" CHECK("content_items"."kind" in ('news', 'investigation', 'video', 'resource')),
	CONSTRAINT "content_items_status_check" CHECK("content_items"."status" in ('draft', 'scheduled', 'published', 'archived')),
	CONSTRAINT "content_items_access_level_check" CHECK("content_items"."access_level" in ('public', 'preview', 'premium'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_items_slug_unique` ON `content_items` (`slug`);--> statement-breakpoint
CREATE INDEX `content_items_publication_idx` ON `content_items` (`status`,`access_level`,`published_at`);--> statement-breakpoint
CREATE INDEX `content_items_category_idx` ON `content_items` (`category_id`,`status`);--> statement-breakpoint
CREATE INDEX `content_items_featured_idx` ON `content_items` (`is_featured`,`published_at`);--> statement-breakpoint
CREATE TABLE `districts` (
	`code` text PRIMARY KEY NOT NULL,
	`canton_code` text NOT NULL,
	`name` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`canton_code`) REFERENCES `cantons`(`code`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `districts_canton_idx` ON `districts` (`canton_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `districts_canton_name_unique` ON `districts` (`canton_code`,`name`);--> statement-breakpoint
CREATE TABLE `payment_provider_events` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`provider_event_id` text NOT NULL,
	`event_type` text NOT NULL,
	`payload_hash` text NOT NULL,
	`signature_verified` integer DEFAULT false NOT NULL,
	`processing_status` text DEFAULT 'received' NOT NULL,
	`transaction_id` text,
	`subscription_id` text,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`provider_occurred_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`processed_at` integer,
	FOREIGN KEY (`transaction_id`) REFERENCES `payment_transactions`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "payment_provider_events_status_check" CHECK("payment_provider_events"."processing_status" in ('received', 'processed', 'ignored', 'failed')),
	CONSTRAINT "payment_provider_events_attempts_check" CHECK("payment_provider_events"."attempt_count" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_provider_events_provider_event_unique` ON `payment_provider_events` (`provider`,`provider_event_id`);--> statement-breakpoint
CREATE INDEX `payment_provider_events_status_idx` ON `payment_provider_events` (`processing_status`,`created_at`);--> statement-breakpoint
CREATE TABLE `payment_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`subscription_id` text,
	`plan_price_id` text,
	`provider` text NOT NULL,
	`provider_transaction_id` text,
	`idempotency_key` text NOT NULL,
	`kind` text DEFAULT 'charge' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`amount_minor` integer NOT NULL,
	`currency` text NOT NULL,
	`provider_status` text,
	`failure_code` text,
	`failure_message` text,
	`metadata_json` text,
	`approved_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`plan_price_id`) REFERENCES `plan_prices`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "payment_transactions_kind_check" CHECK("payment_transactions"."kind" in ('charge', 'refund', 'chargeback', 'adjustment')),
	CONSTRAINT "payment_transactions_status_check" CHECK("payment_transactions"."status" in ('pending', 'approved', 'failed', 'refunded', 'partially_refunded', 'charged_back', 'canceled')),
	CONSTRAINT "payment_transactions_currency_check" CHECK("payment_transactions"."currency" in ('USD', 'CRC')),
	CONSTRAINT "payment_transactions_amount_check" CHECK("payment_transactions"."amount_minor" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_transactions_idempotency_unique` ON `payment_transactions` (`idempotency_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `payment_transactions_provider_reference_unique` ON `payment_transactions` (`provider`,`provider_transaction_id`);--> statement-breakpoint
CREATE INDEX `payment_transactions_profile_created_idx` ON `payment_transactions` (`profile_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `payment_transactions_subscription_idx` ON `payment_transactions` (`subscription_id`);--> statement-breakpoint
CREATE TABLE `plan_prices` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`currency` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`billing_interval` text NOT NULL,
	`provider` text DEFAULT 'manual' NOT NULL,
	`provider_price_id` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "plan_prices_currency_check" CHECK("plan_prices"."currency" in ('USD', 'CRC')),
	CONSTRAINT "plan_prices_amount_check" CHECK("plan_prices"."amount_minor" > 0),
	CONSTRAINT "plan_prices_interval_check" CHECK("plan_prices"."billing_interval" in ('month', 'one_time'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plan_prices_identity_unique` ON `plan_prices` (`plan_id`,`currency`,`billing_interval`,`provider`);--> statement-breakpoint
CREATE UNIQUE INDEX `plan_prices_provider_price_unique` ON `plan_prices` (`provider`,`provider_price_id`);--> statement-breakpoint
CREATE INDEX `plan_prices_active_idx` ON `plan_prices` (`plan_id`,`is_active`);--> statement-breakpoint
CREATE TABLE `plans` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`tier` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "plans_tier_check" CHECK("plans"."tier" in ('free', 'premium', 'advertiser'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plans_code_unique` ON `plans` (`code`);--> statement-breakpoint
CREATE TABLE `profile_roles` (
	`profile_id` text NOT NULL,
	`role_id` text NOT NULL,
	`granted_by_profile_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`profile_id`, `role_id`),
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`granted_by_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `profile_roles_role_idx` ON `profile_roles` (`role_id`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`auth_user_id` text NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`locale` text DEFAULT 'es-CR' NOT NULL,
	`last_seen_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "profiles_status_check" CHECK("profiles"."status" in ('active', 'suspended', 'deleted'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_auth_user_id_unique` ON `profiles` (`auth_user_id`);--> statement-breakpoint
CREATE INDEX `profiles_email_idx` ON `profiles` (`email`);--> statement-breakpoint
CREATE TABLE `provinces` (
	`code` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_system` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_key_unique` ON `roles` (`key`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`plan_id` text NOT NULL,
	`plan_price_id` text,
	`provider` text DEFAULT 'manual' NOT NULL,
	`provider_customer_id` text,
	`provider_subscription_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`current_period_start` integer,
	`current_period_end` integer,
	`access_until` integer,
	`cancel_at_period_end` integer DEFAULT false NOT NULL,
	`canceled_at` integer,
	`ended_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`plan_price_id`) REFERENCES `plan_prices`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "subscriptions_status_check" CHECK("subscriptions"."status" in ('pending', 'active', 'past_due', 'canceled', 'expired', 'suspended'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_provider_reference_unique` ON `subscriptions` (`provider`,`provider_subscription_id`);--> statement-breakpoint
CREATE INDEX `subscriptions_profile_status_idx` ON `subscriptions` (`profile_id`,`status`);--> statement-breakpoint
CREATE INDEX `subscriptions_access_until_idx` ON `subscriptions` (`access_until`);--> statement-breakpoint
CREATE TABLE `video_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`content_item_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_asset_id` text NOT NULL,
	`trailer_provider_asset_id` text,
	`duration_seconds` integer,
	`processing_status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`content_item_id`) REFERENCES `content_items`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "video_assets_processing_status_check" CHECK("video_assets"."processing_status" in ('pending', 'ready', 'failed')),
	CONSTRAINT "video_assets_duration_check" CHECK("video_assets"."duration_seconds" is null or "video_assets"."duration_seconds" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `video_assets_content_item_unique` ON `video_assets` (`content_item_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `video_assets_provider_asset_unique` ON `video_assets` (`provider`,`provider_asset_id`);