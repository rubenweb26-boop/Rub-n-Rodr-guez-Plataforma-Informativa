import { NextResponse } from "next/server";
import {
  generateWhatsAppBotReply,
  sendWhatsAppMessage,
  WhatsAppIncomingMessage,
} from "@/lib/whatsapp/bot";

export const dynamic = "force-dynamic";

interface MetaWebhookPayload {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
        }>;
        contacts?: Array<{
          profile?: { name?: string };
          wa_id?: string;
        }>;
      };
    }>;
  }>;
}

/**
 * Meta WhatsApp Cloud API Webhook Verification (GET)
 * Meta calls this endpoint with hub.mode, hub.verify_token, and hub.challenge
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken =
    process.env.WHATSAPP_VERIFY_TOKEN || "ruben_rodriguez_wa_verify_2026";

  if (mode === "subscribe" && token === expectedToken) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Verificación no autorizada." }, { status: 403 });
}

/**
 * Meta WhatsApp Cloud API Incoming Message Handler (POST)
 */
export async function POST(request: Request) {
  let payload: MetaWebhookPayload;
  try {
    payload = (await request.json()) as MetaWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  // Meta sends event notifications with entry array
  if (payload.object === "whatsapp_business_account" && Array.isArray(payload.entry)) {
    for (const entry of payload.entry) {
      if (!Array.isArray(entry.changes)) continue;
      for (const change of entry.changes) {
        const value = change.value;
        if (!value || !Array.isArray(value.messages)) continue;

        const contact = Array.isArray(value.contacts) ? value.contacts[0] : null;
        const senderName = contact?.profile?.name || undefined;

        for (const msg of value.messages) {
          if (msg.type === "text" && msg.text?.body) {
            const incoming: WhatsAppIncomingMessage = {
              from: msg.from,
              id: msg.id,
              timestamp: msg.timestamp,
              text: msg.text.body,
              name: senderName,
            };

            const replyText = await generateWhatsAppBotReply(incoming);
            await sendWhatsAppMessage(incoming.from, replyText);
          }
        }
      }
    }

    return NextResponse.json({ status: "success" });
  }

  return NextResponse.json({ status: "ignored" });
}
