"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  MapPin,
  FileText,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Complaint {
  id: string;
  tracking_code: string;
  category_code: string;
  category_name: string;
  province_code: string;
  province_name: string;
  canton_code: string;
  canton_name: string;
  district_code: string;
  district_name: string;
  status: string;
  created_at: string;
  owner_id: string;
}

const STATUS_LABELS: Record<string, string> = {
  received: "Recibida",
  in_review: "En revisión",
  additional_information_requested: "Info. adicional",
  investigating: "Investigando",
  closed: "Cerrada",
  rejected: "Rechazada",
};

const STATUS_COLORS: Record<string, string> = {
  received: "bg-amber-100 text-amber-800",
  in_review: "bg-blue-100 text-blue-800",
  additional_information_requested: "bg-purple-100 text-purple-800",
  investigating: "bg-pink-100 text-pink-800",
  closed: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
};

const mockComplaints: Complaint[] = [
  {
    id: "1",
    tracking_code: "RW-2024-ABC123",
    category_code: "maltrato_animal",
    category_name: "Maltrato animal y crueldad",
    province_code: "SJ",
    province_name: "San José",
    canton_code: "01",
    canton_name: "San José",
    district_code: "01",
    district_name: "Carmen",
    status: "received",
    created_at: "2024-01-15T10:30:00Z",
    owner_id: "user-1",
  },
  {
    id: "2",
    tracking_code: "RW-2024-DEF456",
    category_code: "criaderos_clandestinos",
    category_name: "Criaderos clandestinos",
    province_code: "AL",
    province_name: "Alajuela",
    canton_code: "02",
    canton_name: "Alajuela",
    district_code: "03",
    district_name: "San Rafael",
    status: "in_review",
    created_at: "2024-01-14T14:20:00Z",
    owner_id: "user-2",
  },
  {
    id: "3",
    tracking_code: "RW-2024-GHI789",
    category_code: "fauna_silvestre",
    category_name: "Tráfico de fauna silvestre",
    province_code: "PU",
    province_name: "Puntarenas",
    canton_code: "01",
    canton_name: "Puntarenas",
    district_code: "02",
    district_name: "Chacarita",
    status: "closed",
    created_at: "2024-01-10T09:15:00Z",
    owner_id: "user-3",
  },
  {
    id: "4",
    tracking_code: "RW-2024-JKL012",
    category_code: "infrastructure",
    category_name: "Infraestructura comunitaria",
    province_code: "HE",
    province_name: "Heredia",
    canton_code: "01",
    canton_name: "Heredia",
    district_code: "01",
    district_name: "Heredia",
    status: "investigating",
    created_at: "2024-01-08T16:45:00Z",
    owner_id: "user-4",
  },
  {
    id: "5",
    tracking_code: "RW-2024-MNO345",
    category_code: "public_services",
    category_name: "Fallas en servicios públicos",
    province_code: "CA",
    province_name: "Cartago",
    canton_code: "02",
    canton_name: "Paraíso",
    district_code: "01",
    district_name: "Paraíso",
    status: "rejected",
    created_at: "2024-01-05T11:00:00Z",
    owner_id: "user-5",
  },
];

const mockProvinces = [
  { code: "SJ", name: "San José" },
  { code: "AL", name: "Alajuela" },
  { code: "CA", name: "Cartago" },
  { code: "HE", name: "Heredia" },
  { code: "GU", name: "Guanacaste" },
  { code: "PU", name: "Puntarenas" },
  { code: "LI", name: "Limón" },
];

const mockCategories = [
  { code: "maltrato_animal", name: "Maltrato animal y crueldad" },
  { code: "criaderos_clandestinos", name: "Criaderos clandestinos o peleas ilegales" },
  { code: "fauna_silvestre", name: "Tráfico de fauna y vida silvestre" },
  { code: "infrastructure", name: "Infraestructura comunitaria" },
  { code: "public_services", name: "Fallas graves en servicios públicos" },
  { code: "environment", name: "Daño ambiental o contaminación" },
  { code: "community_safety", name: "Seguridad comunitaria" },
  { code: "administrative_irregularities", name: "Irregularidades administrativas o corrupción" },
  { code: "municipal", name: "Gestión municipal y presupuestaria" },
  { code: "other", name: "Otra situación (especificar)" },
];

