import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { isSameOriginMutation, hasContentType, readRequestWithLimit } from "@/lib/security/origin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isSameOriginMutation(request) || !hasContentType(request, "application/x-www-form-urlencoded")) return Response.json({ error: "Solicitud no autorizada" }, { status: 403 });
  if (!getSupabasePublicConfig()) return NextResponse.redirect(new URL("/mi-cuenta/eliminar?error=service", request.url), 303);
  let form: FormData;
  try {
    const bytes = await readRequestWithLimit(request, 2048);
    const body = new Uint8Array(bytes.byteLength); body.set(bytes);
    form = await new Request(request.url, { method: "POST", headers: request.headers, body: body.buffer }).formData();
  } catch { return Response.json({ error: "Solicitud inválida" }, { status: 400 }); }
  const client = createSupabaseRouteClient(request);
  const { data: { user }, error: authError } = await client.client.auth.getUser();
  if (authError || !user?.email || form.get("confirm") !== "yes" || String(form.get("email") || "").trim().toLowerCase() !== user.email.toLowerCase()) return NextResponse.redirect(new URL("/mi-cuenta/eliminar?error=confirm", request.url), 303);
  const { error } = await client.client.rpc("delete_empty_account");
  if (error) return NextResponse.redirect(new URL(`/mi-cuenta/eliminar?error=${error.message.includes("account_has_records") ? "records" : "service"}`, request.url), 303);
  await client.client.auth.signOut({ scope: "local" });
  return client.applyCookies(NextResponse.redirect(new URL("/", request.url), 303));
}
