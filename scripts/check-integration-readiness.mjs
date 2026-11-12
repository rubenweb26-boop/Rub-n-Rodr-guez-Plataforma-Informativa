import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !publishable || !secret) throw new Error('Supabase configuration missing');
const client = createClient(url, secret, { auth: { persistSession: false } });
const anon = createClient(url, publishable, { auth: { persistSession: false } });
const tables = ['provinces', 'cantons', 'districts', 'complaint_categories', 'complaints', 'profiles'];
for (const table of tables) {
  const { count, error } = await client.from(table).select('id', { count: 'exact', head: true });
  // Some catalogs use `code` rather than `id`.
  if (error) {
    const fallback = await client.from(table).select('code', { count: 'exact', head: true });
    console.log(`${table}: ${fallback.error ? 'unavailable' : fallback.count}`);
  } else {
    console.log(`${table}: ${count}`);
  }
}
const { data: buckets, error: bucketError } = await client.storage.listBuckets();
console.log(`private_evidence_bucket: ${!bucketError && buckets?.some(bucket => bucket.id === 'complaint-evidence' && bucket.public === false) === true}`);
const { error: anonError } = await anon.from('complaints').select('id').limit(1);
console.log(`anonymous_complaints_denied: ${Boolean(anonError)}`);
const { error: anonRpcError } = await anon.rpc('my_complaints', { p_limit: 1, p_offset: 0 });
console.log(`anonymous_owner_rpc_denied: ${Boolean(anonRpcError)}`);
