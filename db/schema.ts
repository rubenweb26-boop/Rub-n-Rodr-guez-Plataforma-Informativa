import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);

const updatedAt = () =>
  integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);

export type ProfileStatus = "active" | "suspended" | "deleted";
export type Currency = "USD" | "CRC";
export type BillingInterval = "month" | "one_time";
export type SubscriptionStatus =
  | "pending"
  | "active"
  | "past_due"
  | "canceled"
  | "expired"
  | "suspended";
export type PaymentStatus =
  | "pending"
  | "approved"
  | "failed"
  | "refunded"
  | "partially_refunded"
  | "charged_back"
  | "canceled";
export type ComplaintStatus =
  | "received"
  | "in_review"
  | "additional_information_requested"
  | "investigating"
  | "closed"
  | "rejected";
export type PublicationStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "archived";
export type AccessLevel = "public" | "preview" | "premium";
export type ModerationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended"
  | "expired";

/**
 * The Sites identity is stored as authUserId. Internal records use id so the
 * authentication provider can be changed without rewriting business data.
 */
export const profiles = sqliteTable(
  "profiles",
  {
    id: text("id").primaryKey(),
    authUserId: text("auth_user_id").notNull(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    status: text("status").$type<ProfileStatus>().notNull().default("active"),
    locale: text("locale").notNull().default("es-CR"),
    lastSeenAt: integer("last_seen_at", { mode: "timestamp" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("profiles_auth_user_id_unique").on(table.authUserId),
    index("profiles_email_idx").on(table.email),
    check(
      "profiles_status_check",
      sql`${table.status} in ('active', 'suspended', 'deleted')`,
    ),
  ],
);

export const roles = sqliteTable(
  "roles",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    isSystem: integer("is_system", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: createdAt(),
  },
  (table) => [uniqueIndex("roles_key_unique").on(table.key)],
);

export const profileRoles = sqliteTable(
  "profile_roles",
  {
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    grantedByProfileId: text("granted_by_profile_id").references(
      () => profiles.id,
      { onDelete: "set null" },
    ),
    grantedAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.profileId, table.roleId] }),
    index("profile_roles_role_idx").on(table.roleId),
  ],
);

export const plans = sqliteTable(
  "plans",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    tier: text("tier")
      .$type<"free" | "premium" | "advertiser">()
      .notNull(),
    isActive: integer("is_active", { mode: "boolean" })
      .notNull()
      .default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("plans_code_unique").on(table.code),
    check(
      "plans_tier_check",
      sql`${table.tier} in ('free', 'premium', 'advertiser')`,
    ),
  ],
);

/** Amounts are always stored in the currency's minor unit. */
export const planPrices = sqliteTable(
  "plan_prices",
  {
    id: text("id").primaryKey(),
    planId: text("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    currency: text("currency").$type<Currency>().notNull(),
    amountMinor: integer("amount_minor").notNull(),
    billingInterval: text("billing_interval")
      .$type<BillingInterval>()
      .notNull(),
    provider: text("provider").notNull().default("manual"),
    providerPriceId: text("provider_price_id"),
    isActive: integer("is_active", { mode: "boolean" })
      .notNull()
      .default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("plan_prices_identity_unique").on(
      table.planId,
      table.currency,
      table.billingInterval,
      table.provider,
    ),
    uniqueIndex("plan_prices_provider_price_unique").on(
      table.provider,
      table.providerPriceId,
    ),
    index("plan_prices_active_idx").on(table.planId, table.isActive),
    check(
      "plan_prices_currency_check",
      sql`${table.currency} in ('USD', 'CRC')`,
    ),
    check("plan_prices_amount_check", sql`${table.amountMinor} > 0`),
    check(
      "plan_prices_interval_check",
      sql`${table.billingInterval} in ('month', 'one_time')`,
    ),
  ],
);

export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    planId: text("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "restrict" }),
    planPriceId: text("plan_price_id").references(() => planPrices.id, {
      onDelete: "set null",
    }),
    provider: text("provider").notNull().default("manual"),
    providerCustomerId: text("provider_customer_id"),
    providerSubscriptionId: text("provider_subscription_id"),
    status: text("status")
      .$type<SubscriptionStatus>()
      .notNull()
      .default("pending"),
    currentPeriodStart: integer("current_period_start", { mode: "timestamp" }),
    currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }),
    accessUntil: integer("access_until", { mode: "timestamp" }),
    cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" })
      .notNull()
      .default(false),
    canceledAt: integer("canceled_at", { mode: "timestamp" }),
    endedAt: integer("ended_at", { mode: "timestamp" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("subscriptions_provider_reference_unique").on(
      table.provider,
      table.providerSubscriptionId,
    ),
    index("subscriptions_profile_status_idx").on(
      table.profileId,
      table.status,
    ),
    index("subscriptions_access_until_idx").on(table.accessUntil),
    check(
      "subscriptions_status_check",
      sql`${table.status} in ('pending', 'active', 'past_due', 'canceled', 'expired', 'suspended')`,
    ),
  ],
);

