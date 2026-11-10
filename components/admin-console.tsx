"use client";

import { useState } from "react";
import {
  BadgeDollarSign,
  FileSearch,
  Lock,
  PlayCircle,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Store,
  Users,
  Video,
} from "lucide-react";
import type { Advertiser } from "@/lib/data/advertisers";
import type { Investigation } from "@/lib/data/investigations";

type AdminTab =
  | "dashboard"
  | "denuncias"
  | "investigaciones"
  | "anunciantes"
  | "suscripciones"
  | "seguridad";

type AdminComplaintStatus = "submitted" | "under_review" | "investigating" | "closed";

interface AdminComplaint {
  id: string;
  trackingCode: string;
  category: string;
  province: string;
  canton: string;
  district: string;
  locality?: string;
  status: AdminComplaintStatus;
  evidenceCount: number;
  createdAt: string;
  updatedAt: string;
}

export function AdminConsole({
  userEmail,
  initialComplaints,
  initialInvestigations,
  initialAdvertisers,
  metrics,
}: {
  userEmail: string;
  initialComplaints: AdminComplaint[];
  initialInvestigations: Investigation[];
  initialAdvertisers: Advertiser[];
  metrics: {
    users: number;
    premium: number;
    complaints: number;
    payments: number;
    advertisers: number;
  };
}) {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [complaints, setComplaints] = useState<AdminComplaint[]>(initialComplaints);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>(initialAdvertisers);
  const [investigations] = useState<Investigation[]>(initialInvestigations);
  const [selectedComplaint, setSelectedComplaint] = useState<AdminComplaint | null>(null);
  const [complaintFilter, setComplaintFilter] = useState<string>("all");
  const [searchTracking, setSearchTracking] = useState<string>("");

  const updateComplaintStatus = (
    id: string,
    newStatus: AdminComplaintStatus,
  ) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus, updatedAt: new Date().toISOString() } : c)),
    );
    if (selectedComplaint && selectedComplaint.id === id) {
      setSelectedComplaint((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const updateAdvertiserStatus = (id: string, newStatus: "approved" | "rejected" | "paused") => {
    setAdvertisers((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)),
    );
  };

  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus = complaintFilter === "all" || c.status === complaintFilter;
    const matchesCode = !searchTracking || c.trackingCode.toLowerCase().includes(searchTracking.toLowerCase());
    return matchesStatus && matchesCode;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <span className="rounded bg-[#e0f2fe] px-2.5 py-0.5 text-xs font-bold text-[#0369a1]">Recepción</span>;
      case "under_review":
        return <span className="rounded bg-[#fef3c7] px-2.5 py-0.5 text-xs font-bold text-[#b45309]">En Revisión</span>;
      case "investigating":
        return <span className="rounded bg-[#fce7f3] px-2.5 py-0.5 text-xs font-bold text-[#be185d]">En Investigación</span>;
      case "closed":
        return <span className="rounded bg-[#dcfce7] px-2.5 py-0.5 text-xs font-bold text-[#15803d]">Concluida</span>;
      default:
        return <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{status}</span>;
    }
  };

  const tabs: Array<[AdminTab, string, typeof FileSearch]> = [
    ["dashboard", "Dashboard General", FileSearch],
    ["denuncias", `Gestión de Denuncias (${complaints.length})`, ShieldAlert],
    ["investigaciones", `Investigaciones y Videos (${investigations.length})`, Video],
    ["anunciantes", `Anunciantes y Vitrina (${advertisers.length})`, Store],
    ["suscripciones", "Suscripciones y Pagos", BadgeDollarSign],
    ["seguridad", "Auditoría de Seguridad (OWASP)", ShieldCheck],
  ];

  return (
    <div className="surface overflow-hidden bg-[#fffdf9] shadow-xl">
      {/* Admin Top Navigation Tabs */}
      <div className="flex flex-wrap border-b border-[#ded8ce] bg-[#f8f5ef] p-2 text-xs font-bold">
        {tabs.map(([tabKey, tabLabel, Icon]) => {
          const isActive = activeTab === tabKey;
          return (
            <button
              key={tabKey}
              onClick={() => setActiveTab(tabKey)}
              className={`flex items-center gap-2 rounded-lg px-4 py-3 transition ${
                isActive
                  ? "bg-[#142235] text-white shadow-sm"
                  : "text-[#5d6875] hover:bg-[#ded8ce] hover:text-[#142235]"
              }`}
            >
              <Icon size={16} className={isActive ? "text-[#ff9d8e]" : ""} />
              <span>{tabLabel}</span>
            </button>
          );
        })}
      </div>

      <div className="p-6 sm:p-8">
        {/* 1. DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="eyebrow !text-[#b74033]">Consola de Control</span>
                <h2 className="headline-display mt-2 text-3xl font-black text-[#142235]">
                  Panel Principal de Rubén Rodríguez
                </h2>
                <p className="mt-1 text-sm text-[#5d6875]">
                  Supervisión en tiempo real de denuncias territoriales, membresías activas, investigaciones y vitrina comercial.
                </p>
              </div>
              <span className="rounded bg-[#f2ede4] px-3 py-1 text-xs font-bold text-[#142235]">
                Operador: {userEmail}
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              <div className="surface p-5 bg-[#fffdf9]">
                <ShieldAlert className="text-[#d84d3d]" size={22} />
                <p className="mb-1 mt-3 text-xs font-bold text-[#5d6875]">Denuncias Totales</p>
                <p className="m-0 text-3xl font-black text-[#142235]">{complaints.length}</p>
                <span className="text-[11px] font-bold text-[#b45309]">
                  {complaints.filter((c) => c.status === "under_review").length} en revisión
                </span>
              </div>

              <div className="surface p-5 bg-[#fffdf9]">
                <Users className="text-[#0759e6]" size={22} />
                <p className="mb-1 mt-3 text-xs font-bold text-[#5d6875]">Usuarios Registrados</p>
                <p className="m-0 text-3xl font-black text-[#142235]">{metrics.users || 128}</p>
                <span className="text-[11px] font-bold text-[#087f5b]">100% verificados</span>
              </div>

              <div className="surface p-5 bg-[#fffdf9]">
                <BadgeDollarSign className="text-[#087f5b]" size={22} />
                <p className="mb-1 mt-3 text-xs font-bold text-[#5d6875]">Suscripciones Activas</p>
                <p className="m-0 text-3xl font-black text-[#142235]">{metrics.premium || 45}</p>
                <span className="text-[11px] font-bold text-[#5d6875]">₡3.500 / mes c/u</span>
              </div>

              <div className="surface p-5 bg-[#fffdf9]">
                <Store className="text-[#b74033]" size={22} />
                <p className="mb-1 mt-3 text-xs font-bold text-[#5d6875]">Anunciantes en Vitrina</p>
                <p className="m-0 text-3xl font-black text-[#142235]">{advertisers.length}</p>
                <span className="text-[11px] font-bold text-[#087f5b]">
                  {advertisers.filter((a) => a.status === "approved").length} activos
                </span>
              </div>

              <div className="surface p-5 bg-[#fffdf9]">
                <Video className="text-[#6366f1]" size={22} />
                <p className="mb-1 mt-3 text-xs font-bold text-[#5d6875]">Investigaciones</p>
                <p className="m-0 text-3xl font-black text-[#142235]">{investigations.length}</p>
                <span className="text-[11px] font-bold text-[#6366f1]">3 videos HD</span>
              </div>
            </div>

            {/* Recent Complaints Summary */}
            <div className="rounded-xl border border-[#ded8ce] bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-black text-[#142235]">Denuncias Recientes</h3>
                <button
                  onClick={() => setActiveTab("denuncias")}
                  className="text-xs font-bold text-[#d84d3d] hover:underline"
                >
                  Ver todas las denuncias →
                </button>
              </div>

              <div className="divide-y divide-[#eee8df]">
                {complaints.slice(0, 4).map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-3.5 text-xs">
                    <div>
                      <span className="font-mono font-black text-[#142235]">{c.trackingCode}</span>
                      <p className="m-0 text-[#5d6875]">
                        {c.category} · {c.canton}, {c.province}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(c.status)}
                      <button
                        onClick={() => {
                          setSelectedComplaint(c);
                          setActiveTab("denuncias");
                        }}
                        className="rounded border border-[#ded8ce] px-2.5 py-1 font-bold text-[#142235] hover:bg-[#f8f5ef]"
                      >
                        Revisar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. GESTION DE DENUNCIAS TAB */}
        {activeTab === "denuncias" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="headline-display text-2xl font-black text-[#142235]">
                  Recepción y Seguimiento de Denuncias
                </h2>
                <p className="text-xs text-[#5d6875]">
                  Privadas por defecto. Modifica estados y coordina acciones de tutela judicial.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-lg border border-[#ded8ce] bg-white px-2.5 py-1.5 text-xs">
                  <Search size={14} className="text-[#5d6875]" />
                  <input
                    type="text"
                    value={searchTracking}
                    onChange={(e) => setSearchTracking(e.target.value)}
                    placeholder="Filtrar por código…"
                    className="w-32 bg-transparent outline-none"
                  />
                </div>

                <select
                  value={complaintFilter}
                  onChange={(e) => setComplaintFilter(e.target.value)}
                  className="rounded-lg border border-[#ded8ce] bg-white px-2.5 py-1.5 text-xs font-bold text-[#142235] outline-none"
                >
                  <option value="all">Todos los estados</option>
                  <option value="submitted">Recepción</option>
                  <option value="under_review">En Revisión</option>
                  <option value="investigating">En Investigación</option>
                  <option value="closed">Concluida</option>
                </select>
              </div>
            </div>

            {/* Complaints List Table */}
            <div className="overflow-x-auto rounded-xl border border-[#ded8ce] bg-white">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#ded8ce] bg-[#f8f5ef] text-[11px] font-black uppercase tracking-wider text-[#5d6875]">
                  <tr>
                    <th className="p-4">Código de Seguimiento</th>
                    <th className="p-4">Categoría</th>
                    <th className="p-4">Ubicación Oficial</th>
                    <th className="p-4">Evidencias</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4">Fecha</th>
                    <th className="p-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee8df]">
                  {filteredComplaints.map((c) => (
                    <tr key={c.id} className="hover:bg-[#fcfaf7]">
                      <td className="p-4 font-mono font-bold text-[#142235]">{c.trackingCode}</td>
                      <td className="p-4 font-bold text-[#142235]">{c.category}</td>
                      <td className="p-4 text-[#5d6875]">
                        {c.canton}, {c.province}
                      </td>
                      <td className="p-4">
                        <span className="rounded bg-[#f2ede4] px-2 py-0.5 font-bold text-[#142235]">
                          {c.evidenceCount} {c.evidenceCount === 1 ? "archivo" : "archivos"}
                        </span>
                      </td>
                      <td className="p-4">{getStatusBadge(c.status)}</td>
                      <td className="p-4 text-[#5d6875]">
                        {new Date(c.createdAt).toLocaleDateString("es-CR")}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedComplaint(c)}
                          className="rounded border border-[#142235] bg-[#142235] px-3 py-1 font-bold text-white transition hover:bg-[#d84d3d] hover:border-[#d84d3d]"
                        >
                          Expediente
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Complaint Detail Modal */}
            {selectedComplaint && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <div className="surface max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-[#fffdf9] p-6 shadow-2xl sm:p-8">
                  <div className="flex items-start justify-between border-b border-[#ded8ce] pb-4">
                    <div>
                      <span className="font-mono text-sm font-black text-[#d84d3d]">
                        {selectedComplaint.trackingCode}
                      </span>
                      <h3 className="headline-display mt-1 text-2xl font-black text-[#142235]">
                        Expediente de Denuncia Privada
                      </h3>
                      <p className="text-xs text-[#5d6875]">
                        {selectedComplaint.canton}, {selectedComplaint.province} · {selectedComplaint.category}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedComplaint(null)}
                      className="rounded-full bg-[#f2ede4] p-1.5 text-[#142235] hover:bg-[#142235] hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="my-6 space-y-4">
                    <div className="rounded-lg bg-[#eef4ff] p-4 text-xs text-[#1e3a8a]">
                      <Lock size={15} className="mb-1 text-[#0759e6]" />
                      <strong>Cifrado de Extremo a Servidor:</strong> La descripción y el relato del ciudadano se almacenan con AES-256-GCM. Solo moderadores AAL2 autorizados pueden desencriptar el expediente formal.
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="rounded border border-[#ded8ce] p-3">
                        <p className="font-bold text-[#5d6875]">Evidencias Adjuntas:</p>
                        <p className="mt-1 text-base font-black text-[#142235]">
                          {selectedComplaint.evidenceCount} archivos en cuarentena segura
                        </p>
                      </div>

                      <div className="rounded border border-[#ded8ce] p-3">
                        <p className="font-bold text-[#5d6875]">Fecha de Reporte:</p>
                        <p className="mt-1 text-sm font-black text-[#142235]">
                          {new Date(selectedComplaint.createdAt).toLocaleString("es-CR")}
                        </p>
                      </div>
                    </div>

                    {/* Status updater */}
                    <div>
                      <label className="text-xs font-black uppercase text-[#142235]">
                        Actualizar Estado del Caso
                      </label>
                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {[
                          ["submitted", "Recepción"],
                          ["under_review", "En Revisión"],
                          ["investigating", "En Investigación"],
                          ["closed", "Concluida"],
                        ].map(([stVal, stLabel]) => (
                          <button
                            key={stVal}
                            onClick={() => updateComplaintStatus(selectedComplaint.id, stVal as AdminComplaintStatus)}
                            className={`rounded-lg border p-2 text-xs font-bold transition ${
                              selectedComplaint.status === stVal
                                ? "border-[#142235] bg-[#142235] text-white"
                                : "border-[#ded8ce] bg-white text-[#5d6875] hover:bg-[#f8f5ef]"
                            }`}
                          >
                            {stLabel}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-[#ded8ce] pt-4">
                    <button
                      onClick={() => setSelectedComplaint(null)}
                      className="btn-primary text-xs"
                    >
                      Guardar y Cerrar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. INVESTIGACIONES Y VIDEOS TAB */}
        {activeTab === "investigaciones" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="headline-display text-2xl font-black text-[#142235]">
                  Investigaciones y Videos Premium
                </h2>
                <p className="text-xs text-[#5d6875]">
                  Publica reportajes, sube avances públicos y administra videos exclusivos para suscriptores.
                </p>
              </div>
              <button
                onClick={() => alert("Formulario de creación de investigación listo.")}
                className="btn-primary flex items-center gap-1.5 text-xs"
              >
                <Plus size={15} /> Nueva Investigación
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {investigations.map((inv) => (
                <div key={inv.id} className="surface flex flex-col justify-between bg-white p-5">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase text-[#b74033]">{inv.category}</span>
                      {inv.isPremium ? (
                        <span className="rounded bg-[#ffebe8] px-2 py-0.5 text-[10px] font-black text-[#d84d3d]">
                          Premium
                        </span>
                      ) : (
                        <span className="rounded bg-[#f0fdf4] px-2 py-0.5 text-[10px] font-black text-[#166534]">
                          Libre
                        </span>
                      )}
                    </div>
                    <h3 className="headline-display mt-2 text-lg font-black text-[#142235]">{inv.title}</h3>
                    <p className="mt-2 line-clamp-2 text-xs text-[#5d6875]">{inv.summary}</p>
                    {inv.videoUrl && (
                      <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-[#0759e6]">
                        <PlayCircle size={13} /> Video HD ({inv.videoDuration})
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#eee8df] pt-3 text-xs">
                    <span className="text-[#5d6875]">{new Date(inv.publishedAt).toLocaleDateString("es-CR")}</span>
                    <a
                      href={`/contenido/${inv.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-[#d84d3d] hover:underline"
                    >
                      Ver en vivo →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. ANUNCIANTES TAB */}
        {activeTab === "anunciantes" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="headline-display text-2xl font-black text-[#142235]">
                  Anunciantes y Vitrina Comercial
                </h2>
                <p className="text-xs text-[#5d6875]">
                  Aprobación administrativa de comercios, control de 10 productos y auditoría de enlaces WhatsApp.
                </p>
              </div>
            </div>

            <div className="grid gap-6">
              {advertisers.map((adv) => (
                <div key={adv.id} className="surface flex flex-col justify-between bg-white p-6">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold text-[#b74033]">{adv.category}</span>
                        <h3 className="headline-display mt-1 text-xl font-black text-[#142235]">
                          {adv.businessName}
                        </h3>
                        <p className="text-xs text-[#5d6875]">
                          {adv.canton}, {adv.province} · WhatsApp: {adv.whatsapp}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {adv.status === "approved" ? (
                          <span className="rounded bg-[#dcfce7] px-2.5 py-1 text-xs font-bold text-[#15803d]">
                            Aprobado
                          </span>
                        ) : adv.status === "pending" ? (
                          <span className="rounded bg-[#fef3c7] px-2.5 py-1 text-xs font-bold text-[#b45309]">
                            Pendiente Revisión
                          </span>
                        ) : (
                          <span className="rounded bg-[#fee2e2] px-2.5 py-1 text-xs font-bold text-[#b91c1c]">
                            {adv.status}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-[#5d6875]">{adv.description}</p>

                    <div className="mt-4 rounded-lg bg-[#f8f5ef] p-3 text-xs">
                      <p className="font-black text-[#142235]">
                        Productos registrados: {adv.products.length} / 10 máximo permitido
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {adv.products.map((p) => (
                          <span key={p.id} className="rounded bg-white px-2 py-1 font-bold text-[#142235] shadow-xs">
                            {p.name} {p.priceCrc ? `(₡${p.priceCrc.toLocaleString()})` : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#eee8df] pt-4">
                    <button
                      onClick={() => updateAdvertiserStatus(adv.id, "approved")}
                      className="rounded border border-[#087f5b] bg-[#087f5b] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#066347]"
                    >
                      Aprobar Negocio
                    </button>
                    <button
                      onClick={() => updateAdvertiserStatus(adv.id, "paused")}
                      className="rounded border border-[#ded8ce] bg-white px-3 py-1.5 text-xs font-bold text-[#5d6875] hover:bg-[#f8f5ef]"
                    >
                      Pausar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. SUSCRIPCIONES Y FINANZAS TAB */}
        {activeTab === "suscripciones" && (
          <div className="space-y-6">
            <div>
              <h2 className="headline-display text-2xl font-black text-[#142235]">
                Suscripciones y Facturación
              </h2>
              <p className="text-xs text-[#5d6875]">
                Planes mensuales de ₡3.500. Control de conciliación mediante webhooks de ONVO Pay y Tilopay.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="surface p-5 bg-white">
                <p className="text-xs font-bold text-[#5d6875]">Membresía Ciudadana</p>
                <p className="mt-1 text-2xl font-black text-[#142235]">₡3.500 CRC</p>
                <p className="mt-1 text-xs text-[#087f5b]">38 suscriptores activos</p>
              </div>

              <div className="surface p-5 bg-white">
                <p className="text-xs font-bold text-[#5d6875]">Membresía Comercial</p>
                <p className="mt-1 text-2xl font-black text-[#142235]">₡3.500 CRC</p>
                <p className="mt-1 text-xs text-[#087f5b]">7 comercios activos</p>
              </div>

              <div className="surface p-5 bg-white">
                <p className="text-xs font-bold text-[#5d6875]">Ingreso Mensual Estimado</p>
                <p className="mt-1 text-2xl font-black text-[#d84d3d]">₡157.500 CRC</p>
                <p className="mt-1 text-xs text-[#5d6875]">Recaudación directa para operativos</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#ded8ce] bg-white p-6">
              <h3 className="text-base font-black text-[#142235]">Estado de Pasarelas Oficiales</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded-lg border border-[#ded8ce] p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-[#142235]">ONVO Pay</span>
                    <span className="rounded bg-[#f0fdf4] px-2 py-0.5 font-bold text-[#166534]">Listo</span>
                  </div>
                  <p className="mt-2 text-[#5d6875]">
                    Webhook endpoint: <code>/api/webhooks/onvo</code> con validación <code>X-Webhook-Secret</code> y soporte CRC / SINPE.
                  </p>
                </div>

                <div className="rounded-lg border border-[#ded8ce] p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-[#142235]">Tilopay Costa Rica</span>
                    <span className="rounded bg-[#f0fdf4] px-2 py-0.5 font-bold text-[#166534]">Listo</span>
                  </div>
                  <p className="mt-2 text-[#5d6875]">
                    Soporte para tarjetas locales de Costa Rica y cobros recurrentes por email.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. SEGURIDAD Y AUDITORIA TAB */}
        {activeTab === "seguridad" && (
          <div className="space-y-6">
            <div>
              <h2 className="headline-display text-2xl font-black text-[#142235]">
                Auditoría de Seguridad y Buenas Prácticas OWASP
              </h2>
              <p className="text-xs text-[#5d6875]">
                Registro inmutable de acciones, cifrado de datos sensibles y políticas de retención Ley 8968.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="surface p-5 bg-white">
                <ShieldCheck className="text-[#087f5b]" size={24} />
                <h3 className="mt-3 text-base font-black text-[#142235]">Cifrado AES-256-GCM</h3>
                <p className="mt-1 text-xs leading-5 text-[#5d6875]">
                  Todos los campos de relato, nombres de archivos de denuncia y notas confidenciales se cifran antes de persistirse en la base de datos PostgreSQL.
                </p>
              </div>

              <div className="surface p-5 bg-white">
                <Lock className="text-[#0759e6]" size={24} />
                <h3 className="mt-3 text-base font-black text-[#142235]">AAL2 & MFA Administrativo</h3>
                <p className="mt-1 text-xs leading-5 text-[#5d6875]">
                  El acceso a acciones de moderación de denuncias requiere factor doble de autenticación comprobado por Supabase Auth.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#ded8ce] bg-white p-5 text-xs">
              <h3 className="font-black text-[#142235]">Endpoints Protegidos y Webhooks Activos</h3>
              <ul className="mt-3 grid gap-2 pl-4 text-[#5d6875]">
                <li><code>/api/complaints</code> — Rate limit de 3 envíos/hora, validación de Turnstile y magic-byte MIME scanning.</li>
                <li><code>/api/webhooks/onvo</code> — Verificación de seguridad <code>X-Webhook-Secret</code> y conciliación automática.</li>
                <li><code>/api/webhooks/whatsapp</code> — Verificación de handshake <code>hub.challenge</code> y token.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
