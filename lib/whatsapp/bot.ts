async function getAdminClient() {
  const { createSupabaseAdminClient } = await import("../supabase/admin");
  return createSupabaseAdminClient();
}

export interface WhatsAppIncomingMessage {
  from: string; // Phone number e.g. "50688880000"
  id: string;
  timestamp: string;
  text?: string;
  name?: string;
}

const STATUS_LABELS: Record<string, string> = {
  submitted: "Recepción (Recibida, en espera de turno)",
  received: "Recepción (Registrada en sistema)",
  under_review: "En Revisión Preliminar",
  in_review: "En Revisión Preliminar",
  investigating: "En Investigación de Campo",
  in_investigation: "En Investigación de Campo",
  closed: "Concluida / Derivada a Autoridades",
};

/**
 * Generates an automated response based on user input.
 * Strictly avoids exposing private personal data over WhatsApp.
 */
export async function generateWhatsAppBotReply(message: WhatsAppIncomingMessage): Promise<string> {
  const text = (message.text || "").trim();
  const lower = text.toLowerCase();
  const userName = message.name ? ` ${message.name}` : "";

  // 1. Check for complaint tracking code pattern (e.g., DEN-2026-CR-12345 or DEN-...)
  const trackingMatch = text.match(/\b(DEN-[A-Z0-9-]+)\b/i);
  if (trackingMatch) {
    const trackingCode = trackingMatch[1].toUpperCase();
    try {
      const admin = await getAdminClient();
      const { data: complaint } = await admin
        .from("complaints")
        .select("tracking_code, status, created_at, updated_at")
        .eq("tracking_code", trackingCode)
        .maybeSingle();

      if (complaint) {
        const statusLabel = STATUS_LABELS[complaint.status] || complaint.status;
        const date = new Date(complaint.created_at).toLocaleDateString("es-CR");
        return `📋 *Consulta de Caso — Rubén Rodríguez*

*Código:* ${complaint.tracking_code}
*Estado actual:* ${statusLabel}
*Fecha de recepción:* ${date}

🔒 *Protección de Datos:*
Por estrictas políticas de confidencialidad, las evidencias y notas internas no se divulgan por mensajería.
Puedes acceder al expediente completo iniciando sesión en:
👉 https://rubenrodriguezoficial.com/mi-cuenta`;
      } else {
        return `⚠️ *Código no localizado*

No encontramos ningún registro asociado al código *${trackingCode}*.
Por favor verifica que coincida exactamente con el código otorgado en el comprobante (ejemplo: *DEN-2026-CR-XXXXX*).

Si necesitas ayuda de un moderador, responde con el número *5*.`;
      }
    } catch {
      return `⚠️ El servicio de consulta se encuentra en mantenimiento preventivo. Por favor consulta directamente en https://rubenrodriguezoficial.com/mi-cuenta`;
    }
  }

  // 2. Menu selection: Option 1 - Membresías
  if (lower === "1" || lower.includes("membresia") || lower.includes("suscripcion") || lower.includes("precio") || lower.includes("costo")) {
    return `💳 *Membresías Oficiales Rubén Rodríguez*

Contamos con dos modalidades de participación activa a *₡3.500 al mes*:

1️⃣ *Membresía Ciudadana (₡3.500/mes):*
• Presentación y seguimiento prioritario de denuncias.
• Acceso a investigaciones encubiertas completas sin censura.
• Videos en alta definición y actas documentales.
• Respaldo y asesoría del equipo de Rubén Rodríguez.

2️⃣ *Membresía Comercial para Anunciantes (₡3.500/mes):*
• Perfil de negocio verificado.
• Publicación de hasta 10 productos o servicios.
• Botón directo a tu WhatsApp comercial.
• Aparición en el carrusel publicitario de la plataforma.

👉 Activa tu membresía segura en:
https://rubenrodriguezoficial.com/membresia`;
  }

  // 3. Menu selection: Option 2 - Cómo presentar denuncia
  if (lower === "2" || lower.includes("denuncia") || lower.includes("denunciar") || lower.includes("maltrato") || lower.includes("reportar")) {
    return `⚖️ *Cómo presentar una Denuncia Ciudadana*

Nuestro sistema te permite denunciar situaciones de maltrato animal, criaderos clandestinos, irregularidades municipales y daño ambiental con total privacidad.

*Pasos a seguir:*
1. Ingresa a la plataforma: https://rubenrodriguezoficial.com/denuncias
2. Inicia sesión con tu cuenta verificada.
3. Completa los datos oficiales: Provincia, Cantón, Distrito y relato.
4. Adjunta evidencias (fotografías, videos o documentos).
5. Recibe tu código de seguimiento único e intransferible.

⚠️ *Aviso Legal:*
Este canal no sustituye al *9-1-1* en emergencias de riesgo inminente ni a las autoridades judiciales (OIJ, SENASA, Fiscalía).`;
  }

  // 4. Menu selection: Option 3 - Consulta de estado
  if (lower === "3" || lower.includes("estado") || lower.includes("seguimiento") || lower.includes("caso")) {
    return `🔍 *Consulta de Estado de Denuncia*

Para verificar el avance de tu caso, simplemente escribe en este chat tu código de seguimiento, por ejemplo:
👉 *DEN-2026-CR-00123*

Nuestro sistema consultará de inmediato la base de datos segura y te indicará si tu expediente se encuentra en:
• Recepción
• En Revisión Preliminar
• En Investigación de Campo
• Concluida / Derivada`;
  }

  // 5. Menu selection: Option 4 - Vitrina comercial para empresas
  if (lower === "4" || lower.includes("anunciante") || lower.includes("publicidad") || lower.includes("comercio") || lower.includes("negocio") || lower.includes("vitrina")) {
    return `📢 *Vitrina Comercial para Anunciantes*

¿Tienes una clínica veterinaria, tienda de alimentos naturales, adiestramiento canino o servicio profesional en Costa Rica?

• Publica hasta 10 productos o servicios en nuestra vitrina.
• Tus clientes te contactan directamente a tu WhatsApp ("Infórmate directamente con el proveedor").
• Costo mensual accesible de *₡3.500*.
• Sin intermediarios ni comisiones sobre tus ventas.

👉 Conoce más y postula tu negocio en:
https://rubenrodriguezoficial.com/anuncios`;
  }

  // 6. Menu selection: Option 5 - Hablar con moderador humano
  if (lower === "5" || lower.includes("humano") || lower.includes("contacto") || lower.includes("persona") || lower.includes("ruben") || lower.includes("ayuda")) {
    return `👤 *Atención Personalizada*

Hemos notificado al equipo de coordinación y moderación de Rubén Rodríguez.

Un miembro de nuestro equipo atenderá este chat a la mayor brevedad posible en horario hábil.

También puedes escribirnos formalmente a:
📧 contacto@rubenrodriguezoficial.com

¡Gracias por tu compromiso con la justicia y el bienestar animal en Costa Rica! 🐾`;
  }

  // Default Main Menu
  return `🐾 *Plataforma Oficial de Rubén Rodríguez*
_Bienestar Animal · Investigaciones · Denuncias Ciudadanas_

Hola${userName}, gracias por comunicarte con nuestro canal oficial de atención ciudadana en Costa Rica.

Por favor responde con el número de tu opción:

1️⃣ *Membresías y suscripción mensual (₡3.500)*
2️⃣ *Cómo presentar una denuncia ciudadana*
3️⃣ *Consultar estado de denuncia* (o envía tu código DEN-...)
4️⃣ *Vitrina comercial para anunciantes y negocios*
5️⃣ *Hablar con un moderador humano*

O visita nuestro sitio oficial en cualquier momento:
👉 https://rubenrodriguezoficial.com`;
}

/**
 * Dispatches an outgoing message using Meta WhatsApp Business Cloud API
 * if credentials (WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID) are configured.
 */
export async function sendWhatsAppMessage(to: string, bodyText: string): Promise<boolean> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.warn("WhatsApp Cloud API credentials not configured in environment.");
    return false;
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: false, body: bodyText },
      }),
    });

    return res.ok;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return false;
  }
}
