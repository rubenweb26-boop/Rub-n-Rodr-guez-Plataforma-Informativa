import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileSpreadsheet, BarChart3, MapPin, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Exportar Datos | Panel de Administración",
};

export default function AdminExportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-[#142235]">Exportar Denuncias a Excel</h1>
        <p className="mt-1 text-sm text-[#556377]">
          Descargue reportes completos y profesionales con todas las denuncias, estadísticas y análisis
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Exportación Principal */}
        <Card className="border-2 border-[#d84d3d] bg-[#fffdf9]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#d84d3d]">
              <FileSpreadsheet className="h-6 w-6" />
              Exportación Completa (Recomendada)
            </CardTitle>
            <CardDescription>
              Archivo Excel profesional con 5 hojas: denuncias completas, por provincia, por categoría, por estado y tendencia mensual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-xl bg-white p-4 border border-[#ded8ce]">
                <h4 className="font-bold text-[#142235] mb-2">Contenido del archivo:</h4>
                <ul className="space-y-2 text-sm text-[#556377]">
                  <li className="flex items-center gap-2"><FileText className="h-4 w-4 text-[#d84d3d]" /> Hoja 1: Denuncias completas (código, categoría, ubicación, estado, fecha, evidencias)</li>
                  <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#d84d3d]" /> Hoja 2: Estadísticas por provincia (totales y por estado)</li>
                  <li className="flex items-center gap-2"><FileText className="h-4 w-4 text-[#d84d3d]" /> Hoja 3: Estadísticas por categoría (totales y por estado)</li>
                  <li className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-[#d84d3d]" /> Hoja 4: Resumen por estado (cantidades y porcentajes)</li>
                  <li className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-[#d84d3d]" /> Hoja 5: Tendencia mensual de denuncias</li>
                </ul>
              </div>
              <div className="rounded-xl bg-[#f5f1ea] p-4 border border-[#ded8ce]">
                <h4 className="font-bold text-[#142235] mb-2">Formato profesional incluido:</h4>
                <ul className="space-y-1 text-sm text-[#556377]">
                  <li>• Encabezados con estilo corporativo (fondo #D84D3D, texto blanco)</li>
                  <li>• Bordes en todas las celdas</li>
                  <li>• Ancho de columnas optimizado</li>
                  <li>• Texto centrado y ajustado</li>
                  <li>• Nombre de archivo con fecha: denuncias-ruben-rodriguez-YYYY-MM-DD.xlsx</li>
                </ul>
              </div>
              <Button
                onClick={() => window.open("/admin/export", "_blank")}
                className="w-full py-3 bg-[#d84d3d] hover:bg-[#b74033] text-white font-black text-lg shadow-lg"
              >
                <Download className="mr-2 h-5 w-5" />
                Descargar Excel Completo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Exportaciones Específicas */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#3b82f6]" />
                Por Provincia
              </CardTitle>
              <CardDescription>Estadísticas detalladas por provincia con desglose por estado</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => window.open("/admin/export?sheet=province", "_blank")}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Hoja: Por Provincia
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#8b5cf6]" />
                Por Categoría
              </CardTitle>
              <CardDescription>Estadísticas detalladas por tipo de denuncia</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => window.open("/admin/export?sheet=category", "_blank")}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Hoja: Por Categoría
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                Por Estado
              </CardTitle>
              <CardDescription>Resumen de denuncias por estado con porcentajes</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => window.open("/admin/export?sheet=status", "_blank")}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Hoja: Por Estado
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#f59e0b]" />
                Tendencia Mensual
              </CardTitle>
              <CardDescription>Evolución temporal de denuncias por mes</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => window.open("/admin/export?sheet=monthly", "_blank")}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Hoja: Tendencia Mensual
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Información adicional */}
      <Card className="border-[#ded8ce] bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#556377]" />
            Detalles Técnicos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-[#f5f1ea] p-4">
              <h4 className="font-bold text-[#142235] mb-2">Formato del Archivo</h4>
              <ul className="space-y-1 text-sm text-[#556377]">
                <li>• Formato: Excel (.xlsx) - Compatible con Excel, Google Sheets, LibreOffice</li>
                <li>• Codificación: UTF-8 (soporte completo para acentos y caracteres especiales)</li>
                <li>• Estilos: Headers corporativos, bordes, alineación centrada, ajuste de texto</li>
              </ul>
            </div>
            <div className="rounded-xl bg-[#f5f1ea] p-4">
              <h4 className="font-bold text-[#142235] mb-2">Seguridad y Acceso</h4>
              <ul className="space-y-1 text-sm text-[#556377]">
                <li>• Solo accesible para Administradores y Super Administradores</li>
                <li>• Requiere verificación Super Admin para funciones sensibles</li>
                <li>• Auditoría automática de descargas en logs del sistema</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-[#d84d3d] hover:underline">
          <FileText className="h-4 w-4" /> Volver al Dashboard
        </Link>
      </div>
    </div>
  );
}