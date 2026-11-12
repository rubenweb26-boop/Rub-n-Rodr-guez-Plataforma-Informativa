import { createClient } from '@supabase/supabase-js';
import { readFile, writeFile } from 'node:fs/promises';

const evidence = JSON.parse(await readFile('outputs/live-complaint-flow.json', 'utf8'));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !secret || new URL(url).host !== evidence.project) throw new Error('Project mismatch');
if (!/^RW-\d{4}-[A-Z0-9]+$/.test(evidence.trackingCode || '')) throw new Error('Test marker missing');
const reporter = evidence.users.find(user => user.kind === 'reporter');
if (!reporter || !evidence.complaintId) throw new Error('Test identifiers missing');
const admin = createClient(url, secret, { auth: { persistSession: false } });
const removed = await admin.from('complaints').delete().eq('id', evidence.complaintId).eq('tracking_code', evidence.trackingCode);
if (removed.error) {
  console.log(`Test complaint remains: ${removed.error.code || 'delete denied'}`);
  process.exitCode = 2;
} else {
  const profile = await admin.from('profiles').delete().eq('id', reporter.id);
  if (profile.error) {
    console.log(`Test profile remains: ${profile.error.code || 'delete denied'}`);
    process.exitCode = 2;
  } else {
    const auth = await admin.auth.admin.deleteUser(reporter.id);
    if (auth.error) {
      console.log('Test auth user remains');
      process.exitCode = 2;
    } else {
      evidence.cleanup.push({ kind: 'reporter', removed: true });
      evidence.complaintRemoved = true;
      await writeFile('outputs/live-complaint-flow.json', JSON.stringify(evidence, null, 2));
      console.log('Synthetic complaint and account removed');
    }
  }
}
