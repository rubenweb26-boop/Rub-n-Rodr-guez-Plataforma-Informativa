import { NextResponse } from "next/server";
import { processOnvoWebhook } from "@/lib/payments/onvo";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secretHeader =
    request.headers.get("x-webhook-secret") ||
    request.headers.get("X-Webhook-Secret") ||
    request.headers.get("webhook-secret");

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { error: "No fue posible leer el cuerpo de la solicitud." },
      { status: 400 },
    );
  }

  try {
    const result = await processOnvoWebhook(rawBody, secretHeader);
    return NextResponse.json({ ok: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al procesar el webhook de ONVO Pay.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
