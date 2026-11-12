import { createClient } from '@supabase/supabase-js';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const encryptionKey = process.env.DATA_ENCRYPTION_KEY_V1;
if (process.argv[2] !== '--staging') throw new Error('Run only with --staging after confirming the target is resettable');
if (!url || !publishable || !secret || !encryptionKey) throw new Error('Staging configuration missing');
const admin = createClient(url, secret, { auth: { persistSession: false } });
const created = [];
const evidence = { project: new URL(url).host, users: [], complaintId: null, trackingCode: null, checks: [], cleanup: [] };
const fail = (label, error) => { throw new Error(`${label}: ${error?.message || error}`); };
const check = (condition, label) => { if (!condition) throw new Error(label); evidence.checks.push(label); console.log(`PASS ${label}`); };

function totp(secretBase32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const letter of secretBase32.toUpperCase().replace(/=+$/, '')) {
    const value = alphabet.indexOf(letter);
    if (value < 0) throw new Error('Invalid TOTP secret');
    bits += value.toString(2).padStart(5, '0');
  }
  const key = Buffer.from(bits.slice(0, Math.floor(bits.length / 8) * 8).match(/.{8}/g).map(byte => parseInt(byte, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const digest = createHmac('sha1', key).update(counter).digest();
  const offset = digest.at(-1) & 15;
  return ((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).toString().padStart(6, '0');
}

async function encrypt(value) {
  const raw = Buffer.from(encryptionKey, 'base64url');
  if (raw.length !== 32) throw new Error('Encryption key must be 32 bytes');
  const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt']);
  const iv = randomBytes(12);
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode('rubenweb:complaint-payload:v1') }, key, new TextEncoder().encode(JSON.stringify(value)));
  return JSON.stringify({ v: 'v1', c: 'complaint-payload', iv: iv.toString('base64url'), data: Buffer.from(data).toString('base64url') });
}

async function createUser(kind) {
  const email = `codex-${kind}-${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
  const password = randomBytes(24).toString('base64url');
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: `Prueba ${kind}` } });
  if (error || !data.user) fail(`create ${kind}`, error);
  created.push({ id: data.user.id, kind });
  evidence.users.push({ id: data.user.id, kind });
  const client = createClient(url, publishable, { auth: { persistSession: false, autoRefreshToken: false } });
  const signed = await client.auth.signInWithPassword({ email, password });
  if (signed.error) fail(`sign in ${kind}`, signed.error);
  return { id: data.user.id, client };
}

async function cleanup() {
  for (const user of created.filter(user => user.kind !== 'reporter' || !evidence.complaintId).reverse()) {
    const profile = await admin.from('profiles').delete().eq('id', user.id);
    const auth = profile.error ? { error: profile.error } : await admin.auth.admin.deleteUser(user.id);
    evidence.cleanup.push({ kind: user.kind, removed: !auth.error });
  }
}

let server;
try {
  const reporter = await createUser('reporter');
  const observer = await createUser('observer');
  const staff = await createUser('staff');
  const role = await admin.from('profile_roles').insert({ profile_id: staff.id, role_key: 'admin' });
  if (role.error) fail('grant admin role', role.error);

  const district = await admin.from('districts').select('code,canton_code').eq('is_active', true).limit(1).single();
  if (district.error) fail('district', district.error);
  const canton = await admin.from('cantons').select('code,province_code').eq('code', district.data.canton_code).single();
  if (canton.error) fail('canton', canton.error);
  const category = await admin.from('complaint_categories').select('code').eq('is_active', true).limit(1).single();
  if (category.error) fail('category', category.error);
  const title = `Prueba sintética ${randomUUID().slice(0, 8)}`;
  const payload = await encrypt({ title, description: 'Registro sintético para comprobar permisos y seguimiento. No describe un hecho real.', locality: 'Prueba', approximateLocation: 'Prueba', occurredOn: null });
  const createdComplaint = await reporter.client.rpc('create_complaint', {
    p_category_code: category.data.code, p_province_code: canton.data.province_code,
    p_canton_code: canton.data.code, p_district_code: district.data.code,
    p_encrypted_payload: payload, p_encryption_key_version: 'v1',
    p_truth_accepted: true, p_privacy_accepted: true, p_urgent_notice_accepted: true,
  });
  if (createdComplaint.error || !createdComplaint.data?.[0]) fail('create complaint', createdComplaint.error);
  evidence.complaintId = createdComplaint.data[0].complaint_id;
  evidence.trackingCode = createdComplaint.data[0].tracking_code;
  check(Boolean(evidence.trackingCode), 'Denuncia sintética creada con código');

  const own = await reporter.client.rpc('my_complaints', { p_limit: 10, p_offset: 0 });
  check(!own.error && own.data?.some(row => row.complaint_id === evidence.complaintId), 'El propietario ve su denuncia');
  const foreign = await observer.client.rpc('my_complaints', { p_limit: 10, p_offset: 0 });
  check(!foreign.error && !foreign.data?.some(row => row.complaint_id === evidence.complaintId), 'Otra persona no ve la denuncia');
  const foreignTimeline = await observer.client.rpc('my_complaint_timeline', { p_complaint_id: evidence.complaintId });
  check(!foreignTimeline.error && foreignTimeline.data?.length === 0, 'Otra persona no ve el historial');
  const deniedChange = await staff.client.rpc('staff_set_complaint_status', { p_complaint_id: evidence.complaintId, p_new_status: 'in_review', p_internal_note: 'Prueba', p_user_visible_note: 'En revisión' });
  check(Boolean(deniedChange.error), 'El administrador AAL1 no puede cambiar el estado');

  const enrolled = await staff.client.auth.mfa.enroll({ factorType: 'totp' });
  if (enrolled.error || !enrolled.data?.totp?.secret) fail('TOTP enroll', enrolled.error);
  const challenge = await staff.client.auth.mfa.challenge({ factorId: enrolled.data.id });
  if (challenge.error) fail('TOTP challenge', challenge.error);
  const verified = await staff.client.auth.mfa.verify({ factorId: enrolled.data.id, challengeId: challenge.data.id, code: totp(enrolled.data.totp.secret) });
  if (verified.error) fail('TOTP verify', verified.error);
  const aal = await staff.client.auth.mfa.getAuthenticatorAssuranceLevel();
  check(!aal.error && aal.data?.currentLevel === 'aal2', 'El administrador alcanza AAL2');

  const session = await staff.client.auth.getSession();
  const token = session.data.session?.access_token;
  if (!token) throw new Error('AAL2 token missing');
  const port = 46000 + Math.floor(Math.random() * 10000);
  server = spawn(process.execPath, ['backend/src/server.mjs'], {
    env: { ...process.env, PORT: String(port), CRM_ORIGIN: 'http://localhost:5174', SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: publishable, SUPABASE_SERVICE_ROLE_KEY: secret },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Private API did not start')), 8000);
    server.stdout.once('data', () => { clearTimeout(timeout); resolve(); });
    server.once('exit', code => { clearTimeout(timeout); reject(new Error(`Private API exited ${code}`)); });
  });
  const headers = { Authorization: `Bearer ${token}`, Origin: 'http://localhost:5174' };
  const list = await fetch(`http://127.0.0.1:${port}/api/complaints`, { headers });
  const listData = await list.json();
  check(list.ok && listData.items?.some(row => row.id === evidence.complaintId), 'La denuncia aparece en la API del CRM');
  const detail = await fetch(`http://127.0.0.1:${port}/api/complaints/${evidence.complaintId}`, { headers });
  const detailData = await detail.json();
  check(detail.ok && detailData.payload?.title === title, 'El CRM descifra el detalle autorizado');
  const changed = await fetch(`http://127.0.0.1:${port}/api/complaints/${evidence.complaintId}`, { method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'in_review', internalNote: 'Prueba automatizada', publicNote: 'En revisión de prueba' }) });
  check(changed.ok, 'El CRM actualiza el estado');
  const ownerTimeline = await reporter.client.rpc('my_complaint_timeline', { p_complaint_id: evidence.complaintId });
  check(!ownerTimeline.error && ownerTimeline.data?.some(row => row.status === 'in_review' && row.note === 'En revisión de prueba'), 'El propietario ve el nuevo estado público');
  const observerAfter = await observer.client.rpc('my_complaint_timeline', { p_complaint_id: evidence.complaintId });
  check(!observerAfter.error && observerAfter.data?.length === 0, 'El historial sigue oculto a otra persona');
} finally {
  server?.kill();
  await cleanup();
  await mkdir('outputs', { recursive: true });
  await writeFile('outputs/live-complaint-flow.json', JSON.stringify(evidence, null, 2));
  console.log(`Test record: ${evidence.trackingCode || 'none'}; temporary account cleanup: ${evidence.cleanup.every(item => item.removed) ? 'complete' : 'incomplete'}`);
}
