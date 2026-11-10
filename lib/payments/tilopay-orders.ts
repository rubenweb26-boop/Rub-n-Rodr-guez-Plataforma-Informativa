import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ConsultedPayment, PaymentCurrency } from "./types";
import { getTilopayProvider } from "./tilopay-server";

type TransactionStatus =
  | "pending"
  | "approved"
  | "failed"
  | "refunded"
  | "partially_refunded"
  | "charged_back"
  | "canceled";

export type StoredTilopayTransaction = {
  id: string;
  userId: string;
  planPriceId: string | null;
  orderNumber: string;
  providerTransactionId: string | null;
  status: TransactionStatus;
  amountMinor: number;
  currency: PaymentCurrency;
};

export type ActivePlanPrice = {
  id: string;
  amountMinor: number;
  currency: PaymentCurrency;
  billingInterval: string;
};

type ReconciliationStatus = "approved" | "rejected" | "pending" | "invalid";

export type TilopayReconciliation = {
  status: ReconciliationStatus;
  transactionId: string | null;
  subscriptionId: string | null;
  consulted: ConsultedPayment | null;
};

function isCurrency(value: unknown): value is PaymentCurrency {
  return value === "CRC" || value === "USD";
}

function isTransactionStatus(value: unknown): value is TransactionStatus {
  return (
    value === "pending" ||
    value === "approved" ||
    value === "failed" ||
    value === "refunded" ||
    value === "partially_refunded" ||
    value === "charged_back" ||
    value === "canceled"
  );
}

export async function findActivePlanPrice(
  planCode: string,
  currency: PaymentCurrency,
): Promise<ActivePlanPrice | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("plan_prices")
    .select("id, amount_minor, currency, billing_interval, plans!inner(code, is_active)")
    .eq("plans.code", planCode)
    .eq("plans.is_active", true)
    .eq("currency", currency)
    .eq("billing_interval", "month")
    .eq("provider", "tilopay")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Unable to select the configured plan price.");
  if (
    !data ||
    typeof data.id !== "string" ||
    !Number.isSafeInteger(data.amount_minor) ||
    data.amount_minor <= 0 ||
    !isCurrency(data.currency) ||
    typeof data.billing_interval !== "string"
  ) {
    return null;
  }
  return {
    id: data.id,
    amountMinor: data.amount_minor,
    currency: data.currency,
    billingInterval: data.billing_interval,
  };
}

export async function createPendingTilopayTransaction(input: {
  id: string;
  userId: string;
  planPriceId: string;
  orderNumber: string;
  amountMinor: number;
  currency: PaymentCurrency;
}): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("payment_transactions").insert({
    id: input.id,
    user_id: input.userId,
    plan_price_id: input.planPriceId,
    provider: "tilopay",
    provider_order_number: input.orderNumber,
    provider_transaction_id: null,
    idempotency_key: `tilopay:${input.orderNumber}`,
    status: "pending",
    amount_minor: input.amountMinor,
    currency: input.currency,
    provider_status: "checkout_pending",
    metadata_json: { checkout: "hosted_payment_page" },
  });
  if (error) throw new Error("Unable to persist the payment order.");
}

export async function markTilopayCheckoutCreated(
  transactionId: string,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("payment_transactions")
    .update({ provider_status: "checkout_created", updated_at: new Date().toISOString() })
    .eq("id", transactionId)
    .eq("provider", "tilopay")
    .eq("status", "pending");
  if (error) throw new Error("Unable to update the payment order.");
}

