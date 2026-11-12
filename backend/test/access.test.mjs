import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHmac } from 'node:crypto';

test('private API never serves complaints without an authorized MFA session', async () => {
  const port = 45000 + Math.floor(Math.random() * 10000);
  const server = spawn(process.execPath, ['src/server.mjs'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      CRM_ORIGIN: 'http://localhost:5174',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_PUBLISHABLE_KEY: 'test-public-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-secret-key',
      WHATSAPP_VERIFY_TOKEN: 'verify-test',
      WHATSAPP_APP_SECRET: 'app-secret-test',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('server did not start')), 5000);
      server.stdout.once('data', () => { clearTimeout(timeout); resolve(); });
      server.once('exit', code => { clearTimeout(timeout); reject(new Error(`server exited ${code}`)); });
    });
    const health = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(health.status, 200);
    const denied = await fetch(`http://127.0.0.1:${port}/api/complaints`);
    assert.equal(denied.status, 403);
    const wrongOrigin = await fetch(`http://127.0.0.1:${port}/api/complaints`, { headers: { Origin: 'https://public.example' } });
    assert.equal(wrongOrigin.status, 403);
    assert.equal(wrongOrigin.headers.get('access-control-allow-origin'), null);
    const webhook = await fetch(`http://127.0.0.1:${port}/webhooks/whatsapp`, { method: 'POST', body: '{}' });
    assert.equal(webhook.status, 403);
    const challenge = await fetch(`http://127.0.0.1:${port}/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=verify-test&hub.challenge=ok`);
    assert.equal(challenge.status, 200);
    assert.equal(await challenge.text(), 'ok');
    const body = '{}';
    const signature = createHmac('sha256', 'app-secret-test').update(body).digest('hex');
    const signed = await fetch(`http://127.0.0.1:${port}/webhooks/whatsapp`, { method: 'POST', headers: { 'X-Hub-Signature-256': `sha256=${signature}` }, body });
    assert.equal(signed.status, 202);
  } finally {
    server.kill();
  }
});
