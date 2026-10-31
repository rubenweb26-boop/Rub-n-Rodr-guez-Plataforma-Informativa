"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, FileUp, LoaderCircle, LockKeyhole } from "lucide-react";

type LocationItem = { code: string; name: string };

export function ComplaintForm({ enabled }: { enabled: boolean }) {
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [cantons, setCantons] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [province, setProvince] = useState("");
  const [canton, setCanton] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok?: boolean; message: string } | null>(null);

  useEffect(() => { void loadLocations("/api/locations").then(setProvinces); }, []);

  function handleProvinceChange(newProvince: string) {
    setProvince(newProvince);
    setCanton("");
    setCantons([]);
    setDistricts([]);
    if (newProvince) {
      void loadLocations(`/api/locations?province=${encodeURIComponent(newProvince)}`).then(setCantons);
    }
  }

  function handleCantonChange(newCanton: string) {
    setCanton(newCanton);
    setDistricts([]);
    if (newCanton) {
      void loadLocations(`/api/locations?canton=${encodeURIComponent(newCanton)}`).then(setDistricts);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled) return;
    setBusy(true); setResult(null);
    const form = event.currentTarget;
    try {
      const response = await fetch("/api/complaints", { method: "POST", body: new FormData(form) });
      const payload = await response.json() as { error?: string; trackingCode?: string };
      if (!response.ok) throw new Error(payload.error || "No fue posible enviar la información.");
      setResult({ ok: true, message: `Información recibida. Código de seguimiento: ${payload.trackingCode}` });
      form.reset(); setProvince(""); setCanton(""); setDistricts([]);
    } catch (error) {
      setResult({ message: error instanceof Error ? error.message : "Ocurrió un error." });
    } finally { setBusy(false); }
  }

  const catalogReady = provinces.length > 0;
  return (
    <form onSubmit={submit} className="surface p-6 sm:p-8" noValidate>
      <div className="mb-7 flex items-start gap-4 rounded-2xl bg-[#eef4ff] p-4">
        <LockKeyhole className="mt-0.5 shrink-0 text-[#0759e6]" size={21} />
        <div><h2 className="m-0 text-base font-black">Privado por defecto</h2><p className="mb-0 mt-1 text-sm leading-5 text-[#5e6c82]">La información enviada no se publica automáticamente. Los adjuntos permanecen en cuarentena hasta revisión y análisis antimalware.</p></div>
      </div>

      <fieldset className="grid gap-5" disabled={busy}>
        <legend className="mb-5 text-xl font-black">Ubicación y categoría</legend>
        <div className="grid gap-5 md:grid-cols-3">
          <label className="field-label">Provincia<select required name="province" value={province} onChange={(e)=>handleProvinceChange(e.target.value)} className="field-control"><option value="">{catalogReady ? "Selecciona" : "Catálogo oficial pendiente"}</option>{provinces.map(i=><option key={i.code} value={i.code}>{i.name}</option>)}</select></label>
          <label className="field-label">Cantón<select required name="canton" value={canton} onChange={(e)=>handleCantonChange(e.target.value)} className="field-control" disabled={!province}><option value="">Selecciona</option>{cantons.map(i=><option key={i.code} value={i.code}>{i.name}</option>)}</select></label>
          <label className="field-label">Distrito<select required name="district" className="field-control" disabled={!canton}><option value="">Selecciona</option>{districts.map(i=><option key={i.code} value={i.code}>{i.name}</option>)}</select></label>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="field-label">Localidad o comunidad <span className="field-help">Opcional; evita direcciones exactas de personas.</span><input name="locality" maxLength={160} className="field-control" /></label>
          <label className="field-label">Categoría<select required name="category" className="field-control"><option value="">Selecciona</option><option value="infrastructure">Infraestructura pública</option><option value="public_services">Servicios públicos</option><option value="environment">Medioambiente</option><option value="community_safety">Seguridad comunitaria</option><option value="administrative_irregularities">Posibles irregularidades administrativas</option><option value="municipal">Problemas municipales</option><option value="other">Otros asuntos de interés público</option></select></label>
        </div>

        <div className="my-2 h-px bg-[#e0e7f1]" />
        <legend className="text-xl font-black">Descripción del hecho</legend>
        <label className="field-label">Título<input required name="title" minLength={8} maxLength={180} className="field-control" placeholder="Resume el asunto sin incluir nombres sensibles" /></label>
        <label className="field-label">Descripción detallada <span className="field-help">Explica qué ocurrió, cómo lo conociste y qué puede verificarse. No publiques datos privados innecesarios.</span><textarea required name="description" minLength={40} maxLength={8000} className="field-control" /></label>
        <div className="grid gap-5 md:grid-cols-2"><label className="field-label">Fecha del hecho<input type="date" name="occurredOn" className="field-control" /></label><label className="field-label">Ubicación aproximada<input name="approximateLocation" maxLength={240} className="field-control" placeholder="Barrio, vía o punto de referencia" /></label></div>

        <label className="field-label rounded-2xl border border-dashed border-[#a9bddd] bg-[#f7faff] p-5"><span className="flex items-center gap-2"><FileUp size={19} className="text-[#0759e6]" /> Evidencia opcional</span><span className="field-help">Hasta 4 archivos; JPG, PNG, PDF, MP4 o WebM. Máximo 12 MB por archivo y 25 MB en total.</span><input type="file" name="evidence" multiple accept="image/jpeg,image/png,application/pdf,video/mp4,video/webm" className="mt-2 text-sm" /></label>

        <div className="grid gap-3 rounded-2xl bg-[#f6f8fb] p-5 text-sm leading-5 text-[#4f5d72]">
          <label className="flex gap-3"><input required type="checkbox" name="truth" className="mt-1" /> Declaro que envío esta información de buena fe y que no la alteré deliberadamente.</label>
          <label className="flex gap-3"><input required type="checkbox" name="privacy" className="mt-1" /> Acepto el tratamiento privado necesario para revisar y dar seguimiento al caso.</label>
          <label className="flex gap-3"><input required type="checkbox" name="urgentNotice" className="mt-1" /> Comprendo que este canal no sustituye al 9-1-1 ni una denuncia ante autoridades.</label>
        </div>
      </fieldset>

      {!enabled && <div className="mt-5 flex gap-3 rounded-xl border border-[#f0d99e] bg-[#fff9e9] p-4 text-sm leading-5 text-[#6d5313]"><AlertTriangle className="shrink-0" size={19}/><span><strong>Recepción desactivada:</strong> falta aprobar la política legal, autorizar un catálogo territorial apto para publicación y conectar análisis antimalware.</span></div>}
      {result && <div role="status" className={`mt-5 flex gap-3 rounded-xl p-4 text-sm ${result.ok ? "bg-[#e8f7f1] text-[#087f5b]" : "bg-[#fff0ef] text-[#a2342a]"}`}>{result.ok ? <CheckCircle2 size={19}/> : <AlertTriangle size={19}/>}<span>{result.message}</span></div>}
      <button type="submit" disabled={!enabled || !catalogReady || busy} className="btn-primary mt-6 w-full sm:w-auto">{busy ? <><LoaderCircle className="animate-spin" size={18}/> Enviando…</> : enabled ? "Enviar información de forma privada" : "Envío pendiente de habilitación"}</button>
    </form>
  );
}

async function loadLocations(url: string): Promise<LocationItem[]> {
  try { const response = await fetch(url); if (!response.ok) return []; const data = await response.json() as { items?: LocationItem[] }; return data.items ?? []; } catch { return []; }
}
