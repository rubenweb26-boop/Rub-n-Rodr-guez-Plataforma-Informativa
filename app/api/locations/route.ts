import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const querySchema = z
  .object({
    province: z.string().regex(/^\d{1,3}$/).optional(),
    canton: z.string().regex(/^\d{1,5}$/).optional(),
  })
  .strict()
  .refine(({ province, canton }) => !(province && canton));

function response(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": status === 200 ? "public, max-age=300" : "no-store",
    },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const unknownParameters = [...url.searchParams.keys()].filter(
    (key) => key !== "province" && key !== "canton",
  );
  if (unknownParameters.length) return response({ items: [], error: "Consulta inválida." }, 400);

  const parsed = querySchema.safeParse({
    province: url.searchParams.get("province") ?? undefined,
    canton: url.searchParams.get("canton") ?? undefined,
  });
  if (!parsed.success) return response({ items: [], error: "Consulta inválida." }, 400);

  const rateLimit = await checkRateLimit(request, {
    operation: "locations.read",
    limit: 120,
    windowSeconds: 60,
  });
  if (!rateLimit.configured) {
    return response({ items: [], error: "Catálogo no disponible." }, 503);
  }
  if (!rateLimit.allowed) {
    return response({ items: [], error: "Demasiadas solicitudes." }, 429);
  }

  try {
    const supabase = await createSupabaseServerClient();
    if (parsed.data.canton) {
      const { data, error } = await supabase
        .from("districts")
        .select("code,name")
        .eq("canton_code", parsed.data.canton)
        .eq("is_active", true)
        .order("name")
        .limit(500);
      if (error) throw error;
      return response({ items: data });
    }
    if (parsed.data.province) {
      const { data, error } = await supabase
        .from("cantons")
        .select("code,name")
        .eq("province_code", parsed.data.province)
        .eq("is_active", true)
        .order("name")
        .limit(100);
      if (error) throw error;
      return response({ items: data });
    }

    const { data, error } = await supabase
      .from("provinces")
      .select("code,name")
      .eq("is_active", true)
      .order("name")
      .limit(20);
    if (error) throw error;
    return response({ items: data });
  } catch {
    return response(
      {
        items: [],
        error: "El catálogo territorial no está disponible en este momento.",
      },
      503,
    );
  }
}
