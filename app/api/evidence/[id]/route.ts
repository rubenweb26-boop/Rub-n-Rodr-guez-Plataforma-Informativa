import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/user";
import { recordAuditEvent } from "@/lib/security/audit";
import { decryptSensitiveJson } from "@/lib/security/crypto";
import { safeAttachmentName } from "@/lib/security/files";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Debes iniciar sesión.", 401);

  const parsedId = idSchema.safeParse((await params).id);
  if (!parsedId.success) return jsonError("Archivo no encontrado.", 404);

  const rateLimit = await checkRateLimit(request, {
    operation: "evidence.download",
    userId: user.id,
    limit: 20,
    windowSeconds: 60,
  });
  if (!rateLimit.configured) return jsonError("Control de acceso no disponible.", 503);
  if (!rateLimit.allowed) return jsonError("Demasiadas solicitudes.", 429);

  const admin = createSupabaseAdminClient();
  const { data: evidence, error } = await admin
    .from("complaint_evidence")
    .select(
      "id,bucket_id,storage_object_path,encrypted_original_filename,scan_status,removed_at",
    )
    .eq("id", parsedId.data)
    .limit(1)
    .maybeSingle();
  if (error || !evidence) return jsonError("Archivo no encontrado.", 404);

  const supabase = await createSupabaseServerClient();
  const { data: authorized, error: authorizationError } = await supabase.rpc(
    "can_read_complaint_object",
    {
      p_bucket_id: evidence.bucket_id,
      p_object_name: evidence.storage_object_path,
    },
  );
  if (authorizationError || authorized !== true) {
    await recordAuditEvent({
      actorId: user.id,
      action: "evidence.download",
      resourceType: "complaint_evidence",
      resourceId: parsedId.data,
      outcome: "denied",
      requestHeaders: request.headers,
    });
    return jsonError("Archivo no encontrado.", 404);
  }

  let filename = "evidencia";
  if (typeof evidence.encrypted_original_filename === "string") {
    try {
      const decrypted = await decryptSensitiveJson<{ filename?: string }>(
        evidence.encrypted_original_filename,
        "complaint-filename",
      );
      if (decrypted.filename) filename = safeAttachmentName(decrypted.filename);
    } catch {
      await recordAuditEvent({
        actorId: user.id,
        action: "evidence.download",
        resourceType: "complaint_evidence",
        resourceId: parsedId.data,
        outcome: "failure",
        requestHeaders: request.headers,
        metadata: { reason: "filename_decrypt_failed" },
      });
      return jsonError("Archivo no disponible.", 503);
    }
  }

  const auditOk = await recordAuditEvent({
    actorId: user.id,
    action: "evidence.download",
    resourceType: "complaint_evidence",
    resourceId: parsedId.data,
    outcome: "success",
    requestHeaders: request.headers,
  });
  if (!auditOk) return jsonError("No fue posible registrar el acceso.", 503);

  const { data: signed, error: signedError } = await admin.storage
    .from(evidence.bucket_id)
    .createSignedUrl(evidence.storage_object_path, 60, { download: filename });
  if (signedError || !signed?.signedUrl) {
    return jsonError("No fue posible preparar la descarga.", 503);
  }

  return NextResponse.redirect(signed.signedUrl, {
    status: 303,
    headers: {
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