export function AdminComplaintsTable() {
  const [complaints, setComplaints] = useState<Complaint[]>(mockComplaints);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>(mockComplaints);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [cantonFilter, setCantonFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({ key: "created_at", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtrar y ordenar
  useEffect(() => {
    let result = [...complaints];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.tracking_code.toLowerCase().includes(term) ||
          c.category_name.toLowerCase().includes(term) ||
          c.province_name.toLowerCase().includes(term) ||
          c.canton_name.toLowerCase().includes(term) ||
          c.district_name.toLowerCase().includes(term)
      );
    }

    if (statusFilter) result = result.filter((c) => c.status === statusFilter);
    if (provinceFilter) result = result.filter((c) => c.province_code === provinceFilter);
    if (cantonFilter) result = result.filter((c) => c.canton_code === cantonFilter);
    if (districtFilter) result = result.filter((c) => c.district_code === districtFilter);
    if (categoryFilter) result = result.filter((c) => c.category_code === categoryFilter);

    // Ordenar
    result.sort((a, b) => {
      const aVal = a[sortConfig.key as keyof Complaint];
      const bVal = b[sortConfig.key as keyof Complaint];
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredComplaints(result);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, provinceFilter, cantonFilter, districtFilter, categoryFilter, sortConfig, complaints]);

  // Paginación
  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);
  const paginatedComplaints = filteredComplaints.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setProvinceFilter("");
    setCantonFilter("");
    setDistrictFilter("");
    setCategoryFilter("");
  };

  const hasActiveFilters = searchTerm || statusFilter || provinceFilter || cantonFilter || districtFilter || categoryFilter;

  // Render complaint rows
  const renderComplaintRows = () => {
    if (paginatedComplaints.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={8} className="text-center py-8 text-[#556377]">
            No se encontraron denuncias con los filtros actuales
          </TableCell>
        </TableRow>
      );
    }

    return paginatedComplaints.map((complaint) => (
      <TableRow key={complaint.id}>
        <TableCell className="font-mono font-semibold text-[#142235]">
          {complaint.tracking_code}
        </TableCell>
        <TableCell>{complaint.category_name}</TableCell>
        <TableCell>{complaint.province_name}</TableCell>
        <TableCell>{complaint.canton_name}</TableCell>
        <TableCell>{complaint.district_name}</TableCell>
        <TableCell>
          <Badge className={STATUS_COLORS[complaint.status] || "bg-gray-100 text-gray-800"}>
            {STATUS_LABELS[complaint.status] || complaint.status}
          </Badge>
        </TableCell>
        <TableCell className="text-sm text-[#556377]">
          {new Date(complaint.created_at).toLocaleDateString("es-CR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="rounded-2xl border border-[#ded8ce] bg-white shadow-sm">
      <div className="p-6 border-b border-[#ded8ce]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-black text-[#142235]">Denuncias Registradas</h3>
            <p className="text-sm text-[#556377]">
              {filteredComplaints.length} de {complaints.length} denuncias
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="gap-2">
                <Filter className="h-4 w-4" /> Limpiar filtros
              </Button>
            )}
            <Button className="gap-2" onClick={() => window.open("/admin/export", "_blank")}>
              <Download className="h-4 w-4" /> Exportar Excel
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
            <Input
              placeholder="Buscar por código, categoría, ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los estados</SelectItem>
              <SelectItem value="received">Recibida</SelectItem>
              <SelectItem value="in_review">En revisión</SelectItem>
              <SelectItem value="additional_information_requested">Info. adicional</SelectItem>
              <SelectItem value="investigating">Investigando</SelectItem>
              <SelectItem value="closed">Cerrada</SelectItem>
              <SelectItem value="rejected">Rechazada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={provinceFilter} onValueChange={setProvinceFilter}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Provincia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas las provincias</SelectItem>
              {mockProvinces.map((p) => (
                <SelectItem key={p.code} value={p.code}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={cantonFilter} onValueChange={setCantonFilter}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Cantón" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los cantones</SelectItem>
              <SelectItem value="01">San José</SelectItem>
              <SelectItem value="02">Alajuela</SelectItem>
            </SelectContent>
          </Select>
          <Select value={districtFilter} onValueChange={setDistrictFilter}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Distrito" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los distritos</SelectItem>
              <SelectItem value="01">Centro</SelectItem>
              <SelectItem value="02">Norte</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas las categorías</SelectItem>
              {mockCategories.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {[
                { key: "tracking_code", label: "Código" },
                { key: "category_name", label: "Categoría" },
                { key: "province_name", label: "Provincia" },
                { key: "canton_name", label: "Cantón" },
                { key: "district_name", label: "Distrito" },
                { key: "status", label: "Estado" },
                { key: "created_at", label: "Fecha" },
              ].map((col) => (
                <TableHead
                  key={col.key}
                  className="cursor-pointer hover:bg-[#f5f1ea]"
                  onClick={() => handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortConfig.key === col.key && (
                      sortConfig.direction === "asc" ? (
                        <ChevronUp className="h-4 w-4 text-[#d84d3d]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#d84d3d]" />
                      )
                    )}
                  </div>
                </TableHead>
              ))}
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderComplaintRows()}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={8} className="text-right py-4">
                <span className="text-sm text-[#556377]">
                  Total: {filteredComplaints.length} denuncias
                </span>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-[#ded8ce] flex items-center justify-between">
          <p className="text-sm text-[#556377]">
            Página {currentPage} de {totalPages} • {filteredComplaints.length} resultados
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}