export async function markTilopayCheckoutFailed(
  transactionId: string,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("payment_transactions")
    .update({
      status: "failed",
      provider_status: "checkout_creation_failed",
      failure_code: "checkout_creation_failed",
      failure_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", transactionId)
    .eq("provider", "tilopay")
    .eq("status", "pending");
}

/**
 * A recurring subscription started through Tilopay's plan flow. `provider`
 * reference is the subscriber email because Tilopay identifies recurring
 * subscribers per plan by email, not by an opaque id.
 */
export type StoredSubscription = {
  id: string;
  userId: string;
  planPriceId: string | null;
  status: string;
  accessUntil: string | null;
  providerSubscriptionId: string | null;
};

export async function upsertRecurringSubscription(input: {
  userId: string;
  planPriceId: string | null;
  planId: string;
  email: string;
  status: "pending" | "active" | "past_due" | "canceled" | "expired";
  accessUntil: string | null;
  currentPeriodEnd: string | null;
}): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const reference = `${input.planId}:${input.email.toLowerCase()}`;

  const { data: existing, error: readError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("provider", "tilopay")
    .eq("provider_subscription_id", reference)
    .limit(1)
    .maybeSingle();
  if (readError) throw new Error("Unable to read the recurring subscription.");

  if (existing && typeof existing.id === "string") {
    const { error } = await supabase
      .from("subscriptions")
      .update({
        status: input.status,
        plan_price_id: input.planPriceId,
        access_until: input.accessUntil,
        current_period_end: input.currentPeriodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .eq("provider", "tilopay");
    if (error) throw new Error("Unable to update the recurring subscription.");
    return existing.id;
  }

  const id = crypto.randomUUID();
  const { error } = await supabase.from("subscriptions").insert({
    id,
    user_id: input.userId,
    plan_id: await planIdForPrice(input.planPriceId),
    plan_price_id: input.planPriceId,
    provider: "tilopay",
    provider_subscription_id: reference,
    status: input.status,
    current_period_start: new Date().toISOString(),
    current_period_end: input.currentPeriodEnd,
    access_until: input.accessUntil,
  });
  if (error) throw new Error("Unable to create the recurring subscription.");
  return id;
}

async function planIdForPrice(planPriceId: string | null): Promise<string> {
  if (!planPriceId) throw new Error("A plan price is required for a subscription.");
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("plan_prices")
    .select("plan_id")
    .eq("id", planPriceId)
    .limit(1)
    .maybeSingle();
  if (error || !data || typeof data.plan_id !== "string") {
    throw new Error("Unable to resolve the plan for the subscription.");
  }
  return data.plan_id;
}

export async function findSubscriptionByEmail(
  planId: string,
  email: string,
): Promise<StoredSubscription | null> {
  const supabase = createSupabaseAdminClient();
  const reference = `${planId}:${email.toLowerCase()}`;
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, user_id, plan_price_id, status, access_until, provider_subscription_id")
    .eq("provider", "tilopay")
    .eq("provider_subscription_id", reference)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Unable to find the recurring subscription.");
  if (!data || typeof data.id !== "string" || typeof data.user_id !== "string") {
    return null;
  }
  return {
    id: data.id,
    userId: data.user_id,
    planPriceId: typeof data.plan_price_id === "string" ? data.plan_price_id : null,
    status: typeof data.status === "string" ? data.status : "pending",
    accessUntil: typeof data.access_until === "string" ? data.access_until : null,
    providerSubscriptionId:
      typeof data.provider_subscription_id === "string"
        ? data.provider_subscription_id
        : null,
  };
}

/**
 * Extends access by exactly one billing period. Called only after Tilopay
 * confirms a recurring charge, and idempotent per (subscription, period end) so
 * a retried webhook cannot grant two months.
 */
export async function extendRecurringAccess(input: {
  subscriptionId: string;
  amountMinor: number;
  currency: PaymentCurrency;
  providerOrderNumber: string;
  providerTransactionId: string | null;
  periodEnd: string;
}): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const idempotencyKey = `tilopay-recurring:${input.providerOrderNumber}`;

  const { error: transactionError } = await supabase
    .from("payment_transactions")
    .insert({
      id: crypto.randomUUID(),
      user_id: await userIdForSubscription(input.subscriptionId),
      subscription_id: input.subscriptionId,
      provider: "tilopay",
      provider_order_number: input.providerOrderNumber,
      provider_transaction_id: input.providerTransactionId,
      idempotency_key: idempotencyKey,
      kind: "charge",
      status: "approved",
      amount_minor: input.amountMinor,
      currency: input.currency,
      provider_status: "recurring_approved",
      metadata_json: { checkout: "recurring_plan" },
      approved_at: new Date().toISOString(),
    });

  // 23505 means this recurring charge was already recorded; extending again
  // would double the subscriber's access.
  if (transactionError) {
    if (transactionError.code === "23505") return;
    throw new Error("Unable to record the recurring charge.");
  }

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "active",
      access_until: input.periodEnd,
      current_period_end: input.periodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.subscriptionId)
    .eq("provider", "tilopay");
  if (error) throw new Error("Unable to extend the recurring access.");
}

async function userIdForSubscription(subscriptionId: string): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("id", subscriptionId)
    .limit(1)
    .maybeSingle();
  if (error || !data || typeof data.user_id !== "string") {
    throw new Error("Unable to resolve the subscription owner.");
  }
  return data.user_id;
}

export async function setSubscriptionStatus(input: {
  subscriptionId: string;
  status: "active" | "past_due" | "canceled" | "expired";
  accessUntil?: string | null;
  canceledAt?: string | null;
}): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: input.status,
      ...(input.accessUntil !== undefined ? { access_until: input.accessUntil } : {}),
      ...(input.canceledAt ? { canceled_at: input.canceledAt } : {}),
      ...(input.status === "canceled" ? { cancel_at_period_end: true } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.subscriptionId)
    .eq("provider", "tilopay");
  if (error) throw new Error("Unable to update the subscription status.");
}

