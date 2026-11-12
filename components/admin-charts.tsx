"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { MapPin, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";

const COLORS = {
  received: "#f59e0b",
  in_review: "#3b82f6",
  additional_information_requested: "#8b5cf6",
  investigating: "#ec4899",
  closed: "#10b981",
  rejected: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  received: "Recibida",
  in_review: "En revisión",
  additional_information_requested: "Info. adicional",
  investigating: "Investigando",
  closed: "Cerrada",
  rejected: "Rechazada",
};

const CATEGORY_LABELS: Record<string, string> = {
  maltrato_animal: "Maltrato animal",
  criaderos_clandestinos: "Criaderos clandestinos",
  fauna_silvestre: "Fauna silvestre",
  infrastructure: "Infraestructura",
  public_services: "Servicios públicos",
  environment: "Ambiental",
  community_safety: "Seguridad comunitaria",
  administrative_irregularities: "Irregularidades admin.",
  municipal: "Municipal",
  other: "Otro",
};

// Mock data for demonstration - in production this would come from props/server
const mockStatusData = [
  { status: "received", count: 45 },
  { status: "in_review", count: 23 },
  { status: "additional_information_requested", count: 12 },
  { status: "investigating", count: 8 },
  { status: "closed", count: 67 },
  { status: "rejected", count: 5 },
];

const mockCategoryData = [
  { category: "maltrato_animal", count: 42 },
  { category: "criaderos_clandestinos", count: 18 },
  { category: "fauna_silvestre", count: 12 },
  { category: "infrastructure", count: 25 },
  { category: "public_services", count: 15 },
  { category: "environment", count: 8 },
  { category: "community_safety", count: 10 },
  { category: "administrative_irregularities", count: 7 },
  { category: "municipal", count: 5 },
  { category: "other", count: 8 },
];

const mockProvinceData = [
  { province: "San José", count: 58 },
  { province: "Alajuela", count: 34 },
  { province: "Cartago", count: 22 },
  { province: "Heredia", count: 18 },
  { province: "Guanacaste", count: 15 },
  { province: "Puntarenas", count: 12 },
  { province: "Limón", count: 8 },
];

const mockMonthlyData = [
  { month: "Ene", count: 12 },
  { month: "Feb", count: 15 },
  { month: "Mar", count: 18 },
  { month: "Abr", count: 22 },
  { month: "May", count: 25 },
  { month: "Jun", count: 30 },
  { month: "Jul", count: 28 },
  { month: "Ago", count: 24 },
  { month: "Sep", count: 20 },
  { month: "Oct", count: 18 },
  { month: "Nov", count: 15 },
  { month: "Dic", count: 12 },
];

function ChartCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#ded8ce] bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-xl bg-[#f5f1ea] text-[#d84d3d]">
          {icon}
        </span>
        <h3 className="text-lg font-black text-[#142235]">{title}</h3>
      </div>
      <div className="h-72">{children}</div>
    </div>
  );
}

export function AdminCharts() {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-black text-[#142235]">Análisis Estadístico</h2>
      
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Denuncias por Estado - Barras */}
        <ChartCard title="Denuncias por Estado" icon={<AlertTriangle size={20} />}>
          <ChartContainer config={{
            received: { label: "Recibida", color: COLORS.received },
            in_review: { label: "En revisión", color: COLORS.in_review },
            additional_information_requested: { label: "Info. adicional", color: COLORS.additional_information_requested },
            investigating: { label: "Investigando", color: COLORS.investigating },
            closed: { label: "Cerrada", color: COLORS.closed },
            rejected: { label: "Rechazada", color: COLORS.rejected },
          }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockStatusData} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="status"
                  width={120}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => STATUS_LABELS[value] || value}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {mockStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.status as keyof typeof COLORS] || "#9ca3af"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </ChartCard>

        {/* Denuncias por Categoría - Pie */}
        <ChartCard title="Denuncias por Categoría" icon={<FileText size={20} />}>
          <ChartContainer config={Object.fromEntries(
            Object.entries(CATEGORY_LABELS).map(([key, label]) => [key, { label, color: `hsl(${Math.random() * 360}, 70%, 50%)` }])
          )}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="category"
                  label={({ category, count, percent }) => `${CATEGORY_LABELS[category] || category}: ${count} (${(percent * 100).toFixed(1)}%)`}
                  labelLine={false}
                >
                  {mockCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${index * 36}, 70%, 50%)`} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltipContent />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </ChartCard>

        {/* Denuncias por Provincia - Barras horizontales */}
        <ChartCard title="Denuncias por Provincia" icon={<MapPin size={20} />}>
          <ChartContainer config={{
            count: { label: "Denuncias", color: "#d84d3d" },
          }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockProvinceData} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="province"
                  width={100}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#d84d3d" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </ChartCard>

        {/* Tendencia Mensual - Línea */}
        <ChartCard title="Tendencia Mensual de Denuncias" icon={<FileText size={20} />}>
          <ChartContainer config={{
            count: { label: "Denuncias", color: "#d84d3d" },
          }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockMonthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#d84d3d"
                  strokeWidth={3}
                  dot={true}
                  dotStrokeWidth={3}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </ChartCard>
      </div>
    </section>
  );
}