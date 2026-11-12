import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, BarChart3, FileSpreadsheet, Inbox, LayoutDashboard, LogOut, Megaphone, MessageSquare, RefreshCw, Settings, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { api, configured, supabase, type Complaint, type Detail } from './api';

type Tab = 'dashboard' | 'denuncias' | 'informes' | 'campanas' | 'canales' | 'ia' | 'configuracion';
const tabs: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Vista general', icon: LayoutDashboard },
  { key: 'denuncias', label: 'Denuncias', icon: Inbox },
  { key: 'informes', label: 'Informes', icon: FileSpreadsheet },
  { key: 'campanas', label: 'Campañas y correos', icon: Megaphone },
  { key: 'canales', label: 'Canales sociales', icon: MessageSquare },
  { key: 'ia', label: 'Asistente IA', icon: Sparkles },
  { key: 'configuracion', label: 'Configuración', icon: Settings },
];
const statuses: Record<string, string> = { received: 'Recibida', in_review: 'En revisión', additional_information_requested: 'Información solicitada', investigating: 'Investigando', closed: 'Cerrada', rejected: 'Rechazada' };
const provinces: Record<string, string> = { '1': 'San José', '2': 'Alajuela', '3': 'Cartago', '4': 'Heredia', '5': 'Guanacaste', '6': 'Puntarenas', '7': 'Limón' };
const day = (value: string) => new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(new Date(value));

function Login({ onSession }: { onSession: (session: Session | null) => void }) {
  const [error, setError] = useState('');
  useEffect(() => { if (!supabase) return; supabase.auth.getSession().then(({ data }) => onSession(data.session)); }, [onSession]);
  async function login() {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (error) setError(error.message);
  }
  return <main className="login-screen"><div className="login-card"><div className="brand-mark">R</div><p className="eyebrow">Acceso privado</p><h1>Centro de operaciones</h1><p>Gestión de denuncias y comunicaciones de Rubén Rodríguez. Requiere una cuenta autorizada y verificación de dos pasos.</p>{configured ? <button className="primary" onClick={login}>Continuar con Google</button> : <p className="notice">Configura las variables de entorno del CRM.</p>}{error && <p className="error">{error}</p>}</div></main>;
}