export const paymentTransactions = sqliteTable(
  "payment_transactions",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    subscriptionId: text("subscription_id").references(
      () => subscriptions.id,
      { onDelete: "set null" },
    ),
    planPriceId: text("plan_price_id").references(() => planPrices.id, {
      onDelete: "set null",
    }),
    provider: text("provider").notNull(),
    providerTransactionId: text("provider_transaction_id"),
    idempotencyKey: text("idempotency_key").notNull(),
    kind: text("kind")
      .$type<"charge" | "refund" | "chargeback" | "adjustment">()
      .notNull()
      .default("charge"),
    status: text("status").$type<PaymentStatus>().notNull().default("pending"),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").$type<Currency>().notNull(),
    providerStatus: text("provider_status"),
    failureCode: text("failure_code"),
    failureMessage: text("failure_message"),
    metadataJson: text("metadata_json"),
    approvedAt: integer("approved_at", { mode: "timestamp" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("payment_transactions_idempotency_unique").on(
      table.idempotencyKey,
    ),
    uniqueIndex("payment_transactions_provider_reference_unique").on(
      table.provider,
      table.providerTransactionId,
    ),
    index("payment_transactions_profile_created_idx").on(
      table.profileId,
      table.createdAt,
    ),
    index("payment_transactions_subscription_idx").on(table.subscriptionId),
    check(
      "payment_transactions_kind_check",
      sql`${table.kind} in ('charge', 'refund', 'chargeback', 'adjustment')`,
    ),
    check(
      "payment_transactions_status_check",
      sql`${table.status} in ('pending', 'approved', 'failed', 'refunded', 'partially_refunded', 'charged_back', 'canceled')`,
    ),
    check(
      "payment_transactions_currency_check",
      sql`${table.currency} in ('USD', 'CRC')`,
    ),
    check("payment_transactions_amount_check", sql`${table.amountMinor} > 0`),
  ],
);

/** Idempotency boundary for authenticated payment webhooks. */
export const paymentProviderEvents = sqliteTable(
  "payment_provider_events",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull(),
    providerEventId: text("provider_event_id").notNull(),
    eventType: text("event_type").notNull(),
    payloadHash: text("payload_hash").notNull(),
    signatureVerified: integer("signature_verified", { mode: "boolean" })
      .notNull()
      .default(false),
    processingStatus: text("processing_status")
      .$type<"received" | "processed" | "ignored" | "failed">()
      .notNull()
      .default("received"),
    transactionId: text("transaction_id").references(
      () => paymentTransactions.id,
      { onDelete: "set null" },
    ),
    subscriptionId: text("subscription_id").references(
      () => subscriptions.id,
      { onDelete: "set null" },
    ),
    attemptCount: integer("attempt_count").notNull().default(0),
    lastError: text("last_error"),
    providerOccurredAt: integer("provider_occurred_at", {
      mode: "timestamp",
    }),
    receivedAt: createdAt(),
    processedAt: integer("processed_at", { mode: "timestamp" }),
  },
  (table) => [
    uniqueIndex("payment_provider_events_provider_event_unique").on(
      table.provider,
      table.providerEventId,
    ),
    index("payment_provider_events_status_idx").on(
      table.processingStatus,
      table.receivedAt,
    ),
    check(
      "payment_provider_events_status_check",
      sql`${table.processingStatus} in ('received', 'processed', 'ignored', 'failed')`,
    ),
    check(
      "payment_provider_events_attempts_check",
      sql`${table.attemptCount} >= 0`,
    ),
  ],
);

export const provinces = sqliteTable("provinces", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  isActive: integer("is_active", { mode: "boolean" })
    .notNull()
    .default(true),
});

