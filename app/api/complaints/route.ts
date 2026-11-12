import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/user";
import { recordAuditEvent } from "@/lib/security/audit";
import { encryptSensitiveJson } from "@/lib/security/crypto";
import {
  detectAllowedFileType,
  extensionForType,
  fileMatchesType,
  safeAttachmentName,
} from "@/lib/security/files";
import {
  hasContentType,
  isSameOriginMutation,
  readRequestWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/security/origin";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { isTurnstileConfigured, verifyTurnstile } from "@/lib/security/turnstile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MAX_FILES = 4;
const MAX_FILE_SIZE = 12 * 1024 * 1024;
const MAX_TOTAL_FILE_SIZE = 25 * 1024 * 1024;
const MAX_REQUEST_SIZE = 27 * 1024 * 1024;
const STORAGE_BUCKET = "complaint-evidence";

const categoryCodes = [
  "maltrato_animal",
  "criaderos_clandestinos",
  "fauna_silvestre",
  "infrastructure",
  "public_services",
  "environment",
  "community_safety",
  "administrative_irregularities",
  "municipal",
  "other",
] as const;

const complaintSchema = z
  .object({
    province: z.string().trim().regex(/^\d{1,3}$/),
    canton: z.string().trim().regex(/^\d{1,5}$/),
    district: z.string().trim().regex(/^\d{1,7}$/),
    locality: z.string().trim().max(160).optional().default(""),
    category: z.enum(categoryCodes),
    title: z.string().trim().min(8).max(180),
    description: z.string().trim().min(40).max(8_000),
    occurredOn: z
      .string()
      .trim()
      .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value))
      .optional()
      .default(""),
    approximateLocation: z.string().trim().max(240).optional().default(""),
    truth: z.literal("on"),
    privacy: z.literal("on"),
    urgentNotice: z.literal("on"),
    turnstileToken: z.string().min(1).max(2_048),
  })
  .strict();

const scalarFields = [
  "province",
  "canton",
  "district",
  "locality",
  "category",
  "title",
  "description",
  "occurredOn",
  "approximateLocation",
  "truth",
  "privacy",
  "urgentNotice",
] as const;
const allowedFormFields = new Set<string>([
  ...scalarFields,
  "evidence",
  "cf-turnstile-response",
]);

