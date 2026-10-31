import { env } from "cloudflare:workers";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import {
  cantons, complaintCategories, complaintEvidence, complaints,
  complaintStatusHistory, districts, provinces,
} from "@/db/schema";
import { ensureProfile } from "@/lib/data/profiles";

const MAX_FILES = 4;
const MAX_FILE_SIZE = 12 * 1024 * 1024;
const MAX_TOTAL_SIZE = 25 * 1024 * 1024;
const categoryNames: Record<string, string> = {
  infrastructure: "Infraestructura pública",
  public_services: "Servicios públicos",
  environment: "Medioambiente",
  community_safety: "Seguridad comunitaria",
  administrative_irregularities: "Posibles irregularidades administrativas",
  municipal: "Problemas municipales",
  other: "Otros asuntos de interés público",
};

export async function POST(request: Request) {
  if (env.COMPLAINT_INTAKE_ENABLED !== "true") {
    return NextResponse.json({ error: "La recepción de información sensible permanece desactivada hasta completar la revisión legal y operativa." }, { status: 503 });
  }
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });

  const form = await request.formData();
  const data = Object.fromEntries([...form.entries()].filter(([, value]) => typeof value === "string")) as Record<string, string>;
  const files = form.getAll("evidence").filter((value): value is File => value instanceof File && value.size > 0);
  const error = validate(data, files);
  if (error) return NextResponse.json({ error }, { status: 400 });
  if (files.length && !env.BUCKET) return NextResponse.json({ error: "El almacenamiento privado no está disponible." }, { status: 503 });

  const db = getDb();
  const [province] = await db.select().from(provinces).where(eq(provinces.code, data.province)).limit(1);
  const [canton] = await db.select().from(cantons).where(and(eq(cantons.code, data.canton), eq(cantons.provinceCode, data.province))).limit(1);
  const [district] = await db.select().from(districts).where(and(eq(districts.code, data.district), eq(districts.cantonCode, data.canton))).limit(1);
  if (!province || !canton || !district) return NextResponse.json({ error: "Selecciona una ubicación válida del catálogo oficial." }, { status: 400 });

  const profile = await ensureProfile(user);
  const categoryId = `complaint-category:${data.category}`;
  await db.insert(complaintCategories).values({ id: categoryId, code: data.category, name: categoryNames[data.category] }).onConflictDoNothing({ target: complaintCategories.code });
  const complaintId = crypto.randomUUID();
  const trackingCode = makeTrackingCode();
  const storedKeys: string[] = [];

  try {
    await db.insert(complaints).values({
      id: complaintId,
      trackingCode,
      ownerProfileId: profile.id,
      categoryId,
      provinceCode: data.province,
      cantonCode: data.canton,
      districtCode: data.district,
      locality: clean(data.locality, 160),
      title: clean(data.title, 180)!,
      description: clean(data.description, 8000)!,
      occurredOn: data.occurredOn || null,
      approximateLocation: clean(data.approximateLocation, 240),
      truthDeclarationAccepted: true,
      privacyConsentAccepted: true,
      urgentChannelNoticeAccepted: true,
    });
    await db.insert(complaintStatusHistory).values({ id: crypto.randomUUID(), complaintId, toStatus: "received", userVisibleNote: "Información recibida para revisión inicial." });

    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const detected = detectType(bytes);
      if (!detected) throw new Error(`Tipo de archivo no permitido: ${file.name}`);
      const key = `quarantine/${complaintId}/${crypto.randomUUID()}-${safeFilename(file.name)}`;
      await env.BUCKET!.put(key, bytes, { httpMetadata: { contentType: detected } });
      storedKeys.push(key);
      await db.insert(complaintEvidence).values({
        id: crypto.randomUUID(), complaintId, uploadedByProfileId: profile.id,
        r2ObjectKey: key, originalFilename: clean(file.name, 220)!, safeFilename: safeFilename(file.name),
        detectedMimeType: detected, sizeBytes: file.size, sha256: await sha256(bytes), scanStatus: "pending",
      });
    }
    return NextResponse.json({ ok: true, trackingCode }, { status: 201 });
  } catch (cause) {
    for (const key of storedKeys) await env.BUCKET?.delete(key).catch(() => undefined);
    await db.delete(complaints).where(eq(complaints.id, complaintId)).catch(() => undefined);
    const message = cause instanceof Error ? cause.message : "No fue posible guardar la información.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function validate(data: Record<string, string>, files: File[]) {
  if (!categoryNames[data.category]) return "Selecciona una categoría válida.";
  if (!data.province || !data.canton || !data.district) return "Completa provincia, cantón y distrito.";
  if (!data.title || data.title.trim().length < 8) return "El título debe tener al menos 8 caracteres.";
  if (!data.description || data.description.trim().length < 40) return "La descripción debe tener al menos 40 caracteres.";
  if (data.title.length > 180 || data.description.length > 8000) return "El texto supera el límite permitido.";
  if (data.truth !== "on" || data.privacy !== "on" || data.urgentNotice !== "on") return "Debes aceptar las declaraciones obligatorias.";
  if (files.length > MAX_FILES) return `Puedes adjuntar hasta ${MAX_FILES} archivos.`;
  if (files.some((file) => file.size > MAX_FILE_SIZE)) return "Cada archivo debe pesar 12 MB o menos.";
  if (files.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_SIZE) return "Los archivos superan el límite total de 25 MB.";
  return null;
}

function clean(value: string | undefined, max: number) { const result = value?.trim().replace(/[\u0000-\u001F\u007F]/g, " ").slice(0, max); return result || null; }
function safeFilename(name: string) { return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(-120) || "archivo"; }
function makeTrackingCode() { const year = new Date().getUTCFullYear(); const token = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase(); return `RW-${year}-${token}`; }
async function sha256(bytes: Uint8Array) {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", buffer))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
function detectType(bytes: Uint8Array) {
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a].every((v,i)=>bytes[i]===v)) return "image/png";
  if (bytes.length >= 4 && bytes[0]===0x25 && bytes[1]===0x50 && bytes[2]===0x44 && bytes[3]===0x46) return "application/pdf";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(4,8)) === "ftyp") return "video/mp4";
  if (bytes.length >= 4 && bytes[0]===0x1a && bytes[1]===0x45 && bytes[2]===0xdf && bytes[3]===0xa3) return "video/webm";
  return null;
}
