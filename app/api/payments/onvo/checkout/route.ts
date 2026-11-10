import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/user";
import {
  createOnvoCheckoutSession,
  isOnvoConfigured,
  OnvoPlanKey,
} from "@/lib/payments/onvo";
import { isSameOriginMutation } from "@/lib/security/origin";

export const dynamic = "force-dynamic";

const checkoutSchema = z.object({
  planKey: z.enum(["membership_citizen", "membership_commercial"]),
});

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ error: "Solicitud no autorizada." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión para suscribirte." }, { status: 401 });
  }

  if (!isOnvoConfigured()) {
    return NextResponse.json(
      {
        error:
          "La integración con ONVO Pay aún no cuenta con la variable ONVO_SECRET_KEY en el entorno.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido." }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Plan seleccionado no válido." }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const successUrl = `${origin}/mi-cuenta?pago=exitoso&proveedor=onvo`;
  const cancelUrl = `${origin}/membresia?pago=cancelado`;

  try {
    const session = await createOnvoCheckoutSession({
      userId: user.id,
      userEmail: user.email,
      planKey: parsed.data.planKey as OnvoPlanKey,
      successUrl,
      cancelUrl,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "No fue posible generar la sesión de pago con ONVO Pay." },
        { status: 500 },
      );
    }

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al procesar la solicitud con ONVO Pay.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
