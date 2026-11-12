import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser("/admin/export");
    const admin = createSupabaseAdminClient();

    // Verificar permisos de admin
    const { data: profileRoles } = await admin
      .from("profile_roles")
      .select("role_key")
      .eq("profile_id", user.id);

    const isAdmin = profileRoles?.some((r) => r.role_key === "admin") ?? false;
    const isSuperAdmin = profileRoles?.some((r) => r.role_key === "super_admin") ?? false;

    if (!isAdmin && !isSuperAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Obtener todas las denuncias con relaciones
    const { data: complaints, error } = await admin
      .from("complaints")
      .select(`
        id,
        tracking_code,
        category_code,
        province_code,
        canton_code,
        district_code,
        status,
        created_at,
        owner_id,
        complaint_categories!inner(name),
        provinces!inner(name),
        cantons!inner(name),
        districts!inner(name)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Obtener datos de evidencia para cada denuncia
    const { data: evidence } = await admin
      .from("complaint_evidence")
      .select("complaint_id, detected_mime_type, size_bytes, sha256")
      .eq("scan_status", "clean");

    const evidenceMap = new Map();
    evidence?.forEach((e) => {
      if (!evidenceMap.has(e.complaint_id)) evidenceMap.set(e.complaint_id, []);
      evidenceMap.get(e.complaint_id).push(e);
    });

    // Preparar datos para la hoja principal
    const mainSheetData = (complaints || []).map((c: any, index: number) => {
      const evidences = evidenceMap.get(c.id) || [];
      return {
        "N°": index + 1,
        "Código de Seguimiento": c.tracking_code,
        "Categoría": c.complaint_categories?.name || c.category_code,
        "Provincia": c.provinces?.name || c.province_code,
        "Cantón": c.cantons?.name || c.canton_code,
        "Distrito": c.districts?.name || c.district_code,
        "Estado": {
          received: "Recibida",
          in_review: "En revisión",
          additional_information_requested: "Información adicional solicitada",
          investigating: "En investigación",
          closed: "Cerrada",
          rejected: "Rechazada",
        }[c.status] || c.status,
        "Fecha de Creación": new Date(c.created_at).toLocaleDateString("es-CR"),
        "Hora de Creación": new Date(c.created_at).toLocaleTimeString("es-CR"),
        "ID Usuario": c.owner_id,
        "Evidencias Adjuntas": evidences.length,
        "Tipos de Evidencia": evidences.map((e: any) => e.detected_mime_type).join(", "),
        "Total Tamaño Evidencias (MB)": (evidences.reduce((sum: number, e: any) => sum + e.size_bytes, 0) / 1024 / 1024).toFixed(2),
      };
    });

    // Hoja de estadísticas por provincia
    const provinceStats = new Map();
    complaints?.forEach((c: any) => {
      const province = c.provinces?.name || c.province_code;
      if (!provinceStats.has(province)) provinceStats.set(province, { total: 0, byStatus: new Map() });
      const stat = provinceStats.get(province);
      stat.total++;
      stat.byStatus.set(c.status, (stat.byStatus.get(c.status) || 0) + 1);
    });

    const provinceSheetData = Array.from(provinceStats.entries()).map(([province, data]) => ({
      Provincia: province,
      "Total Denuncias": data.total,
      Recibidas: data.byStatus.get("received") || 0,
      "En Revisión": data.byStatus.get("in_review") || 0,
      "Info. Adicional": data.byStatus.get("additional_information_requested") || 0,
      Investigando: data.byStatus.get("investigating") || 0,
      Cerradas: data.byStatus.get("closed") || 0,
      Rechazadas: data.byStatus.get("rejected") || 0,
    }));

    // Hoja de estadísticas por categoría
    const categoryStats = new Map();
    complaints?.forEach((c: any) => {
      const category = c.complaint_categories?.name || c.category_code;
      if (!categoryStats.has(category)) categoryStats.set(category, { total: 0, byStatus: new Map() });
      const stat = categoryStats.get(category);
      stat.total++;
      stat.byStatus.set(c.status, (stat.byStatus.get(c.status) || 0) + 1);
    });

    const categorySheetData = Array.from(categoryStats.entries()).map(([category, data]) => ({
      Categoría: category,
      "Total Denuncias": data.total,
      Recibidas: data.byStatus.get("received") || 0,
      "En Revisión": data.byStatus.get("in_review") || 0,
      "Info. Adicional": data.byStatus.get("additional_information_requested") || 0,
      Investigando: data.byStatus.get("investigating") || 0,
      Cerradas: data.byStatus.get("closed") || 0,
      Rechazadas: data.byStatus.get("rejected") || 0,
    }));

    // Hoja de estadísticas por estado
    const statusStats = new Map();
    complaints?.forEach((c: any) => {
      const status = c.status;
      if (!statusStats.has(status)) statusStats.set(status, 0);
      statusStats.set(status, statusStats.get(status) + 1);
    });

    const statusLabels: Record<string, string> = {
      received: "Recibida",
      in_review: "En revisión",
      additional_information_requested: "Información adicional solicitada",
      investigating: "En investigación",
      closed: "Cerrada",
      rejected: "Rechazada",
    };

    const statusSheetData = Array.from(statusStats.entries()).map(([status, count]) => ({
      Estado: statusLabels[status] || status,
      Cantidad: count,
      "Porcentaje (%)": ((count / (complaints?.length || 1)) * 100).toFixed(1),
    }));

    // Hoja de tendencia mensual
    const monthlyStats = new Map();
    complaints?.forEach((c: any) => {
      const date = new Date(c.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyStats.has(monthKey)) monthlyStats.set(monthKey, 0);
      monthlyStats.set(monthKey, monthlyStats.get(monthKey) + 1);
    });

    const monthlySheetData = Array.from(monthlyStats.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        Mes: month,
        Denuncias: count,
      }));

    // Crear workbook
    const wb = XLSX.utils.book_new();

    // Hoja principal
    const mainSheet = XLSX.utils.json_to_sheet(mainSheetData);
    XLSX.utils.book_append_sheet(wb, mainSheet, "Denuncias Completas");

    // Hoja por provincia
    const provinceSheet = XLSX.utils.json_to_sheet(provinceSheetData);
    XLSX.utils.book_append_sheet(wb, provinceSheet, "Por Provincia");

    // Hoja por categoría
    const categorySheet = XLSX.utils.json_to_sheet(categorySheetData);
    XLSX.utils.book_append_sheet(wb, categorySheet, "Por Categoría");

    // Hoja por estado
    const statusSheet = XLSX.utils.json_to_sheet(statusSheetData);
    XLSX.utils.book_append_sheet(wb, statusSheet, "Por Estado");

    // Hoja mensual
    const monthlySheet = XLSX.utils.json_to_sheet(monthlySheetData);
    XLSX.utils.book_append_sheet(wb, monthlySheet, "Tendencia Mensual");

    // Aplicar estilos
    const styleHeader = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
      fill: { fgColor: { rgb: "D84D3D" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };

    const styleCell = {
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "CCCCCC" } },
        bottom: { style: "thin", color: { rgb: "CCCCCC" } },
        left: { style: "thin", color: { rgb: "CCCCCC" } },
        right: { style: "thin", color: { rgb: "CCCCCC" } },
      },
    };

    // Aplicar estilos a todas las hojas
    [mainSheet, provinceSheet, categorySheet, statusSheet, monthlySheet].forEach((sheet) => {
      const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (!sheet[cellRef]) continue;
          if (R === 0) {
            sheet[cellRef].s = styleHeader;
          } else {
            sheet[cellRef].s = styleCell;
          }
        }
      }
      // Ajustar ancho de columnas
      const cols = [];
      for (let C = range.s.c; C <= range.e.c; C++) {
        let maxWidth = 15;
        for (let R = range.s.r; R <= range.e.r; R++) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (sheet[cellRef]?.v) {
            maxWidth = Math.max(maxWidth, String(sheet[cellRef].v).length + 5);
          }
        }
        cols.push({ wch: Math.min(maxWidth, 50) });
      }
      sheet["!cols"] = cols;
    });

    // Generar buffer
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="denuncias-ruben-rodriguez-${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Error exporting Excel:", error);
    return NextResponse.json({ error: "Error al generar el archivo Excel" }, { status: 500 });
  }
}