import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const configured = Boolean(supabaseUrl && publishableKey && import.meta.env.VITE_API_URL);
export const supabase = configured ? createClient(supabaseUrl, publishableKey, {
  auth: { flowType: 'pkce', detectSessionInUrl: true, autoRefreshToken: true },
}) : null;
const base = import.meta.env.VITE_API_URL || '';

export type Complaint = {
  id: string; tracking_code: string; category_code: string; province_code: string;
  canton_code: string; district_code: string; status: string; created_at: string; updated_at: string;
};
export type Detail = Complaint & { payload: Record<string, unknown>; evidence: { id: string; detected_mime_type: string; scan_status: string; size_bytes: number }[]; history: { id: string; to_status: string; internal_note: string | null; user_visible_note: string | null; created_at: string }[] };

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (!supabase) throw new Error('Configura Supabase y la API privada.');
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('Inicia sesión.');
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${data.session.access_token}`, ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
    cache: 'no-store',
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || 'La operación falló.');
  return value as T;
}