function Mfa({ onReady }: { onReady: () => void }) {
  const [factor, setFactor] = useState<string | null>(null);
  const [qr, setQr] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { supabase?.auth.mfa.listFactors().then(({ data }) => setFactor(data?.totp?.find(f => f.status === 'verified')?.id || null)); }, []);
  async function enroll() {
    const { data, error } = await supabase!.auth.mfa.enroll({ factorType: 'totp' });
    if (error) return setError(error.message);
    setFactor(data.id); setQr(data.totp.qr_code);
  }
  async function verify() {
    if (!factor) return;
    const { data: challenge, error: challengeError } = await supabase!.auth.mfa.challenge({ factorId: factor });
    if (challengeError) return setError(challengeError.message);
    const { error } = await supabase!.auth.mfa.verify({ factorId: factor, challengeId: challenge.id, code });
    if (error) return setError(error.message);
    onReady();
  }
  return <main className="login-screen"><div className="login-card"><div className="brand-mark">R</div><p className="eyebrow">Segundo factor</p><h1>Verifica tu identidad</h1><p>La API privada exige un factor TOTP activo en cada sesión administrativa.</p>{!factor && <button className="primary" onClick={enroll}>Configurar autenticador</button>}{qr && <img className="qr" src={qr} alt="Código QR de configuración TOTP" />}{factor && <><label>Código de 6 dígitos<input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} /></label><button className="primary" disabled={code.length !== 6} onClick={verify}>Verificar</button></>}{error && <p className="error">{error}</p>}<button className="text-button" onClick={() => supabase?.auth.signOut().then(() => window.location.reload())}>Cerrar sesión</button></div></main>;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [aal, setAal] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [items, setItems] = useState<Complaint[]>([]);
  const [selected, setSelected] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [summary, setSummary] = useState<{ complaints: number; subscriptions: number | null }>({ complaints: 0, subscriptions: null });
  const [filters, setFilters] = useState({ province: '', canton: '', district: '', category: '', status: '', after: '', before: '' });
  const [internalNote, setInternalNote] = useState('');
  const [publicNote, setPublicNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [draft, setDraft] = useState(() => localStorage.getItem('crm_campaign_draft') || '');

  const checkAal = useCallback(async () => { if (!supabase) return; const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel(); setAal(data?.currentLevel ?? null); }, []);
  useEffect(() => { const listener = supabase?.auth.onAuthStateChange((_event, next) => { setSession(next); if (next) void checkAal(); else { setAal(null); setAuthorized(false); } }); return () => listener?.data.subscription.unsubscribe(); }, [checkAal]);
  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      await api('/api/session'); setAuthorized(true);
      const totals = await api<{ complaints: number; subscriptions: number | null }>('/api/summary');
      const loaded: Complaint[] = [];
      let cursor: string | null = null;
      do {
        const page: { items: Complaint[]; nextCursor: string | null } = await api(`/api/complaints${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`);
        loaded.push(...page.items);
        if (!page.items.length || page.nextCursor === cursor) break;
        cursor = page.nextCursor;
      } while (cursor && loaded.length < 500);
      setItems(loaded); setSummary(totals);
    } catch (err) { setAuthorized(false); setError(err instanceof Error ? err.message : 'No se pudo conectar.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (session && aal === 'aal2') void refresh(); }, [session, aal, refresh]);
  useEffect(() => { const id = setInterval(() => { if (navigator.onLine && session && aal === 'aal2') void refresh(); }, 60_000); return () => clearInterval(id); }, [session, aal, refresh]);
  const visible = useMemo(() => items.filter(item => (!filters.province || item.province_code === filters.province) && (!filters.canton || item.canton_code.includes(filters.canton)) && (!filters.district || item.district_code.includes(filters.district)) && (!filters.category || item.category_code === filters.category) && (!filters.status || item.status === filters.status) && (!filters.after || item.created_at.slice(0, 10) >= filters.after) && (!filters.before || item.created_at.slice(0, 10) <= filters.before)), [items, filters]);
  const byProvince = useMemo(() => Object.entries(provinces).map(([code, name]) => ({ name, total: items.filter(item => item.province_code === code).length })), [items]);
  async function openComplaint(item: Complaint) {
    try { setSelected(await api<Detail>(`/api/complaints/${item.id}`)); setNewStatus(item.status); setTab('denuncias'); setError(''); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo abrir.'); }
  }
  async function updateStatus() {
    if (!selected) return;
    try {
      await api(`/api/complaints/${selected.id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus, internalNote, publicNote }) });
      setSelected(await api<Detail>(`/api/complaints/${selected.id}`)); setInternalNote(''); setPublicNote(''); await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo actualizar.'); }
  }
  async function exportReport() {
    const ExcelJS = await import('exceljs');
    const book = new ExcelJS.Workbook();
    book.creator = 'Rubén Rodríguez CRM';
    const summarySheet = book.addWorksheet('Resumen');
    summarySheet.addRow(['Provincia', 'Denuncias']);
    for (const row of byProvince) summarySheet.addRow([row.name, row.total]);
    for (const [code, name] of Object.entries(provinces)) {
      const sheet = book.addWorksheet(name);
      sheet.addRow(['Código', 'Categoría', 'Cantón', 'Distrito', 'Estado', 'Fecha']);
      for (const item of visible.filter(item => item.province_code === code)) sheet.addRow([item.tracking_code, item.category_code, item.canton_code, item.district_code, statuses[item.status] || item.status, item.created_at.slice(0, 10)]);
      sheet.columns.forEach(column => { column.width = 24; });
      sheet.getRow(1).font = { bold: true };
      sheet.autoFilter = { from: 'A1', to: 'F1' };
    }
    summarySheet.columns.forEach(column => { column.width = 25; });
    summarySheet.getRow(1).font = { bold: true };
    const buffer = await book.xlsx.writeBuffer();
    const object = URL.createObjectURL(new Blob([buffer as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const link = document.createElement('a'); link.href = object; link.download = `denuncias-${new Date().toISOString().slice(0, 10)}.xlsx`; link.click(); setTimeout(() => URL.revokeObjectURL(object), 60_000);
  }
  if (!session) return <Login onSession={setSession} />;
  if (aal !== 'aal2') return <Mfa onReady={() => void checkAal()} />;
  if (!authorized && !loading) return <main className="login-screen"><div className="login-card"><ShieldCheck size={36} /><h1>Acceso restringido</h1><p>{error || 'Verificando permisos…'}</p><button className="primary" onClick={() => void refresh()}>Reintentar</button><button className="text-button" onClick={() => supabase?.auth.signOut()}>Cerrar sesión</button></div></main>;
  return <div className="shell">
    <aside className="sidebar"><div className="side-brand"><span className="brand-mark">R</span><div><strong>Rubén Rodríguez</strong><small>Centro de operaciones</small></div></div><div className="side-caption">ESPACIO PRIVADO</div><nav aria-label="Módulos del CRM">{tabs.map(({ key, label, icon: Icon }) => <button key={key} className={tab === key ? 'nav-active' : ''} onClick={() => { setTab(key); setSelected(null); }}><Icon size={18} />{label}</button>)}</nav><div className="side-bottom"><span>{session.user.email}</span><button onClick={() => supabase?.auth.signOut()}><LogOut size={16} /> Salir</button></div></aside>
    <main className="workspace"><header className="topbar"><div><span className="eyebrow">OPERACIONES / {tabs.find(item => item.key === tab)?.label.toUpperCase()}</span><h1>{tabs.find(item => item.key === tab)?.label}</h1></div><div className="top-actions"><span className={navigator.onLine ? 'online' : 'offline'}>{navigator.onLine ? 'En línea' : 'Sin conexión'}</span><button className="icon-button" onClick={() => void refresh()} aria-label="Actualizar datos"><RefreshCw size={18} /></button></div></header>
    {error && <p className="error-bar"><AlertTriangle size={16} />{error}</p>}
    {tab === 'dashboard' && <><section className="hero-panel"><div><span className="eyebrow">RESUMEN OPERATIVO</span><h2>Información para tomar decisiones</h2><p>Denuncias recibidas en la web pública, visibles aquí tras la autenticación administrativa.</p></div><ShieldCheck size={42} /></section><section className="metric-grid"><article><Inbox /><span>Denuncias totales</span><strong>{summary.complaints}</strong></article><article><AlertTriangle /><span>Pendientes</span><strong>{items.filter(item => item.status === 'received').length}</strong></article><article><Users /><span>Suscripciones activas</span><strong>{summary.subscriptions ?? '—'}</strong></article><article><BarChart3 /><span>Provincias con casos</span><strong>{byProvince.filter(item => item.total).length}</strong></article></section><section className="panel-grid"><div className="panel"><h3>Denuncias por provincia</h3><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={byProvince}><CartesianGrid strokeDasharray="3 3" stroke="#e5e9ed" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Area type="monotone" dataKey="total" stroke="#286b72" fill="#d4e8e6" /></AreaChart></ResponsiveContainer></div></div><div className="panel"><h3>Actividad reciente</h3>{items.slice(0, 5).map(item => <button className="activity" key={item.id} onClick={() => void openComplaint(item)}><span><strong>{item.tracking_code}</strong><small>{provinces[item.province_code] || item.province_code} · {day(item.created_at)}</small></span><em>{statuses[item.status]}</em></button>)}{items.length === 0 && <p className="muted">No hay denuncias disponibles.</p>}</div></section></>}
    {tab === 'denuncias' && (selected ? <div className="panel detail"><button className="text-button" onClick={() => setSelected(null)}>← Volver a denuncias</button><h2>{selected.tracking_code}</h2><p className="muted">{provinces[selected.province_code]} · Cantón {selected.canton_code} · Distrito {selected.district_code} · {day(selected.created_at)}</p><div className="detail-grid"><div><h3>Información enviada</h3>{Object.entries(selected.payload).map(([key, value]) => <p key={key}><strong>{key}</strong><br />{String(value ?? '')}</p>)}</div><div><h3>Gestión</h3><label>Nuevo estado<select value={newStatus} onChange={event => setNewStatus(event.target.value)}>{Object.entries(statuses).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label><label>Nota interna<textarea value={internalNote} maxLength={4000} onChange={event => setInternalNote(event.target.value)} /></label><label>Nota visible para la persona denunciante<textarea value={publicNote} maxLength={2000} onChange={event => setPublicNote(event.target.value)} /></label><button className="primary" disabled={newStatus === selected.status} onClick={() => void updateStatus()}>Guardar cambio</button><h3>Evidencias</h3>{selected.evidence.map(file => <p key={file.id}>{file.detected_mime_type} · {Math.round(file.size_bytes / 1024)} KB · {file.scan_status}</p>)}<h3>Historial</h3>{selected.history.map(row => <p key={row.id}>{day(row.created_at)} · {statuses[row.to_status]}{row.internal_note && <> · {row.internal_note}</>}</p>)}</div></div></div> : <div className="panel"><div className="section-heading"><div><h2>Bandeja de denuncias</h2><p>Filtra, revisa y actualiza cada caso.</p></div><span>{visible.length} de {summary.complaints}</span></div><div className="filters"><select value={filters.province} onChange={event => setFilters({ ...filters, province: event.target.value })}><option value="">Todas las provincias</option>{Object.entries(provinces).map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select><input placeholder="Cantón" value={filters.canton} onChange={event => setFilters({ ...filters, canton: event.target.value })} /><input placeholder="Distrito" value={filters.district} onChange={event => setFilters({ ...filters, district: event.target.value })} /><select value={filters.status} onChange={event => setFilters({ ...filters, status: event.target.value })}><option value="">Todos los estados</option>{Object.entries(statuses).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select><select value={filters.category} onChange={event => setFilters({ ...filters, category: event.target.value })}><option value="">Todas las categorías</option>{[...new Set(items.map(item => item.category_code))].map(code => <option key={code}>{code}</option>)}</select><input type="date" aria-label="Desde" value={filters.after} onChange={event => setFilters({ ...filters, after: event.target.value })} /><input type="date" aria-label="Hasta" value={filters.before} onChange={event => setFilters({ ...filters, before: event.target.value })} /></div><div className="table-wrap"><table><thead><tr><th>Código</th><th>Provincia</th><th>Categoría</th><th>Fecha</th><th>Estado</th><th></th></tr></thead><tbody>{visible.map(item => <tr key={item.id}><td><strong>{item.tracking_code}</strong></td><td>{provinces[item.province_code] || item.province_code}</td><td>{item.category_code}</td><td>{day(item.created_at)}</td><td><span className="pill">{statuses[item.status] || item.status}</span></td><td><button className="text-button" onClick={() => void openComplaint(item)}>Revisar →</button></td></tr>)}</tbody></table></div>{visible.length === 0 && <p className="muted">No hay denuncias para este filtro.</p>}</div>)}
    {tab === 'informes' && <div className="panel narrow"><FileSpreadsheet size={32} /><h2>Informes Excel</h2><p>Genera un libro con resumen y una hoja por provincia usando las denuncias cargadas. La generación funciona sin conexión después de abrir el CRM y cargar los datos.</p><button className="primary" disabled={!items.length} onClick={() => void exportReport()}>Descargar .xlsx</button><p className="muted">El archivo incluye hasta 500 denuncias sincronizadas en esta sesión. Evita compartirlo fuera del equipo autorizado.</p></div>}
    {tab === 'campanas' && <div className="panel narrow"><Megaphone size={32} /><h2>Campañas y correos</h2><p>Prepara el contenido de una campaña. El envío requiere consentimiento verificable, una lista de destinatarios autorizados y credenciales de un proveedor oficial.</p><label>Borrador de contenido<textarea rows={8} value={draft} onChange={event => { setDraft(event.target.value); localStorage.setItem('crm_campaign_draft', event.target.value); }} placeholder="Redacta una comunicación…" /></label><p className="notice">Envío y programación pendientes de la integración del proveedor.</p></div>}
    {tab === 'canales' && <div className="panel narrow"><MessageSquare size={32} /><h2>Canales autorizados</h2><div className="channel-grid">{['Facebook', 'Instagram', 'TikTok', 'WhatsApp Business'].map(channel => <article key={channel}><strong>{channel}</strong><span>Sin conectar</span><p>Se requiere aprobación de la cuenta y credenciales de la API oficial.</p></article>)}</div></div>}
    {tab === 'ia' && <div className="panel narrow"><Sparkles size={32} /><h2>Asistente de inteligencia artificial</h2><p>Clasificación, transcripción y sugerencias de respuesta se activarán cuando exista un proveedor aprobado y reglas de tratamiento de datos.</p><div className="notice">Respuestas automáticas desactivadas en todos los canales.</div></div>}
    {tab === 'configuracion' && <div className="panel narrow"><Settings size={32} /><h2>Seguridad y configuración</h2><p>Sesión: {session.user.email}</p><p>Autenticación: Google + MFA TOTP</p><p>API: {import.meta.env.VITE_API_URL}</p><p>Los secretos y tokens de proveedores se configuran únicamente en el servidor.</p></div>}
    </main>
  </div>;
}
