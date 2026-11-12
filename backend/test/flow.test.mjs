import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';

const complaint = {
  id: '0a000000-0000-4000-8000-000000000001', tracking_code: 'DEN-2026-CR-TEST1',
  category_code: 'maltrato_animal', province_code: '1', canton_code: '101', district_code: '10101',
  status: 'received', created_at: '2026-11-11T12:00:00.000Z', updated_at: '2026-11-11T12:00:00.000Z',
};

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

test('complaint flow enforces role and MFA before reading or changing status', async () => {
  let statusUpdated = false;
  let auditWrites = 0;
  const mock = createServer(async (req, res) => {
    const path = new URL(req.url, 'http://localhost').pathname;
    const token = (req.headers.authorization || '').replace(/^Bearer /, '');
    let body = '';
    for await (const chunk of req) body += chunk;
    let result = null;
    let httpStatus = 200;
    const headers = { 'Content-Type': 'application/json' };
    if (path === '/auth/v1/user') {
      result = ['admin-aal1', 'admin-aal2', 'citizen-aal2'].includes(token)
        ? { id: token === 'citizen-aal2' ? 'citizen-id' : 'admin-id', email: `${token}@example.invalid`, app_metadata: {}, user_metadata: {} }
        : null;
      if (!result) httpStatus = 401;
    } else if (path === '/rest/v1/rpc/my_security_context') {
      result = [{ profile_id: token === 'citizen-aal2' ? 'citizen-id' : 'admin-id', status: 'active', aal: token.endsWith('aal2') ? 'aal2' : 'aal1', roles: token.startsWith('admin') ? ['admin'] : ['member'] }];
    } else if (path === '/rest/v1/rpc/has_role') {
      result = token === 'admin-aal2' && JSON.parse(body).p_role_key === 'admin';
    } else if (path === '/rest/v1/rpc/staff_set_complaint_status') {
      assert.equal(token, 'admin-aal2');
      assert.equal(JSON.parse(body).p_new_status, 'in_review');
      statusUpdated = true;
    } else if (path === '/rest/v1/complaints') {
      result = [complaint];
      headers['Content-Range'] = '0-0/1';
    } else if (path === '/rest/v1/audit_logs') {
      auditWrites += 1;
      httpStatus = 201;
      result = [];
    } else {
      httpStatus = 404;
      result = { message: `Unexpected path: ${path}` };
    }
    res.writeHead(httpStatus, headers);
    res.end(JSON.stringify(result));
  });
  const mockPort = await listen(mock);
  const port = 45000 + Math.floor(Math.random() * 10000);
  const server = spawn(process.execPath, ['src/server.mjs'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), CRM_ORIGIN: 'http://localhost:5174', SUPABASE_URL: `http://127.0.0.1:${mockPort}`, SUPABASE_PUBLISHABLE_KEY: 'public-test', SUPABASE_SERVICE_ROLE_KEY: 'service-test' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('private API did not start')), 5000);
      server.stdout.once('data', () => { clearTimeout(timeout); resolve(); });
      server.once('exit', code => { clearTimeout(timeout); reject(new Error(`private API exited ${code}`)); });
    });
    const get = token => fetch(`http://127.0.0.1:${port}/api/complaints`, { headers: { Authorization: `Bearer ${token}`, Origin: 'http://localhost:5174' } });
    assert.equal((await get('admin-aal1')).status, 403);
    assert.equal((await get('citizen-aal2')).status, 403);
    const allowed = await get('admin-aal2');
    assert.equal(allowed.status, 200);
    assert.equal((await allowed.json()).items[0].tracking_code, complaint.tracking_code);
    const update = await fetch(`http://127.0.0.1:${port}/api/complaints/${complaint.id}`, { method: 'PATCH', headers: { Authorization: 'Bearer admin-aal2', Origin: 'http://localhost:5174', 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'in_review', internalNote: 'Prueba', publicNote: 'En revisión' }) });
    assert.equal(update.status, 200);
    assert.equal(statusUpdated, true);
    assert.equal(auditWrites, 2);
  } finally {
    server.kill();
    mock.close();
  }
});
