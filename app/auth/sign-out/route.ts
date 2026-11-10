import { NextResponse, type NextRequest } from "next/server";
import { safeReturnPath } from "@/lib/auth/paths";
import {
  hasContentType,
  isSameOriginMutation,
  readRequestWithLimit,
} from "@/lib/security/origin";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const MAX_SIGN_OUT_BYTES = 1024;

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

export async function POST(request: NextRequest) {
  if (
    !isSameOriginMutation(request) ||
    !hasContentType(request, "application/x-www-form-urlencoded")
  ) {
    return Response.json({ error: "Solicitud no autorizada." }, { status: 403 });
  }

  let form: FormData;
  try {
    const bytes = await readRequestWithLimit(request, MAX_SIGN_OUT_BYTES);
    form = await new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: toArrayBuffer(bytes),
    }).formData();
  } catch {
    return Response.json({ error: "Solicitud no válida." }, { status: 400 });
  }
  const returnTo = safeReturnPath(
    typeof form.get("return_to") === "string" ? String(form.get("return_to")) : "/",
  );

  if (!getSupabasePublicConfig()) {
    return NextResponse.redirect(new URL(returnTo, request.url), 303);
  }

  const routeClient = createSupabaseRouteClient(request);
  await routeClient.client.auth.signOut({ scope: "local" });
  return routeClient.applyCookies(
    NextResponse.redirect(new URL(returnTo, request.url), 303),
  );
}
