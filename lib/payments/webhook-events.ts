import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  paymentProviderEvents,
  paymentTransactions,
  subscriptions,
} from "@/db/schema";
import {
  fingerprintWebhookBody,
  getOnvoProviderEventId,
  getOnvoProviderOccurredAt,
  onvoWebhookEventTypes,
  type OnvoWebhookEvent,
} from "./onvo";

export interface RegisterOnvoWebhookInput {
  event: OnvoWebhookEvent;
  rawBody: string;
}

export interface RegisteredWebhookEvent {
  id: string;
  providerEventId: string;
  duplicate: boolean;
  processingStatus: "received" | "ignored";
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function isKnownOnvoEvent(type: string): boolean {
  return (onvoWebhookEventTypes as readonly string[]).includes(type);
}

async function findRelatedRecords(event: OnvoWebhookEvent): Promise<{
  transactionId: string | null;
  subscriptionId: string | null;
}> {
  const db = getDb();
  const providerPaymentIntentId = stringValue(
    event.data.paymentIntentId ??
      (event.type.startsWith("payment-intent.") ? event.data.id : null),
  );
  const providerSubscriptionId = stringValue(event.data.subscriptionId);

  const [transaction, subscription] = await Promise.all([
    providerPaymentIntentId
      ? db
          .select({ id: paymentTransactions.id })
          .from(paymentTransactions)
          .where(
            and(
              eq(paymentTransactions.provider, "onvo"),
              eq(
                paymentTransactions.providerTransactionId,
                providerPaymentIntentId,
              ),
            ),
          )
          .limit(1)
      : Promise.resolve([]),
    providerSubscriptionId
      ? db
          .select({ id: subscriptions.id })
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.provider, "onvo"),
              eq(
                subscriptions.providerSubscriptionId,
                providerSubscriptionId,
              ),
            ),
          )
          .limit(1)
      : Promise.resolve([]),
  ]);

  return {
    transactionId: transaction[0]?.id ?? null,
    subscriptionId: subscription[0]?.id ?? null,
  };
}

/**
 * Persists receipt only. Deliberately does not mutate a subscription or grant
 * premium access; entitlement changes belong to a separate verified
 * reconciliation processor.
 */
export async function registerOnvoWebhookEvent({
  event,
  rawBody,
}: RegisterOnvoWebhookInput): Promise<RegisteredWebhookEvent> {
  const db = getDb();
  const payloadHash = await fingerprintWebhookBody(rawBody);
  const providerEventId = getOnvoProviderEventId(event, payloadHash);
  const processingStatus = isKnownOnvoEvent(event.type)
    ? ("received" as const)
    : ("ignored" as const);
  const related = await findRelatedRecords(event);
  const id = crypto.randomUUID();

  const inserted = await db
    .insert(paymentProviderEvents)
    .values({
      id,
      provider: "onvo",
      providerEventId,
      eventType: event.type,
      payloadHash,
      signatureVerified: true,
      processingStatus,
      transactionId: related.transactionId,
      subscriptionId: related.subscriptionId,
      attemptCount: 1,
      providerOccurredAt: getOnvoProviderOccurredAt(event),
    })
    .onConflictDoNothing({
      target: [
        paymentProviderEvents.provider,
        paymentProviderEvents.providerEventId,
      ],
    })
    .returning({ id: paymentProviderEvents.id });

  if (inserted.length > 0) {
    return { id, providerEventId, duplicate: false, processingStatus };
  }

  await db
    .update(paymentProviderEvents)
    .set({
      attemptCount: sql`${paymentProviderEvents.attemptCount} + 1`,
    })
    .where(
      and(
        eq(paymentProviderEvents.provider, "onvo"),
        eq(paymentProviderEvents.providerEventId, providerEventId),
      ),
    );

  const existing = await db
    .select({ id: paymentProviderEvents.id })
    .from(paymentProviderEvents)
    .where(
      and(
        eq(paymentProviderEvents.provider, "onvo"),
        eq(paymentProviderEvents.providerEventId, providerEventId),
      ),
    )
    .limit(1);

  return {
    id: existing[0]?.id ?? id,
    providerEventId,
    duplicate: true,
    processingStatus,
  };
}