function jsonError(error: string, status: number, requestId: string) {
  return NextResponse.json(
    { error, requestId },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function cleanPlainText(value: string): string {
  return value
    .normalize("NFC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/\r\n?/g, "\n");
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", toArrayBuffer(bytes));
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function POST(request: Request) {
  const requestId = request.headers.get("cf-ray") ?? crypto.randomUUID();
  if (env.COMPLAINT_INTAKE_ENABLED !== "true" || !isTurnstileConfigured()) {
    return jsonError(
      "La recepción de información sensible permanece desactivada.",
      503,
      requestId,
    );
  }
  if (!isSameOriginMutation(request)) {
    return jsonError("Solicitud no autorizada.", 403, requestId);
  }
  if (!hasContentType(request, "multipart/form-data")) {
    return jsonError("El formato de la solicitud no es válido.", 415, requestId);
  }

  const user = await getCurrentUser();
  if (!user) return jsonError("Debes iniciar sesión.", 401, requestId);

  const rateLimit = await checkRateLimit(request, {
    operation: "complaint.create",
    userId: user.id,
    limit: 3,
    windowSeconds: 60 * 60,
  });
  if (!rateLimit.configured) {
    return jsonError("El control de seguridad no está disponible.", 503, requestId);
  }
  if (!rateLimit.allowed) {
    await recordAuditEvent({
      actorId: user.id,
      action: "complaint.create",
      resourceType: "complaint",
      outcome: "denied",
      requestId,
      metadata: { reason: "rate_limited" },
      requestHeaders: request.headers,
    });
    return jsonError("Has realizado demasiados intentos. Intenta más tarde.", 429, requestId);
  }

  let form: FormData;
  try {
    const bytes = await readRequestWithLimit(request, MAX_REQUEST_SIZE);
    const boundedRequest = new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: toArrayBuffer(bytes),
    });
    form = await boundedRequest.formData();
  } catch (error) {
    return jsonError(
      error instanceof RequestBodyTooLargeError
        ? "La solicitud supera el límite permitido."
        : "No fue posible leer el formulario.",
      error instanceof RequestBodyTooLargeError ? 413 : 400,
      requestId,
    );
  }

  for (const key of form.keys()) {
    if (!allowedFormFields.has(key)) {
      return jsonError("El formulario contiene campos no permitidos.", 400, requestId);
    }
  }

  const raw: Record<string, string> = {};
  for (const field of scalarFields) {
    const values = form.getAll(field);
    if (values.length > 1 || values.some((value) => typeof value !== "string")) {
      return jsonError("El formulario contiene campos duplicados.", 400, requestId);
    }
    raw[field] = typeof values[0] === "string" ? values[0] : "";
  }
  const turnstileValues = form.getAll("cf-turnstile-response");
  if (turnstileValues.length !== 1 || typeof turnstileValues[0] !== "string") {
    return jsonError("Completa la verificación de seguridad.", 400, requestId);
  }

  const parsed = complaintSchema.safeParse({
    ...raw,
    turnstileToken: turnstileValues[0],
  });
  if (!parsed.success) {
    return jsonError("Revisa los campos obligatorios y sus límites.", 400, requestId);
  }
  if (!(await verifyTurnstile(parsed.data.turnstileToken, request, "complaint_submit"))) {
    return jsonError("No fue posible verificar que eres una persona.", 403, requestId);
  }

  const files = form
    .getAll("evidence")
    .filter((value): value is File => value instanceof File && value.size > 0);
  if (
    files.length > MAX_FILES ||
    files.some((file) => file.size > MAX_FILE_SIZE) ||
    files.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_FILE_SIZE
  ) {
    return jsonError("Los archivos superan los límites permitidos.", 400, requestId);
  }

  const supabase = await createSupabaseServerClient();

  const [categoryResult, provinceResult, cantonResult, districtResult] = await Promise.all([
    supabase.from("complaint_categories").select("code").eq("code", parsed.data.category).eq("is_active", true).maybeSingle(),
    supabase.from("provinces").select("code").eq("code", parsed.data.province).eq("is_active", true).maybeSingle(),
    supabase.from("cantons").select("code").eq("code", parsed.data.canton).eq("province_code", parsed.data.province).eq("is_active", true).maybeSingle(),
    supabase.from("districts").select("code").eq("code", parsed.data.district).eq("canton_code", parsed.data.canton).eq("is_active", true).maybeSingle(),
  ]);

  if (categoryResult.error || provinceResult.error || cantonResult.error || districtResult.error) {
    return jsonError("El catálogo territorial no está disponible.", 503, requestId);
  }
  if (!categoryResult.data || !provinceResult.data || !cantonResult.data || !districtResult.data) {
    return jsonError("Selecciona una ubicación y categoría válidas.", 400, requestId);
  }

  let complaintId: string | null = null;
  const storedPaths: string[] = [];
  try {
    const encryptedPayload = await encryptSensitiveJson(
      {
        title: cleanPlainText(parsed.data.title),
        description: cleanPlainText(parsed.data.description),
        locality: cleanPlainText(parsed.data.locality),
        approximateLocation: cleanPlainText(parsed.data.approximateLocation),
        occurredOn: parsed.data.occurredOn || null,
      },
      "complaint-payload",
    );
    const inserted = await supabase.rpc("create_complaint", {
      p_category_code: parsed.data.category,
      p_province_code: parsed.data.province,
      p_canton_code: parsed.data.canton,
      p_district_code: parsed.data.district,
      p_encrypted_payload: encryptedPayload,
      p_encryption_key_version: env.DATA_ENCRYPTION_KEY_VERSION?.trim() || "v1",
      p_payload_fingerprint: null,
      p_truth_accepted: true,
      p_privacy_accepted: true,
      p_urgent_notice_accepted: true,
    });
    const created = Array.isArray(inserted.data) ? inserted.data[0] : null;
    if (
      inserted.error ||
      !created ||
      typeof created.complaint_id !== "string" ||
      typeof created.tracking_code !== "string"
    ) {
      throw new Error("complaint_insert_failed");
    }
    complaintId = created.complaint_id;

    // Prioridad 2: Subida y registro en paralelo (Batch / Promesas concurrentes)
    const admin = createSupabaseAdminClient();
    const evidenceRows = await Promise.all(
      files.map(async (file) => {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const detectedType = detectAllowedFileType(bytes);
        if (!detectedType || !fileMatchesType(file, detectedType)) {
          throw new Error("file_type_rejected");
        }

        const storagePath = `${user.id}/${complaintId}/${crypto.randomUUID()}.${extensionForType(detectedType)}`;
        const upload = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, bytes, {
          cacheControl: "0",
          contentType: detectedType,
          upsert: false,
        });
        if (upload.error) throw new Error("file_upload_failed");
        storedPaths.push(storagePath);

        const encryptedFilename = await encryptSensitiveJson(
          { filename: safeAttachmentName(file.name) },
          "complaint-filename",
        );
        const fileSha256 = await sha256(bytes);

        return {
          p_complaint_id: complaintId,
          p_uploaded_by_profile_id: user.id,
          p_storage_object_path: storagePath,
          p_encrypted_original_filename: encryptedFilename,
          p_filename_encryption_key_version: env.DATA_ENCRYPTION_KEY_VERSION?.trim() || "v1",
          p_detected_mime_type: detectedType,
          p_size_bytes: file.size,
          p_sha256: fileSha256,
        };
      })
    );

    await Promise.all(
      evidenceRows.map(async (row) => {
        const evidence = await admin.rpc("register_complaint_evidence", row);
        if (evidence.error) throw new Error("evidence_insert_failed");
      })
    );

    // Prioridad 3: Auditoría asíncrona (No bloquea la respuesta)
    void recordAuditEvent({
      actorId: user.id,
      action: "complaint.create",
      resourceType: "complaint",
      resourceId: complaintId,
      outcome: "success",
      requestId,
      metadata: { evidence_count: files.length },
      requestHeaders: request.headers,
    }).catch(() => {});

    return NextResponse.json(
      { ok: true, trackingCode: created.tracking_code },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    try {
      const admin = createSupabaseAdminClient();
      if (storedPaths.length) await admin.storage.from(STORAGE_BUCKET).remove(storedPaths);
      if (complaintId) {
        await admin.from("complaints").delete().eq("id", complaintId).eq("owner_id", user.id);
      }
    } catch {
      // Cleanup failures are handled operationally by orphan reconciliation.
    }
    await recordAuditEvent({
      actorId: user.id,
      action: "complaint.create",
      resourceType: "complaint",
      resourceId: complaintId,
      outcome: "failure",
      requestId,
      metadata: {
        error_code: error instanceof Error ? error.message.slice(0, 64) : "unknown",
      },
      requestHeaders: request.headers,
    });
    return jsonError(
      "No fue posible guardar la información. No se conservaron datos parciales.",
      503,
      requestId,
    );
  }
}
