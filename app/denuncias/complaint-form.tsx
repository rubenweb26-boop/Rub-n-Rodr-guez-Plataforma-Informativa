"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  FileUp,
  FolderOpen,
  Image as ImageIcon,
  LoaderCircle,
  MapPin,
  Send,
  Video,
  X,
} from "lucide-react";
import { TurnstileWidget } from "@/components/turnstile-widget";

type LocationItem = { code: string; name: string };

const CATEGORIES = [
  { value: "maltrato_animal", label: "Maltrato animal y crueldad" },
  { value: "criaderos_clandestinos", label: "Criaderos clandestinos o peleas ilegales" },
  { value: "fauna_silvestre", label: "Tráfico de fauna y vida silvestre" },
  { value: "infrastructure", label: "Infraestructura comunitaria" },
  { value: "public_services", label: "Fallas graves en servicios públicos" },
  { value: "environment", label: "Daño ambiental o contaminación" },
  { value: "community_safety", label: "Seguridad comunitaria" },
  { value: "administrative_irregularities", label: "Irregularidades administrativas o corrupción" },
  { value: "municipal", label: "Gestión municipal y presupuestaria" },
  { value: "other", label: "Otra situación (especificar)" },
];

export function ComplaintForm({
  enabled,
  turnstileSiteKey,
}: {
  enabled: boolean;
  turnstileSiteKey: string | null;
}) {
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [cantons, setCantons] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [province, setProvince] = useState("");
  const [canton, setCanton] = useState("");
  const [district, setDistrict] = useState("");

  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  const [selectedFiles, setSelectedFiles] = useState<{ file: File; previewUrl: string; type: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok?: boolean; message: string; trackingCode?: string } | null>(null);

  useEffect(() => {
    fetch("/api/locations")
      .then((res) => res.json())
      .then((data) => setProvinces(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  function handleProvinceChange(newProvince: string) {
    setProvince(newProvince);
    setCanton("");
    setDistrict("");
    setCantons([]);
    setDistricts([]);
    if (newProvince) {
      fetch(`/api/locations?province=${encodeURIComponent(newProvince)}`)
        .then((res) => res.json())
        .then((data) => setCantons(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }

  function handleCantonChange(newCanton: string) {
    setCanton(newCanton);
    setDistrict("");
    setDistricts([]);
    if (newCanton) {
      fetch(`/api/locations?canton=${encodeURIComponent(newCanton)}`)
        .then((res) => res.json())
        .then((data) => setDistricts(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }

  function handleFileSelection(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const newFiles: { file: File; previewUrl: string; type: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      if (selectedFiles.length + newFiles.length >= 4) break;
      const file = files[i];
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
      newFiles.push({ file, previewUrl, type: file.type });
    }
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => {
      const updated = [...prev];
      if (updated[index].previewUrl) URL.revokeObjectURL(updated[index].previewUrl);
      updated.splice(index, 1);
      return updated;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled) return;

    setBusy(true);
    setResult(null);

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);

    // Overwrite evidence with user curated files
    formData.delete("evidence");
    selectedFiles.forEach((item) => {
      formData.append("evidence", item.file);
    });

    try {
      const response = await fetch("/api/complaints", { method: "POST", body: formData });
      const payload = (await response.json()) as { error?: string; trackingCode?: string };

      if (!response.ok) {
        throw new Error(payload.error || "No fue posible registrar la denuncia. Revisa los datos.");
      }

      setResult({
        ok: true,
        message: "Tu reporte fue recibido e ingresado al sistema con éxito.",
        trackingCode: payload.trackingCode,
      });

      formElement.reset();
      setProvince("");
      setCanton("");
      setDistrict("");
      setCategory("");
      setCustomCategory("");
      setSelectedFiles([]);
    } catch (err) {
      setResult({
        ok: false,
        message: err instanceof Error ? err.message : "Error inesperado al enviar.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-[#ded8ce] bg-[#fffdf9] p-6 shadow-xl sm:p-10">
      {/* Result notification */}
      {result && (
        <div
          className={`mb-8 rounded-2xl p-6 ${
            result.ok
              ? "border border-emerald-500/30 bg-emerald-50 text-emerald-950"
              : "border border-rose-500/30 bg-rose-50 text-rose-950"
          }`}
        >
          <div className="flex items-start gap-3">
            {result.ok ? (
              <CheckCircle2 className="mt-0.5 text-emerald-600 shrink-0" size={24} />
            ) : (
              <AlertCircle className="mt-0.5 text-rose-600 shrink-0" size={24} />
            )}
            <div>
              <h3 className="font-black text-lg">{result.ok ? "Denuncia Registrada" : "Atención"}</h3>
              <p className="mt-1 text-sm font-medium">{result.message}</p>
              {result.trackingCode && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="rounded-lg bg-emerald-800 px-3 py-1.5 font-mono text-sm font-black text-white">
                    Código: {result.trackingCode}
                  </span>
                  <Link
                    href="/mi-cuenta"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-800/20 bg-white px-3 py-1.5 text-xs font-bold text-emerald-900 hover:bg-emerald-100/50"
                  >
                    <FolderOpen size={14} /> Consultar mis casos
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        {/* Paso 1: Ubicación Territorial */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-[#d84d3d] text-xs font-black text-white">
              1
            </span>
            <h2 className="text-xl font-black text-[#142235]">Ubicación del Hecho</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#556377]">
                Provincia *
              </label>
              <select
                required
                name="province"
                value={province}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#d6cfc5] bg-white px-3.5 py-3 text-sm font-semibold text-[#142235] focus:border-[#d84d3d] focus:outline-none focus:ring-2 focus:ring-[#d84d3d]/20"
              >
                <option value="">Selecciona Provincia</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#556377]">
                Cantón *
              </label>
              <select
                required
                name="canton"
                value={canton}
                disabled={!province}
                onChange={(e) => handleCantonChange(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#d6cfc5] bg-white px-3.5 py-3 text-sm font-semibold text-[#142235] disabled:bg-slate-100 disabled:opacity-60 focus:border-[#d84d3d] focus:outline-none focus:ring-2 focus:ring-[#d84d3d]/20"
              >
                <option value="">Selecciona Cantón</option>
                {cantons.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#556377]">
                Distrito *
              </label>
              <select
                required
                name="district"
                value={district}
                disabled={!canton}
                onChange={(e) => setDistrict(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#d6cfc5] bg-white px-3.5 py-3 text-sm font-semibold text-[#142235] disabled:bg-slate-100 disabled:opacity-60 focus:border-[#d84d3d] focus:outline-none focus:ring-2 focus:ring-[#d84d3d]/20"
              >
                <option value="">Selecciona Distrito</option>
                {districts.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#556377]">
                Barrio, Caserío o Localidad
              </label>
              <input
                type="text"
                name="locality"
                maxLength={160}
                placeholder="Ej: Barrio San José, 200m este de la escuela"
                className="mt-1.5 w-full rounded-xl border border-[#d6cfc5] bg-white px-3.5 py-3 text-sm font-semibold text-[#142235] focus:border-[#d84d3d] focus:outline-none focus:ring-2 focus:ring-[#d84d3d]/20"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#556377]">
                Punto de Referencia Exacto
              </label>
              <input
                type="text"
                name="approximateLocation"
                maxLength={240}
                placeholder="Ej: Portón negro, frente al taller mecánico"
                className="mt-1.5 w-full rounded-xl border border-[#d6cfc5] bg-white px-3.5 py-3 text-sm font-semibold text-[#142235] focus:border-[#d84d3d] focus:outline-none focus:ring-2 focus:ring-[#d84d3d]/20"
              />
            </div>
          </div>
        </section>

        <div className="h-px bg-[#ded8ce]" />

        {/* Paso 2: Categoría y Hechos */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-[#d84d3d] text-xs font-black text-white">
              2
            </span>
            <h2 className="text-xl font-black text-[#142235]">Categoría y Fecha</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#556377]">
                Tipo de Situación *
              </label>
              <select
                required
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#d6cfc5] bg-white px-3.5 py-3 text-sm font-semibold text-[#142235] focus:border-[#d84d3d] focus:outline-none focus:ring-2 focus:ring-[#d84d3d]/20"
              >
                <option value="">Selecciona Categoría</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#556377]">
                Fecha Aproximada del Hecho
              </label>
              <input
                type="date"
                name="occurredOn"
                className="mt-1.5 w-full rounded-xl border border-[#d6cfc5] bg-white px-3.5 py-3 text-sm font-semibold text-[#142235] focus:border-[#d84d3d] focus:outline-none focus:ring-2 focus:ring-[#d84d3d]/20"
              />
            </div>
          </div>

          {/* Campo adicional si eligen "Otra" */}
          {category === "other" && (
            <div className="mt-4 animate-in fade-in">
              <label className="text-xs font-bold uppercase tracking-wider text-[#b74033]">
                Especifica la categoría
              </label>
              <input
                type="text"
                placeholder="Describe brevemente de qué se trata el tipo de hecho..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#b74033]/40 bg-rose-50/30 px-3.5 py-3 text-sm font-semibold text-[#142235] focus:border-[#d84d3d] focus:outline-none focus:ring-2 focus:ring-[#d84d3d]/20"
              />
            </div>
          )}
        </section>

        <div className="h-px bg-[#ded8ce]" />

        {/* Paso 3: Detalles y Evidencias */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-[#d84d3d] text-xs font-black text-white">
              3
            </span>
            <h2 className="text-xl font-black text-[#142235]">Detalle del Caso y Pruebas</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#556377]">
                Título Breve del Caso *
              </label>
              <input
                required
                name="title"
                minLength={8}
                maxLength={180}
                placeholder="Ej: Criadero clandestino con animales en abandono y maltrato"
                className="mt-1.5 w-full rounded-xl border border-[#d6cfc5] bg-white px-3.5 py-3 text-sm font-semibold text-[#142235] focus:border-[#d84d3d] focus:outline-none focus:ring-2 focus:ring-[#d84d3d]/20"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#556377]">
                Descripción Detallada *
              </label>
              <textarea
                required
                name="description"
                rows={5}
                minLength={40}
                maxLength={8000}
                placeholder="Explica qué está sucediendo, cantidad aproximada de animales o personas involucradas, horarios y cualquier detalle que facilite la verificación y acción en el terreno..."
                className="mt-1.5 w-full rounded-xl border border-[#d6cfc5] bg-white p-4 text-sm font-semibold text-[#142235] focus:border-[#d84d3d] focus:outline-none focus:ring-2 focus:ring-[#d84d3d]/20"
              />
            </div>

            {/* Carga de Evidencia con Previsualización */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#556377]">
                Adjuntar Evidencias (Fotos, Videos, Documentos)
              </label>
              
              <div className="mt-2 rounded-2xl border-2 border-dashed border-[#d6cfc5] bg-[#fbf9f5] p-6 text-center transition hover:border-[#d84d3d]">
                <FileUp className="mx-auto text-[#d84d3d]" size={32} />
                <p className="mt-2 text-sm font-bold text-[#142235]">
                  Haz clic para seleccionar o arrastra tus archivos aquí
                </p>
                <p className="mt-1 text-xs text-[#6e7b8f]">
                  Hasta 4 archivos (JPG, PNG, PDF, MP4). Máximo 12 MB por archivo.
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,application/pdf,video/mp4,video/webm"
                  onChange={handleFileSelection}
                  className="mt-3 cursor-pointer text-xs"
                />
              </div>

              {/* Previsualización de archivos seleccionados */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {selectedFiles.map((item, idx) => (
                    <div
                      key={idx}
                      className="group relative flex flex-col items-center rounded-xl border border-[#ded8ce] bg-white p-2 shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-rose-600 text-white shadow hover:bg-rose-700"
                        title="Eliminar archivo"
                      >
                        <X size={14} />
                      </button>

                      {item.previewUrl ? (
                        <img
                          src={item.previewUrl}
                          alt="Previsualización"
                          className="h-20 w-full rounded-lg object-cover"
                        />
                      ) : item.type.includes("video") ? (
                        <div className="flex h-20 w-full items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <Video size={28} />
                        </div>
                      ) : (
                        <div className="flex h-20 w-full items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <FileText size={28} />
                        </div>
                      )}

                      <span className="mt-2 w-full truncate text-center text-[10px] font-bold text-[#556377]">
                        {item.file.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Declaración y Seguridad */}
        <div className="rounded-2xl bg-[#f5f1ea] p-5 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer text-xs font-semibold text-[#455263]">
            <input required type="checkbox" name="truth" className="mt-0.5 size-4 rounded text-[#d84d3d]" />
            <span>
              Declaro que la información aportada es verídica y de buena fe, conforme a los{" "}
              <Link href="/terminos" target="_blank" className="text-[#d84d3d] underline font-bold">
                Términos y Condiciones
              </Link>.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer text-xs font-semibold text-[#455263]">
            <input required type="checkbox" name="privacy" className="mt-0.5 size-4 rounded text-[#d84d3d]" />
            <span>
              Autorizo el tratamiento confidencial de mis datos conforme a la Ley N° 8968 y la{" "}
              <Link href="/privacidad" target="_blank" className="text-[#d84d3d] underline font-bold">
                Política de Privacidad
              </Link>.
            </span>
          </label>
        </div>

        {turnstileSiteKey && <TurnstileWidget siteKey={turnstileSiteKey} action="complaint_submit" />}

        {/* Botones de acción */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4">
          <button
            type="submit"
            disabled={busy || !enabled}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#d84d3d] px-8 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-[#b74033] disabled:opacity-50 cursor-pointer"
          >
            {busy ? (
              <>
                <LoaderCircle className="animate-spin" size={18} />
                <span>Enviando reporte...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Enviar denuncia</span>
              </>
            )}
          </button>

          <Link
            href="/mi-cuenta"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#ded8ce] bg-white px-6 py-3.5 text-xs font-black text-[#142235] hover:bg-[#f5f1ea] transition"
          >
            <FolderOpen size={16} /> Consultar mis casos
          </Link>
        </div>
      </form>
    </div>
  );
}