export const cantons = sqliteTable(
  "cantons",
  {
    code: text("code").primaryKey(),
    provinceCode: text("province_code")
      .notNull()
      .references(() => provinces.code, { onDelete: "restrict" }),
    name: text("name").notNull(),
    isActive: integer("is_active", { mode: "boolean" })
      .notNull()
      .default(true),
  },
  (table) => [
    index("cantons_province_idx").on(table.provinceCode),
    uniqueIndex("cantons_province_name_unique").on(
      table.provinceCode,
      table.name,
    ),
  ],
);

export const districts = sqliteTable(
  "districts",
  {
    code: text("code").primaryKey(),
    cantonCode: text("canton_code")
      .notNull()
      .references(() => cantons.code, { onDelete: "restrict" }),
    name: text("name").notNull(),
    isActive: integer("is_active", { mode: "boolean" })
      .notNull()
      .default(true),
  },
  (table) => [
    index("districts_canton_idx").on(table.cantonCode),
    uniqueIndex("districts_canton_name_unique").on(
      table.cantonCode,
      table.name,
    ),
  ],
);

export const complaintCategories = sqliteTable(
  "complaint_categories",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    isActive: integer("is_active", { mode: "boolean" })
      .notNull()
      .default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (table) => [uniqueIndex("complaint_categories_code_unique").on(table.code)],
);