export async function findTilopayTransaction(
  orderNumber: string,
): Promise<StoredTilopayTransaction | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payment_transactions")
    .select(
      "id, user_id, plan_price_id, provider_order_number, provider_transaction_id, status, amount_minor, currency",
    )
    .eq("provider", "tilopay")
    .eq("provider_order_number", orderNumber)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Unable to find the payment order.");
  if (
    !data ||
    typeof data.id !== "string" ||
    typeof data.user_id !== "string" ||
    typeof data.provider_order_number !== "string" ||
    !isTransactionStatus(data.status) ||
    !Number.isSafeInteger(data.amount_minor) ||
    !isCurrency(data.currency)
  ) {
    return null;
  }
  return {
    id: data.id,
    userId: data.user_id,
    planPriceId: typeof data.plan_price_id === "string" ? data.plan_price_id : null,
    orderNumber: data.provider_order_number,
    providerTransactionId:
      typeof data.provider_transaction_id === "string"
        ? data.provider_transaction_id
        : null,
    status: data.status,
    amountMinor: data.amount_minor,
    currency: data.currency,
  };
}

async function grantTilopayMembership(transactionId: string): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("grant_tilopay_membership", {
    p_transaction_id: transactionId,
  });
  if (error || typeof data !== "string") {
    throw new Error("Unable to grant the verified Tilopay membership.");
  }
  return data;
}

/**
 * Confirms the provider state and compares immutable server-side amount,
 * currency, and order number before marking a transaction approved. This
 * function grants a one-month membership only through the server-only,
 * idempotent database boundary after the immutable fields have matched.
 */
export async function reconcileTilopayOrder(
  orderNumber: string,
): Promise<TilopayReconciliation> {
  const transaction = await findTilopayTransaction(orderNumber);
  if (!transaction) {
    return {
      status: "invalid",
      transactionId: null,
      subscriptionId: null,
      consulted: null,
    };
  }

  const consulted = await getTilopayProvider().consultOrder(orderNumber);
  if (consulted.status === "not_found") {
    return {
      status: "pending",
      transactionId: transaction.id,
      subscriptionId: null,
      consulted,
    };
  }

  const immutableFieldsMatch =
    consulted.orderNumber === transaction.orderNumber &&
    consulted.amountMinor === transaction.amountMinor &&
    consulted.currency === transaction.currency;
  const supabase = createSupabaseAdminClient();
  if (!immutableFieldsMatch) {
    await supabase
      .from("payment_transactions")
      .update({
        provider_status: "verification_mismatch",
        failure_code: "verification_mismatch",
        failure_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id)
      .eq("provider", "tilopay");
    return {
      status: "invalid",
      transactionId: transaction.id,
      subscriptionId: null,
      consulted,
    };
  }

  if (consulted.status === "approved") {
    const { error } = await supabase
      .from("payment_transactions")
      .update({
        status: "approved",
        provider_status: "approved",
        provider_transaction_id: consulted.providerTransactionId,
        failure_code: null,
        failure_message: null,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id)
      .eq("provider", "tilopay")
      .in("status", ["pending", "failed", "approved"]);
    if (error) throw new Error("Unable to persist the verified payment state.");
    const subscriptionId = await grantTilopayMembership(transaction.id);
    return {
      status: "approved",
      transactionId: transaction.id,
      subscriptionId,
      consulted,
    };
  }

  if (transaction.status !== "approved") {
    const { error } = await supabase
      .from("payment_transactions")
      .update({
        status: "failed",
        provider_status: "rejected",
        provider_transaction_id: consulted.providerTransactionId,
        failure_code: "provider_rejected",
        failure_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id)
      .eq("provider", "tilopay")
      .eq("status", "pending");
    if (error) throw new Error("Unable to persist the verified payment state.");
  }
  return {
    status: "rejected",
    transactionId: transaction.id,
    subscriptionId: null,
    consulted,
  };
}
