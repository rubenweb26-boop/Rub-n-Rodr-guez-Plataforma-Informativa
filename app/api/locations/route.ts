import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { cantons, districts, provinces } from "@/db/schema";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const province = url.searchParams.get("province");
  const canton = url.searchParams.get("canton");

  try {
    const db = getDb();
    if (canton) {
      const items = await db
        .select({ code: districts.code, name: districts.name })
        .from(districts)
        .where(eq(districts.cantonCode, canton))
        .orderBy(asc(districts.name));
      if (items.length > 0) return NextResponse.json({ items });
    } else if (province) {
      const items = await db
        .select({ code: cantons.code, name: cantons.name })
        .from(cantons)
        .where(eq(cantons.provinceCode, province))
        .orderBy(asc(cantons.name));
      if (items.length > 0) return NextResponse.json({ items });
    } else {
      const items = await db
        .select({ code: provinces.code, name: provinces.name })
        .from(provinces)
        .orderBy(asc(provinces.name));
      if (items.length > 0) return NextResponse.json({ items });
    }
  } catch {
    // The catalog is intentionally unavailable until a source with publication rights is approved.
  }

  return NextResponse.json({
    items: [],
    error: "El catálogo territorial no está publicado hasta contar con una fuente autorizada para este servicio.",
  }, { status: 503 });
}