export const complaints = sqliteTable(
  "complaints",
  {
    id: text("id").primaryKey(),
    trackingCode: text("tracking_code").notNull(),
    ownerProfileId: text("owner_profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => complaintCategories.id, { onDelete: "restrict" }),
    provinceCode: text("province_code")
      .notNull()
      .references(() => provinces.code, { onDelete: "restrict" }),
    cantonCode: text("canton_code")
      .notNull()
      .references(() => cantons.code, { onDelete: "restrict" }),
    districtCode: text("district_code")
      .notNull()
      .references(() => districts.code, { onDelete: "restrict" }),
    locality: text("locality"),
    title: text("title").notNull(),
    description: text("description").notNull(),
    occurredOn: text("occurred_on"),
    approximateLocation: text("approximate_location"),
    status: text("status")
      .$type<ComplaintStatus>()
      .notNull()
      .default("received"),
    assignedToProfileId: text("assigned_to_profile_id").references(
      () => profiles.id,
      { onDelete: "set null" },
    ),
    truthDeclarationAccepted: integer("truth_declaration_accepted", {
      mode: "boolean",
    })
      .notNull()
      .default(false),
    privacyConsentAccepted: integer("privacy_consent_accepted", {
      mode: "boolean",
    })
      .notNull()
      .default(false),
    urgentChannelNoticeAccepted: integer("urgent_channel_notice_accepted", {
      mode: "boolean",
    })
      .notNull()
      .default(false),
    publicationAuthorized: integer("publication_authorized", {
      mode: "boolean",
    })
      .notNull()
      .default(false),
    resolutionSummary: text("resolution_summary"),
    closedAt: integer("closed_at", { mode: "timestamp" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("complaints_tracking_code_unique").on(table.trackingCode),
    index("complaints_owner_created_idx").on(
      table.ownerProfileId,
      table.createdAt,
    ),
    index("complaints_status_location_idx").on(
      table.status,
      table.provinceCode,
      table.cantonCode,
    ),
    index("complaints_category_status_idx").on(table.categoryId, table.status),
    index("complaints_assignee_status_idx").on(
      table.assignedToProfileId,
      table.status,
    ),
    check(
      "complaints_status_check",
      sql`${table.status} in ('received', 'in_review', 'additional_information_requested', 'investigating', 'closed', 'rejected')`,
    ),
  ],
);

/**
 * Contact data is a single application-encrypted payload. Its key belongs in
 * a runtime secret/KMS, never in D1 or source control.
 */
export const complaintContacts = sqliteTable(
  "complaint_contacts",
  {
    complaintId: text("complaint_id")
      .primaryKey()
      .references(() => complaints.id, { onDelete: "cascade" }),
    encryptedPayload: text("encrypted_payload").notNull(),
    encryptionKeyVersion: text("encryption_key_version").notNull(),
    contactFingerprint: text("contact_fingerprint"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("complaint_contacts_fingerprint_idx").on(table.contactFingerprint),
  ],
);

export const complaintEvidence = sqliteTable(
  "complaint_evidence",
  {
    id: text("id").primaryKey(),
    complaintId: text("complaint_id")
      .notNull()
      .references(() => complaints.id, { onDelete: "cascade" }),
    uploadedByProfileId: text("uploaded_by_profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    r2ObjectKey: text("r2_object_key").notNull(),
    originalFilename: text("original_filename").notNull(),
    safeFilename: text("safe_filename").notNull(),
    detectedMimeType: text("detected_mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    sha256: text("sha256").notNull(),
    scanStatus: text("scan_status")
      .$type<"pending" | "clean" | "quarantined" | "rejected">()
      .notNull()
      .default("pending"),
    isSensitive: integer("is_sensitive", { mode: "boolean" })
      .notNull()
      .default(true),
    removedAt: integer("removed_at", { mode: "timestamp" }),
    removedByProfileId: text("removed_by_profile_id").references(
      () => profiles.id,
      { onDelete: "set null" },
    ),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("complaint_evidence_r2_key_unique").on(table.r2ObjectKey),
    index("complaint_evidence_complaint_idx").on(
      table.complaintId,
      table.createdAt,
    ),
    index("complaint_evidence_scan_status_idx").on(table.scanStatus),
    check("complaint_evidence_size_check", sql`${table.sizeBytes} > 0`),
    check(
      "complaint_evidence_scan_status_check",
      sql`${table.scanStatus} in ('pending', 'clean', 'quarantined', 'rejected')`,
    ),
  ],
);

export const complaintStatusHistory = sqliteTable(
  "complaint_status_history",
  {
    id: text("id").primaryKey(),
    complaintId: text("complaint_id")
      .notNull()
      .references(() => complaints.id, { onDelete: "cascade" }),
    fromStatus: text("from_status").$type<ComplaintStatus>(),
    toStatus: text("to_status").$type<ComplaintStatus>().notNull(),
    changedByProfileId: text("changed_by_profile_id").references(
      () => profiles.id,
      { onDelete: "set null" },
    ),
    internalNote: text("internal_note"),
    userVisibleNote: text("user_visible_note"),
    createdAt: createdAt(),
  },
  (table) => [
    index("complaint_status_history_complaint_idx").on(
      table.complaintId,
      table.createdAt,
    ),
    check(
      "complaint_status_history_to_status_check",
      sql`${table.toStatus} in ('received', 'in_review', 'additional_information_requested', 'investigating', 'closed', 'rejected')`,
    ),
    check(
      "complaint_status_history_from_status_check",
      sql`${table.fromStatus} is null or ${table.fromStatus} in ('received', 'in_review', 'additional_information_requested', 'investigating', 'closed', 'rejected')`,
    ),
  ],
);

export const contentCategories = sqliteTable(
  "content_categories",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    isActive: integer("is_active", { mode: "boolean" })
      .notNull()
      .default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex("content_categories_slug_unique").on(table.slug)],
);

export const contentItems = sqliteTable(
  "content_items",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id").references(() => contentCategories.id, {
      onDelete: "set null",
    }),
    authorProfileId: text("author_profile_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    kind: text("kind")
      .$type<"news" | "investigation" | "video" | "resource">()
      .notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    body: text("body"),
    status: text("status")
      .$type<PublicationStatus>()
      .notNull()
      .default("draft"),
    accessLevel: text("access_level")
      .$type<AccessLevel>()
      .notNull()
      .default("public"),
    coverR2ObjectKey: text("cover_r2_object_key"),
    coverAltText: text("cover_alt_text"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    isFeatured: integer("is_featured", { mode: "boolean" })
      .notNull()
      .default(false),
    scheduledFor: integer("scheduled_for", { mode: "timestamp" }),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("content_items_slug_unique").on(table.slug),
    index("content_items_publication_idx").on(
      table.status,
      table.accessLevel,
      table.publishedAt,
    ),
    index("content_items_category_idx").on(table.categoryId, table.status),
    index("content_items_featured_idx").on(
      table.isFeatured,
      table.publishedAt,
    ),
    check(
      "content_items_kind_check",
      sql`${table.kind} in ('news', 'investigation', 'video', 'resource')`,
    ),
    check(
      "content_items_status_check",
      sql`${table.status} in ('draft', 'scheduled', 'published', 'archived')`,
    ),
    check(
      "content_items_access_level_check",
      sql`${table.accessLevel} in ('public', 'preview', 'premium')`,
    ),
  ],
);

/** Provider IDs are server-side references, never raw premium playback URLs. */
export const videoAssets = sqliteTable(
  "video_assets",
  {
    id: text("id").primaryKey(),
    contentItemId: text("content_item_id")
      .notNull()
      .references(() => contentItems.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerAssetId: text("provider_asset_id").notNull(),
    trailerProviderAssetId: text("trailer_provider_asset_id"),
    durationSeconds: integer("duration_seconds"),
    processingStatus: text("processing_status")
      .$type<"pending" | "ready" | "failed">()
      .notNull()
      .default("pending"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("video_assets_content_item_unique").on(table.contentItemId),
    uniqueIndex("video_assets_provider_asset_unique").on(
      table.provider,
      table.providerAssetId,
    ),
    check(
      "video_assets_processing_status_check",
      sql`${table.processingStatus} in ('pending', 'ready', 'failed')`,
    ),
    check(
      "video_assets_duration_check",
      sql`${table.durationSeconds} is null or ${table.durationSeconds} >= 0`,
    ),
  ],
);

export const advertisers = sqliteTable(
  "advertisers",
  {
    id: text("id").primaryKey(),
    ownerProfileId: text("owner_profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    slug: text("slug").notNull(),
    businessName: text("business_name").notNull(),
    description: text("description"),
    websiteUrl: text("website_url"),
    whatsappNumber: text("whatsapp_number"),
    logoR2ObjectKey: text("logo_r2_object_key"),
    status: text("status")
      .$type<ModerationStatus>()
      .notNull()
      .default("pending"),
    reviewedByProfileId: text("reviewed_by_profile_id").references(
      () => profiles.id,
      { onDelete: "set null" },
    ),
    reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
    moderationNote: text("moderation_note"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("advertisers_slug_unique").on(table.slug),
    index("advertisers_owner_idx").on(table.ownerProfileId),
    index("advertisers_status_idx").on(table.status, table.createdAt),
    check(
      "advertisers_status_check",
      sql`${table.status} in ('pending', 'approved', 'rejected', 'suspended', 'expired')`,
    ),
  ],
);

export const advertisements = sqliteTable(
  "advertisements",
  {
    id: text("id").primaryKey(),
    advertiserId: text("advertiser_id")
      .notNull()
      .references(() => advertisers.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    type: text("type").$type<"product" | "service">().notNull(),
    category: text("category").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    priceMinor: integer("price_minor"),
    currency: text("currency").$type<Currency>(),
    location: text("location"),
    externalUrl: text("external_url"),
    whatsappNumber: text("whatsapp_number"),
    status: text("status")
      .$type<ModerationStatus>()
      .notNull()
      .default("pending"),
    isSponsored: integer("is_sponsored", { mode: "boolean" })
      .notNull()
      .default(true),
    reviewedByProfileId: text("reviewed_by_profile_id").references(
      () => profiles.id,
      { onDelete: "set null" },
    ),
    reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
    moderationNote: text("moderation_note"),
    startsAt: integer("starts_at", { mode: "timestamp" }),
    endsAt: integer("ends_at", { mode: "timestamp" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("advertisements_slug_unique").on(table.slug),
    index("advertisements_advertiser_idx").on(table.advertiserId, table.status),
    index("advertisements_catalog_idx").on(
      table.status,
      table.category,
      table.createdAt,
    ),
    check(
      "advertisements_type_check",
      sql`${table.type} in ('product', 'service')`,
    ),
    check(
      "advertisements_status_check",
      sql`${table.status} in ('pending', 'approved', 'rejected', 'suspended', 'expired')`,
    ),
    check(
      "advertisements_currency_check",
      sql`${table.currency} is null or ${table.currency} in ('USD', 'CRC')`,
    ),
    check(
      "advertisements_price_check",
      sql`${table.priceMinor} is null or ${table.priceMinor} >= 0`,
    ),
    check(
      "advertisements_price_currency_check",
      sql`(${table.priceMinor} is null and ${table.currency} is null) or (${table.priceMinor} is not null and ${table.currency} is not null)`,
    ),
  ],
);

export const advertisementMedia = sqliteTable(
  "advertisement_media",
  {
    id: text("id").primaryKey(),
    advertisementId: text("advertisement_id")
      .notNull()
      .references(() => advertisements.id, { onDelete: "cascade" }),
    r2ObjectKey: text("r2_object_key").notNull(),
    altText: text("alt_text").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("advertisement_media_r2_key_unique").on(table.r2ObjectKey),
    index("advertisement_media_order_idx").on(
      table.advertisementId,
      table.sortOrder,
    ),
  ],
);

export const adCampaigns = sqliteTable(
  "ad_campaigns",
  {
    id: text("id").primaryKey(),
    advertiserId: text("advertiser_id")
      .notNull()
      .references(() => advertisers.id, { onDelete: "cascade" }),
    advertisementId: text("advertisement_id")
      .notNull()
      .references(() => advertisements.id, { onDelete: "cascade" }),
    billingModel: text("billing_model")
      .$type<"fixed" | "monthly" | "verified_commission">()
      .notNull(),
    status: text("status")
      .$type<"draft" | "pending_payment" | "active" | "paused" | "ended">()
      .notNull()
      .default("draft"),
    amountMinor: integer("amount_minor"),
    currency: text("currency").$type<Currency>(),
    paymentTransactionId: text("payment_transaction_id").references(
      () => paymentTransactions.id,
      { onDelete: "set null" },
    ),
    startsAt: integer("starts_at", { mode: "timestamp" }),
    endsAt: integer("ends_at", { mode: "timestamp" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("ad_campaigns_advertiser_status_idx").on(
      table.advertiserId,
      table.status,
    ),
    index("ad_campaigns_schedule_idx").on(
      table.status,
      table.startsAt,
      table.endsAt,
    ),
    check(
      "ad_campaigns_billing_model_check",
      sql`${table.billingModel} in ('fixed', 'monthly', 'verified_commission')`,
    ),
    check(
      "ad_campaigns_status_check",
      sql`${table.status} in ('draft', 'pending_payment', 'active', 'paused', 'ended')`,
    ),
    check(
      "ad_campaigns_currency_check",
      sql`${table.currency} is null or ${table.currency} in ('USD', 'CRC')`,
    ),
    check(
      "ad_campaigns_amount_check",
      sql`${table.amountMinor} is null or ${table.amountMinor} > 0`,
    ),
    check(
      "ad_campaigns_amount_currency_check",
      sql`(${table.amountMinor} is null and ${table.currency} is null) or (${table.amountMinor} is not null and ${table.currency} is not null)`,
    ),
  ],
);

export const adClickEvents = sqliteTable(
  "ad_click_events",
  {
    id: text("id").primaryKey(),
    advertisementId: text("advertisement_id")
      .notNull()
      .references(() => advertisements.id, { onDelete: "cascade" }),
    campaignId: text("campaign_id").references(() => adCampaigns.id, {
      onDelete: "set null",
    }),
    viewerProfileId: text("viewer_profile_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    destinationType: text("destination_type")
      .$type<"website" | "whatsapp">()
      .notNull(),
    sessionHash: text("session_hash"),
    referrerPath: text("referrer_path"),
    createdAt: createdAt(),
  },
  (table) => [
    index("ad_click_events_ad_created_idx").on(
      table.advertisementId,
      table.createdAt,
    ),
    index("ad_click_events_campaign_created_idx").on(
      table.campaignId,
      table.createdAt,
    ),
    check(
      "ad_click_events_destination_type_check",
      sql`${table.destinationType} in ('website', 'whatsapp')`,
    ),
  ],
);

/** Append-only at the application boundary; metadata must be redacted. */
export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorProfileId: text("actor_profile_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id"),
    targetProfileId: text("target_profile_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    requestId: text("request_id"),
    ipHash: text("ip_hash"),
    userAgentHash: text("user_agent_hash"),
    outcome: text("outcome")
      .$type<"success" | "denied" | "failure">()
      .notNull(),
    metadataJson: text("metadata_json"),
    createdAt: createdAt(),
  },
  (table) => [
    index("audit_logs_actor_created_idx").on(
      table.actorProfileId,
      table.createdAt,
    ),
    index("audit_logs_resource_idx").on(
      table.resourceType,
      table.resourceId,
      table.createdAt,
    ),
    index("audit_logs_request_idx").on(table.requestId),
    check(
      "audit_logs_outcome_check",
      sql`${table.outcome} in ('success', 'denied', 'failure')`,
    ),
  ],
);

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Plan = typeof plans.$inferSelect;
export type PlanPrice = typeof planPrices.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type PaymentProviderEvent = typeof paymentProviderEvents.$inferSelect;
export type Complaint = typeof complaints.$inferSelect;
export type NewComplaint = typeof complaints.$inferInsert;
export type ComplaintEvidence = typeof complaintEvidence.$inferSelect;
export type ContentItem = typeof contentItems.$inferSelect;
export type NewContentItem = typeof contentItems.$inferInsert;
export type Advertiser = typeof advertisers.$inferSelect;
export type Advertisement = typeof advertisements.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
