import { createServer } from 'node:http';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const port = Number(process.env.PORT || 4100);
const origin = process.env.CRM_ORIGIN;
const url = process.env.SUPABASE_URL;
const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!origin || !url || !publicKey || !secret) throw new Error('Private API configuration is incomplete');
const admin = createClient(url, secret, { auth: { persistSession: false } });
const statusValues = new Set(['received', 'in_review', 'additional_information_requested', 'investigating', 'closed', 'rejected']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function respond(req, res, status, body) {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const json = JSON.stringify(body);
  const headers = { 
    'Content-Type': 'application/json; charset=utf-8', 
    'Cache-Control': 'private, no-store', 
    'X-Content-Type-Options': 'nosniff', 
    'Vary': 'Accept-Encoding, Origin' 
  };

  if (acceptEncoding.includes('gzip')) {
    headers['Content-Encoding'] = 'gzip';
    res.writeHead(status, headers);
    pipeline(Readable.from(json), createGzip(), res).catch(console.error);
  } else {
    res.writeHead(status, headers);
    res.end(json);
  }
}
async function bodyJson(req) {
  let text = '';
  for await (const part of req) {
    text += part;
    if (text.length > 10_000) throw Object.assign(new Error('Body too large'), { status: 413 });
  }
  try { return JSON.parse(text); } catch { throw Object.assign(new Error('Invalid JSON'), { status: 400 }); }
}
async function audit(actor, action, resourceType, resourceId, outcome) {
  const { error } = await admin.from('audit_logs').insert({ actor_id: actor, action, resource_type: resourceType, resource_id: resourceId ?? null, outcome });
  if (error) throw new Error('Audit unavailable');
}
async function authorize(req) {
  const match = /^Bearer (\S+)$/.exec(req.headers.authorization || '');
  if (!match) return null;
  const db = createClient(url, publicKey, {
    global: { headers: { Authorization: `Bearer ${match[1]}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: identity, error: identityError } = await db.auth.getUser(match[1]);
  if (identityError || !identity.user) return null;
  const { data: context, error: contextError } = await db.rpc('my_security_context');
  const row = Array.isArray(context) ? context[0] : null;
  if (contextError || !row || row.profile_id !== identity.user.id || row.status !== 'active' || row.aal !== 'aal2') return null;
  const { data: adminRole } = await db.rpc('has_role', { p_role_key: 'admin' });
  const { data: moderatorRole } = await db.rpc('has_role', { p_role_key: 'moderator' });
  if (adminRole !== true && moderatorRole !== true) return null;
  return { db, user: identity.user, context: row, adminRole: adminRole === true };
}
async function decryptEnvelope(serialized) {
  const envelope = JSON.parse(serialized);
  if (envelope.c !== 'complaint-payload' || !['v1', 'v2'].includes(envelope.v)) throw new Error('Invalid envelope');
  const encoded = process.env[`DATA_ENCRYPTION_KEY_${envelope.v.toUpperCase()}`];
  if (!encoded) throw new Error('Encryption key unavailable');
  const keyBytes = Buffer.from(encoded, 'base64url');
  if (keyBytes.length !== 32) throw new Error('Invalid encryption key');
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt']);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: Buffer.from(envelope.iv, 'base64url'), additionalData: new TextEncoder().encode(`rubenweb:complaint-payload:${envelope.v}`) }, key, Buffer.from(envelope.data, 'base64url'));
  return JSON.parse(new TextDecoder().decode(plaintext));
}

const server = createServer(async (req, res) => {
  try {
    if (req.headers.origin === origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
    }
    if (req.method === 'OPTIONS') return respond(res, req.headers.origin === origin ? 204 : 403, {});
    const path = new URL(req.url, 'http://localhost');
    if (path.pathname === '/health') return respond(res, 200, { ok: true });
    if (path.pathname === '/webhooks/whatsapp') {
      if (req.method === 'GET') {
        const expected = process.env.WHATSAPP_VERIFY_TOKEN;
        const token = path.searchParams.get('hub.verify_token');
        const challenge = path.searchParams.get('hub.challenge');
        if (!expected || !token || token !== expected || path.searchParams.get('hub.mode') !== 'subscribe' || !challenge || challenge.length > 512) return respond(res, 403, { error: 'Verification denied' });
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
        return res.end(challenge);
      }
      if (req.method === 'POST') {
        const appSecret = process.env.WHATSAPP_APP_SECRET;
        const signature = req.headers['x-hub-signature-256'];
        if (!appSecret || typeof signature !== 'string' || !/^sha256=[0-9a-f]{64}$/.test(signature)) return respond(res, 403, { error: 'Signature required' });
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 256_000) return respond(res, 413, { error: 'Body too large' });
          chunks.push(chunk);
        }
        const body = Buffer.concat(chunks);
        const expected = Buffer.from(createHmac('sha256', appSecret).update(body).digest('hex'), 'hex');
        const received = Buffer.from(signature.slice(7), 'hex');
        if (!timingSafeEqual(expected, received)) return respond(res, 403, { error: 'Signature denied' });
        // The integration is intentionally inactive until consent and provider approval are configured.
        return respond(res, 202, { accepted: true });
      }
      return respond(res, 405, { error: 'Method not allowed' });
    }
    if (req.headers.origin && req.headers.origin !== origin) return respond(req, res, 403, { error: 'Origin denied' });

    // --- RUTA DE PRUEBA DE CARGA (SIN AUTH) ---
    if (req.method === 'GET' && path.pathname === '/api/test-load') {
      const { data, error } = await admin.from('complaints').select('id,tracking_code,status').limit(20);
      if (error) return respond(req, res, 500, { error: error.message });
      return respond(req, res, 200, data);
    }
    // ------------------------------------------

    const auth = await authorize(req);
    if (!auth) return respond(res, 403, { error: 'Se requiere una cuenta administrativa con MFA activo.' });
    if (req.method === 'GET' && path.pathname === '/api/session') return respond(res, 200, { email: auth.user.email, roles: auth.context.roles, aal: auth.context.aal });

    if (req.method === 'GET' && path.pathname === '/api/complaints') {
      const filters = ['province', 'canton', 'district', 'category', 'status'];
      let query = auth.db
        .from('complaints')
        .select('id,tracking_code,category_code,province_code,canton_code,district_code,status,created_at,updated_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(20);

      const cursor = path.searchParams.get('cursor');
      if (cursor) {
        if (Number.isNaN(Date.parse(cursor))) return respond(res, 400, { error: 'Cursor inválido' });
        query = query.lt('created_at', cursor);
      }
      for (const key of filters) {
        const value = path.searchParams.get(key);
        if (value) query = query.eq(key === 'status' ? 'status' : `${key}_code`, value);
      }
      const after = path.searchParams.get('after');
      const before = path.searchParams.get('before');
      if (after && !Number.isNaN(Date.parse(after))) query = query.gte('created_at', after);
      if (before && !Number.isNaN(Date.parse(before))) query = query.lte('created_at', before);
      const { data, error, count } = await query;
      if (error) throw error;
      await audit(auth.user.id, 'crm.complaints.list', 'complaint', null, 'success');
      return respond(res, 200, { items: data, total: count, nextCursor: data?.length === 20 ? data.at(-1)?.created_at : null });
    }
    const match = /^\/api\/complaints\/([0-9a-f-]+)$/.exec(path.pathname);
    if (match && uuid.test(match[1]) && req.method === 'GET') {
      const { data: row, error } = await admin.from('complaints').select('id,tracking_code,owner_id,category_code,province_code,canton_code,district_code,status,encrypted_payload,created_at,updated_at').eq('id', match[1]).maybeSingle();
      if (error) throw error;
      if (!row) return respond(res, 404, { error: 'Denuncia no encontrada' });
      const [evidence, history, payload] = await Promise.all([
        admin.from('complaint_evidence').select('id,detected_mime_type,size_bytes,scan_status,removed_at').eq('complaint_id', row.id),
        admin.from('complaint_status_history').select('id,from_status,to_status,internal_note,user_visible_note,created_at').eq('complaint_id', row.id).order('created_at', { ascending: false }),
        decryptEnvelope(row.encrypted_payload),
      ]);
      if (evidence.error || history.error) throw evidence.error || history.error;
      await audit(auth.user.id, 'crm.complaints.read', 'complaint', row.id, 'success');
      const { encrypted_payload, ...safeRow } = row;
      return respond(res, 200, { ...safeRow, payload, evidence: evidence.data, history: history.data });
    }
    if (match && uuid.test(match[1]) && req.method === 'PATCH') {
      const body = await bodyJson(req);
      if (!body || typeof body !== 'object' || !statusValues.has(body.status) || typeof body.internalNote !== 'string' || body.internalNote.length > 4000 || typeof body.publicNote !== 'string' || body.publicNote.length > 2000) return respond(res, 400, { error: 'Cambio inválido' });
      const { error } = await auth.db.rpc('staff_set_complaint_status', { p_complaint_id: match[1], p_new_status: body.status, p_internal_note: body.internalNote, p_user_visible_note: body.publicNote });
      if (error) return respond(res, 400, { error: error.message });
      await audit(auth.user.id, 'crm.complaints.status', 'complaint', match[1], 'success');
      return respond(res, 200, { ok: true });
    }
    if (req.method === 'GET' && path.pathname === '/api/summary') {
      const [complaints, subscriptions] = await Promise.all([
        auth.db.from('complaints').select('id', { count: 'exact', head: true }),
        auth.adminRole ? auth.db.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active') : Promise.resolve({ count: null, error: null }),
      ]);
      if (complaints.error || subscriptions.error) throw complaints.error || subscriptions.error;
      return respond(res, 200, { complaints: complaints.count ?? 0, subscriptions: subscriptions.count });
    }
    return respond(res, 404, { error: 'Ruta no encontrada' });
  } catch (error) {
    console.error('Private API request failed', error instanceof Error ? error.message : error);
    return respond(res, error?.status || 503, { error: 'La operación no está disponible en este momento.' });
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Private API listening on ${port}`));
