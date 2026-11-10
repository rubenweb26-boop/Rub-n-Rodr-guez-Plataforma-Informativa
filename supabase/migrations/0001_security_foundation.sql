-- Supabase/Postgres security foundation for RubenWeb.
-- Fresh-project migration. It contains no credentials or environment-specific IDs.
-- Sensitive complaint prose and original filenames are encrypted by the application
-- with AES-256-GCM before they reach Postgres. See docs/SUPABASE.md.

begin;

-- ---------------------------------------------------------------------------
-- Core identity and authorization
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  email text not null check (char_length(email) between 3 and 320),
  display_name text not null check (char_length(display_name) between 1 and 120),
  status text not null default 'active'
    check (status in ('active', 'suspended', 'deleted')),
  locale text not null default 'es-CR'
    check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  last_seen_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create unique index if not exists profiles_email_lower_unique
  on public.profiles (lower(email));
create index if not exists profiles_status_idx on public.profiles (status);

create table if not exists public.roles (
  key text primary key check (key ~ '^[a-z][a-z0-9_]{1,39}$'),
  name text not null check (char_length(name) between 1 and 80),
  description text check (description is null or char_length(description) <= 500),
  requires_aal2 boolean not null default false,
  is_system boolean not null default true,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

insert into public.roles (key, name, description, requires_aal2, is_system)
values
  ('member', 'Miembro', 'Acceso normal a los registros propios.', false, true),
  ('moderator', 'Moderación', 'Revisión operativa de denuncias.', true, true),
  ('finance', 'Finanzas', 'Conciliación de pagos y suscripciones.', true, true),
  ('admin', 'Administración', 'Administración general de la plataforma.', true, true)
on conflict (key) do update
set name = excluded.name,
    description = excluded.description,
    requires_aal2 = excluded.requires_aal2,
    is_system = excluded.is_system,
    updated_at = clock_timestamp();

create table if not exists public.profile_roles (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_key text not null references public.roles(key) on delete restrict,
  granted_by_profile_id uuid references public.profiles(id) on delete set null,
  granted_at timestamptz not null default clock_timestamp(),
  primary key (profile_id, role_key)
);

create index if not exists profile_roles_role_idx
  on public.profile_roles (role_key, profile_id);

-- Supabase Auth remains the authority for enrolled factors and the JWT `aal`
-- claim. This table stores operational controls, never factor secrets.
create table if not exists public.admin_security (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  mfa_required boolean not null default true check (mfa_required),
  suspended_until timestamptz,
  last_aal2_seen_at timestamptz,
  access_reviewed_at timestamptz,
  access_reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

-- ---------------------------------------------------------------------------
-- Plans, subscriptions, and provider-safe payment records
-- ---------------------------------------------------------------------------

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z][a-z0-9_-]{1,49}$'),
  name text not null check (char_length(name) between 1 and 120),
  description text check (description is null or char_length(description) <= 1200),
  is_active boolean not null default false,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create table if not exists public.plan_prices (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete restrict,
  currency text not null check (currency in ('CRC', 'USD')),
  amount_minor bigint not null check (amount_minor > 0),
  billing_interval text not null check (billing_interval in ('month', 'one_time')),
  provider text not null default 'tilopay' check (provider in ('tilopay', 'manual')),
  provider_price_id text,
  is_active boolean not null default false,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (plan_id, currency, billing_interval, provider)
);

-- Idempotent commercial seed. DO NOTHING preserves later administrative edits.
insert into public.plans (code, name, description, is_active)
values (
  'contenido-mensual',
  'Membresía de contenido',
  'Acceso mensual al contenido para miembros.',
  true
)
on conflict (code) do nothing;

insert into public.plan_prices (
  plan_id, currency, amount_minor, billing_interval, provider, is_active
)
select p.id, 'CRC', 350000, 'month', 'tilopay', true
from public.plans p
where p.code = 'contenido-mensual'
on conflict (plan_id, currency, billing_interval, provider) do nothing;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  plan_id uuid not null references public.plans(id) on delete restrict,
  plan_price_id uuid references public.plan_prices(id) on delete set null,
  provider text not null default 'tilopay' check (provider in ('tilopay', 'manual')),
  provider_customer_id text,
  provider_subscription_id text,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'past_due', 'canceled', 'expired', 'suspended')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  access_until timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  check (current_period_end is null or current_period_start is null or current_period_end >= current_period_start)
);

create unique index if not exists subscriptions_provider_reference_unique
  on public.subscriptions (provider, provider_subscription_id)
  where provider_subscription_id is not null;
create index if not exists subscriptions_profile_status_idx
  on public.subscriptions (user_id, status);
create index if not exists subscriptions_access_until_idx
  on public.subscriptions (access_until);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  plan_price_id uuid references public.plan_prices(id) on delete set null,
  provider text not null default 'tilopay' check (provider in ('tilopay', 'manual')),
  provider_order_number text
    check (provider_order_number is null or char_length(provider_order_number) between 1 and 200),
  provider_transaction_id text,
  idempotency_key text not null unique check (char_length(idempotency_key) between 16 and 200),
  kind text not null default 'charge'
    check (kind in ('charge', 'refund', 'chargeback', 'adjustment')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'failed', 'refunded', 'partially_refunded', 'charged_back', 'canceled')),
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null check (currency in ('CRC', 'USD')),
  provider_status text check (provider_status is null or char_length(provider_status) <= 100),
  failure_code text check (failure_code is null or char_length(failure_code) <= 100),
  failure_message text check (failure_message is null or char_length(failure_message) <= 500),
  metadata_json jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata_json) = 'object' and octet_length(metadata_json::text) <= 4096),
  approved_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create unique index if not exists payment_transactions_provider_reference_unique
  on public.payment_transactions (provider, provider_transaction_id)
  where provider_transaction_id is not null;
create index if not exists payment_transactions_profile_created_idx
  on public.payment_transactions (user_id, created_at desc);
create unique index if not exists payment_transactions_provider_order_unique
  on public.payment_transactions (provider, provider_order_number)
  where provider_order_number is not null;
create index if not exists payment_transactions_subscription_idx
  on public.payment_transactions (subscription_id);

-- Do not store a webhook body, card token, PAN, CVV, or authorization secret.
create table if not exists public.payment_provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'tilopay' check (provider = 'tilopay'),
  provider_event_id text not null check (char_length(provider_event_id) between 1 and 200),
  event_type text not null check (char_length(event_type) between 1 and 120),
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  signature_verified boolean not null default false,
  provider_state_confirmed boolean not null default false,
  processing_status text not null default 'received'
    check (processing_status in ('received', 'processing', 'processed', 'ignored', 'failed')),
  transaction_id uuid references public.payment_transactions(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  attempt_count integer not null default 1 check (attempt_count > 0),
  last_error text check (last_error is null or char_length(last_error) <= 500),
  provider_occurred_at timestamptz,
  received_at timestamptz not null default clock_timestamp(),
  processed_at timestamptz,
  unique (provider, provider_event_id)
);

create index if not exists payment_provider_events_status_idx
  on public.payment_provider_events (processing_status, received_at);

-- ---------------------------------------------------------------------------
-- Complaints and private evidence
-- ---------------------------------------------------------------------------

create table if not exists public.complaint_categories (
  code text primary key check (code ~ '^[a-z][a-z0-9_]{1,59}$'),
  name text not null check (char_length(name) between 1 and 120),
  is_active boolean not null default true,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

insert into public.complaint_categories (code, name)
values
  ('infrastructure', 'Infraestructura pública'),
  ('public_services', 'Servicios públicos'),
  ('environment', 'Medioambiente'),
  ('community_safety', 'Seguridad comunitaria'),
  ('administrative_irregularities', 'Posibles irregularidades administrativas'),
  ('municipal', 'Problemas municipales'),
  ('other', 'Otros asuntos de interés público')
on conflict (code) do update set name = excluded.name, updated_at = clock_timestamp();

create table if not exists public.provinces (
  code text primary key check (code ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,19}$'),
  name text not null check (char_length(name) between 1 and 120),
  is_active boolean not null default true,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create table if not exists public.cantons (
  code text primary key check (code ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,29}$'),
  province_code text not null references public.provinces(code) on delete restrict,
  name text not null check (char_length(name) between 1 and 120),
  is_active boolean not null default true,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (code, province_code)
);

create index if not exists cantons_province_active_idx
  on public.cantons (province_code, is_active, name);

create table if not exists public.districts (
  code text primary key check (code ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$'),
  canton_code text not null references public.cantons(code) on delete restrict,
  name text not null check (char_length(name) between 1 and 120),
  is_active boolean not null default true,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (code, canton_code)
);

create index if not exists districts_canton_active_idx
  on public.districts (canton_code, is_active, name);

create or replace function public.new_tracking_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select 'RW-' || extract(year from clock_timestamp())::integer::text || '-' ||
         upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
$$;

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null unique default public.new_tracking_code(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  category_code text not null references public.complaint_categories(code) on delete restrict,
  province_code text not null references public.provinces(code) on delete restrict,
  canton_code text not null references public.cantons(code) on delete restrict,
  district_code text not null references public.districts(code) on delete restrict,
  encrypted_payload text not null
    check (char_length(encrypted_payload) between 40 and 131072),
  encryption_key_version text not null
    check (encryption_key_version ~ '^[A-Za-z0-9._-]{1,50}$'),
  payload_fingerprint text
    check (payload_fingerprint is null or payload_fingerprint ~ '^[a-f0-9]{64}$'),
  status text not null default 'received'
    check (status in ('received', 'in_review', 'additional_information_requested', 'investigating', 'closed', 'rejected')),
  assigned_to_profile_id uuid references public.profiles(id) on delete set null,
  truth_declaration_accepted boolean not null check (truth_declaration_accepted),
  privacy_consent_accepted boolean not null check (privacy_consent_accepted),
  urgent_channel_notice_accepted boolean not null check (urgent_channel_notice_accepted),
  publication_authorized boolean not null default false,
  resolution_summary text check (resolution_summary is null or char_length(resolution_summary) <= 2000),
  closed_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  foreign key (canton_code, province_code)
    references public.cantons(code, province_code) on delete restrict,
  foreign key (district_code, canton_code)
    references public.districts(code, canton_code) on delete restrict
);

create index if not exists complaints_owner_created_idx
  on public.complaints (owner_id, created_at desc);
create index if not exists complaints_status_location_idx
  on public.complaints (status, province_code, canton_code);
create index if not exists complaints_assignee_status_idx
  on public.complaints (assigned_to_profile_id, status);

comment on column public.complaints.encrypted_payload is
  'Application-generated AES-256-GCM envelope. Never encrypt in the browser with a long-lived server key.';
comment on column public.complaints.payload_fingerprint is
  'Optional HMAC-SHA-256 for exact matching; the HMAC key lives in the application secret manager.';

create table if not exists public.complaint_evidence (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  uploaded_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  bucket_id text not null default 'complaint-evidence' check (bucket_id = 'complaint-evidence'),
  storage_object_path text not null unique check (char_length(storage_object_path) between 75 and 220),
  encrypted_original_filename text not null
    check (char_length(encrypted_original_filename) between 40 and 4096),
  filename_encryption_key_version text not null
    check (filename_encryption_key_version ~ '^[A-Za-z0-9._-]{1,50}$'),
  detected_mime_type text not null
    check (detected_mime_type in ('image/jpeg', 'image/png', 'application/pdf', 'video/mp4', 'video/webm')),
  size_bytes bigint not null check (size_bytes between 1 and 12582912),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  scan_status text not null default 'pending'
    check (scan_status in ('pending', 'clean', 'quarantined', 'rejected')),
  is_sensitive boolean not null default true,
  scan_completed_at timestamptz,
  removed_at timestamptz,
  removed_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default clock_timestamp()
);

create index if not exists complaint_evidence_complaint_idx
  on public.complaint_evidence (complaint_id, created_at);
create index if not exists complaint_evidence_scan_status_idx
  on public.complaint_evidence (scan_status, created_at);

create table if not exists public.complaint_status_history (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  from_status text
    check (from_status is null or from_status in ('received', 'in_review', 'additional_information_requested', 'investigating', 'closed', 'rejected')),
  to_status text not null
    check (to_status in ('received', 'in_review', 'additional_information_requested', 'investigating', 'closed', 'rejected')),
  changed_by_profile_id uuid references public.profiles(id) on delete set null,
  internal_note text check (internal_note is null or char_length(internal_note) <= 4000),
  user_visible_note text check (user_visible_note is null or char_length(user_visible_note) <= 2000),
  created_at timestamptz not null default clock_timestamp()
);

create index if not exists complaint_status_history_complaint_idx
  on public.complaint_status_history (complaint_id, created_at);

-- ---------------------------------------------------------------------------
-- Append-only audit and atomic rate-limit buckets
-- ---------------------------------------------------------------------------

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (action ~ '^[a-z][a-z0-9_.:-]{1,79}$'),
  resource_type text not null check (resource_type ~ '^[a-z][a-z0-9_.:-]{1,79}$'),
  resource_id text check (resource_id is null or char_length(resource_id) <= 200),
  target_profile_id uuid references public.profiles(id) on delete set null,
  request_id text check (request_id is null or char_length(request_id) <= 128),
  ip_hash text check (ip_hash is null or ip_hash ~ '^[a-f0-9]{64}$'),
  user_agent_hash text check (user_agent_hash is null or user_agent_hash ~ '^[a-f0-9]{64}$'),
  auth_aal text check (auth_aal is null or auth_aal in ('aal1', 'aal2', 'service', 'unknown')),
  outcome text not null check (outcome in ('success', 'denied', 'failure')),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object' and octet_length(metadata::text) <= 4096),
  created_at timestamptz not null default clock_timestamp()
);

create index if not exists audit_logs_actor_created_idx
  on public.audit_logs (actor_id, created_at desc);
create index if not exists audit_logs_resource_idx
  on public.audit_logs (resource_type, resource_id, created_at desc);
create index if not exists audit_logs_request_idx
  on public.audit_logs (request_id) where request_id is not null;

create table if not exists public.rate_limit_buckets (
  scope text not null check (scope ~ '^[a-z][a-z0-9_.:-]{1,79}$'),
  subject_hash text not null check (char_length(subject_hash) between 16 and 128),
  window_started_at timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  expires_at timestamptz not null,
  primary key (scope, subject_hash, window_started_at)
);

create index if not exists rate_limit_buckets_expiry_idx
  on public.rate_limit_buckets (expires_at);

-- ---------------------------------------------------------------------------
-- Security helper functions
-- ---------------------------------------------------------------------------

create or replace function public.current_auth_aal()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    nullif(auth.jwt() ->> 'aal', ''),
    case when auth.role() = 'service_role' then 'service' else 'unknown' end
  );
$$;

create or replace function public.has_role(p_role_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(exists (
    select 1
    from public.profile_roles pr
    join public.roles r on r.key = pr.role_key
    join public.profiles p on p.id = pr.profile_id
    left join public.admin_security a on a.profile_id = pr.profile_id
    where pr.profile_id = auth.uid()
      and pr.role_key = lower(p_role_key)
      and p.status = 'active'
      and (not r.requires_aal2 or public.current_auth_aal() = 'aal2')
      and (
        pr.role_key <> 'admin'
        or (a.mfa_required and (a.suspended_until is null or a.suspended_until <= clock_timestamp()))
      )
  ), false);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select public.has_role('admin'); $$;

create or replace function public.request_id_from_context()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_headers jsonb;
begin
  begin
    v_headers := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    return null;
  end;
  return left(nullif(v_headers ->> 'x-request-id', ''), 128);
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

create or replace function public.audit_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row jsonb;
  v_resource_id text;
  v_changed jsonb := '[]'::jsonb;
  v_actor uuid := auth.uid();
begin
  if tg_op = 'DELETE' then
    v_row := to_jsonb(old);
  else
    v_row := to_jsonb(new);
  end if;

  v_resource_id := coalesce(
    v_row ->> 'id',
    v_row ->> 'profile_id',
    v_row ->> 'complaint_id',
    v_row ->> 'key',
    v_row ->> 'code'
  );

  if tg_op = 'UPDATE' then
    select coalesce(jsonb_agg(changed.key order by changed.key), '[]'::jsonb)
      into v_changed
    from jsonb_each(to_jsonb(new)) changed
    where (to_jsonb(old) -> changed.key) is distinct from changed.value
      and changed.key <> 'updated_at';
  end if;

  insert into public.audit_logs (
    actor_id, action, resource_type, resource_id, request_id,
    auth_aal, outcome, metadata
  ) values (
    case when exists (select 1 from public.profiles p where p.id = v_actor) then v_actor else null end,
    lower(tg_op),
    tg_table_name,
    v_resource_id,
    public.request_id_from_context(),
    public.current_auth_aal(),
    'success',
    jsonb_build_object('schema', tg_table_schema, 'changed_columns', v_changed)
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function public.prevent_immutable_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user <> 'postgres' then
    raise exception 'This record is append-only.' using errcode = '42501';
  end if;
  return old;
end;
$$;

create or replace function public.ensure_admin_security_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role_key = 'admin' then
    insert into public.admin_security (profile_id)
    values (new.profile_id)
    on conflict (profile_id) do nothing;
  end if;
  return new;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  if new.email is null or char_length(new.email) < 3 then
    raise exception 'Google-authenticated users must provide an email.';
  end if;

  v_name := left(coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    split_part(new.email, '@', 1)
  ), 120);

  insert into public.profiles (id, email, display_name)
  values (new.id, lower(new.email), v_name)
  on conflict (id) do update set email = excluded.email, updated_at = clock_timestamp();

  insert into public.profile_roles (profile_id, role_key)
  values (new.id, 'member')
  on conflict do nothing;

  return new;
end;
$$;

create or replace function public.sync_auth_user_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email and new.email is not null then
    update public.profiles
       set email = lower(new.email), updated_at = clock_timestamp()
     where id = new.id;
  end if;
  return new;
end;
$$;

-- Atomic fixed-window counter. IPs must arrive as a keyed HMAC from the app;
-- never store a raw address or a plain hash. This function is server-only.
create or replace function public.consume_rate_limit(
  p_scope text,
  p_subject_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window_start timestamptz;
  v_count integer;
  v_retry integer;
begin
  if p_scope !~ '^[a-z][a-z0-9_.:-]{1,79}$'
     or char_length(p_subject_hash) not between 16 and 128
     or p_limit not between 1 and 10000
     or p_window_seconds not between 1 and 86400 then
    raise exception 'Invalid rate-limit configuration.' using errcode = '22023';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limit_buckets (
    scope, subject_hash, window_started_at, request_count, expires_at
  ) values (
    p_scope,
    p_subject_hash,
    v_window_start,
    1,
    v_window_start + make_interval(secs => p_window_seconds)
  )
  on conflict (scope, subject_hash, window_started_at)
  do update set request_count = public.rate_limit_buckets.request_count + 1
  returning request_count into v_count;

  v_retry := greatest(0, ceil(extract(epoch from
    (v_window_start + make_interval(secs => p_window_seconds) - v_now)
  ))::integer);

  return query select
    v_count <= p_limit,
    greatest(0, p_limit - v_count),
    case when v_count <= p_limit then 0 else v_retry end;
end;
$$;

-- App-facing boolean RPC. `p_key` is a scoped user key or a keyed HMAC for
-- network/device identifiers. It is server-only and intentionally reveals no
-- counter state.
create or replace function public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_allowed boolean;
begin
  if auth.role() <> 'service_role' and current_user <> 'postgres' then
    raise exception 'Server authorization required.' using errcode = '42501';
  end if;
  select r.allowed into v_allowed
  from public.consume_rate_limit('app', p_key, p_limit, p_window_seconds) r;
  return coalesce(v_allowed, false);
end;
$$;

-- Grants exactly one calendar month after a payment was independently
-- confirmed with Tilopay. This RPC is intentionally service-role only: a
-- browser, callback, or webhook body can never select a plan, duration,
-- owner, or subscription state.
create or replace function public.grant_tilopay_membership(
  p_transaction_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_transaction public.payment_transactions%rowtype;
  v_plan_id uuid;
  v_billing_interval text;
  v_subscription_id uuid;
  v_access_until timestamptz;
  v_period_start timestamptz;
  v_period_end timestamptz;
begin
  if auth.role() <> 'service_role' and current_user <> 'postgres' then
    raise exception 'Server authorization required.' using errcode = '42501';
  end if;

  select t.*
    into v_transaction
  from public.payment_transactions t
  where t.id = p_transaction_id
    and t.provider = 'tilopay'
  for update;

  if not found or v_transaction.status <> 'approved' then
    raise exception 'Verified active monthly payment required.' using errcode = '22023';
  end if;

  select pp.plan_id, pp.billing_interval
    into v_plan_id, v_billing_interval
  from public.plan_prices pp
  where pp.id = v_transaction.plan_price_id;

  if not found
     or v_billing_interval <> 'month'
     or not exists (
       select 1 from public.profiles p
       where p.id = v_transaction.user_id and p.status = 'active'
     ) then
    raise exception 'Verified active monthly payment required.' using errcode = '22023';
  end if;

  -- Retrying the same provider event cannot add a second month.
  if v_transaction.subscription_id is not null then
    return v_transaction.subscription_id;
  end if;

  -- Serialise different approved payments for the same person and plan, so a
  -- concurrent webhook/callback pair extends one subscription sequentially.
  perform pg_advisory_xact_lock(
    hashtextextended(v_transaction.user_id::text || ':' || v_plan_id::text, 0)
  );

  select s.id, s.access_until
    into v_subscription_id, v_access_until
  from public.subscriptions s
  where s.user_id = v_transaction.user_id
    and s.plan_id = v_plan_id
    and s.provider = 'tilopay'
    and s.status in ('active', 'pending', 'past_due')
  order by s.access_until desc nulls last, s.created_at desc
  limit 1
  for update;

  v_period_start := greatest(clock_timestamp(), coalesce(v_access_until, clock_timestamp()));
  v_period_end := v_period_start + interval '1 month';

  if v_subscription_id is null then
    insert into public.subscriptions (
      user_id, plan_id, plan_price_id, provider, status,
      current_period_start, current_period_end, access_until,
      cancel_at_period_end, canceled_at, ended_at
    ) values (
      v_transaction.user_id, v_plan_id, v_transaction.plan_price_id, 'tilopay', 'active',
      v_period_start, v_period_end, v_period_end,
      false, null, null
    )
    returning id into v_subscription_id;
  else
    update public.subscriptions
       set plan_price_id = v_transaction.plan_price_id,
           status = 'active',
           current_period_start = v_period_start,
           current_period_end = v_period_end,
           access_until = v_period_end,
           cancel_at_period_end = false,
           canceled_at = null,
           ended_at = null
     where id = v_subscription_id;
  end if;

  update public.payment_transactions
     set subscription_id = v_subscription_id
   where id = v_transaction.id
     and subscription_id is null;

  return v_subscription_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Narrow RPC boundary: callers cannot submit owner, status, role, or timestamps
-- ---------------------------------------------------------------------------

create or replace function public.create_complaint(
  p_category_code text,
  p_province_code text,
  p_canton_code text,
  p_district_code text,
  p_encrypted_payload text,
  p_encryption_key_version text,
  p_payload_fingerprint text default null,
  p_truth_accepted boolean default false,
  p_privacy_accepted boolean default false,
  p_urgent_notice_accepted boolean default false
)
returns table (complaint_id uuid, tracking_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_complaint_id uuid;
  v_tracking_code text;
  v_allowed boolean;
begin
  if v_user_id is null or not exists (
    select 1 from public.profiles p where p.id = v_user_id and p.status = 'active'
  ) then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  -- Internal helper call runs under this SECURITY DEFINER function's owner.
  -- Authenticated callers cannot execute consume_rate_limit directly.
  select r.allowed into v_allowed
  from public.consume_rate_limit('complaint:create', v_user_id::text, 5, 3600) r;
  if not coalesce(v_allowed, false) then
    raise exception 'Rate limit exceeded.' using errcode = 'P0001';
  end if;

  if p_truth_accepted is not true
     or p_privacy_accepted is not true
     or p_urgent_notice_accepted is not true then
    raise exception 'Required declarations were not accepted.' using errcode = '22023';
  end if;
  if not exists (
    select 1
    from public.complaint_categories category
    join public.provinces province
      on province.code = p_province_code and province.is_active
    join public.cantons canton
      on canton.code = p_canton_code
     and canton.province_code = province.code
     and canton.is_active
    join public.districts district
      on district.code = p_district_code
     and district.canton_code = canton.code
     and district.is_active
    where category.code = p_category_code and category.is_active
  ) then
    raise exception 'Invalid complaint category or location.' using errcode = '22023';
  end if;
  if p_province_code !~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,19}$'
     or p_canton_code !~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,29}$'
     or p_district_code !~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$'
     or char_length(p_encrypted_payload) not between 40 and 131072
     or p_encryption_key_version !~ '^[A-Za-z0-9._-]{1,50}$'
     or (p_payload_fingerprint is not null and p_payload_fingerprint !~ '^[a-f0-9]{64}$') then
    raise exception 'Invalid complaint payload.' using errcode = '22023';
  end if;

  insert into public.complaints (
    owner_id, category_code, province_code, canton_code, district_code,
    encrypted_payload, encryption_key_version, payload_fingerprint,
    truth_declaration_accepted, privacy_consent_accepted,
    urgent_channel_notice_accepted
  ) values (
    v_user_id, p_category_code, p_province_code, p_canton_code, p_district_code,
    p_encrypted_payload, p_encryption_key_version, p_payload_fingerprint,
    true, true, true
  )
  returning id, public.complaints.tracking_code
    into v_complaint_id, v_tracking_code;

  insert into public.complaint_status_history (
    complaint_id, to_status, changed_by_profile_id, user_visible_note
  ) values (
    v_complaint_id, 'received', v_user_id, 'Información recibida para revisión inicial.'
  );

  return query select v_complaint_id, v_tracking_code;
end;
$$;

create or replace function public.staff_set_complaint_status(
  p_complaint_id uuid,
  p_new_status text,
  p_internal_note text default null,
  p_user_visible_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_status text;
  v_actor uuid := auth.uid();
  v_transition_allowed boolean := false;
begin
  if not (public.has_role('admin') or public.has_role('moderator')) then
    raise exception 'AAL2 staff authorization required.' using errcode = '42501';
  end if;
  if p_new_status not in (
    'received', 'in_review', 'additional_information_requested',
    'investigating', 'closed', 'rejected'
  ) or char_length(coalesce(p_internal_note, '')) > 4000
    or char_length(coalesce(p_user_visible_note, '')) > 2000 then
    raise exception 'Invalid status update.' using errcode = '22023';
  end if;

  select c.status into v_old_status
  from public.complaints c
  where c.id = p_complaint_id
  for update;
  if v_old_status is null then
    raise exception 'Complaint not found.' using errcode = 'P0002';
  end if;

  v_transition_allowed := case v_old_status
    when 'received' then p_new_status in ('in_review', 'rejected')
    when 'in_review' then p_new_status in ('additional_information_requested', 'investigating', 'closed', 'rejected')
    when 'additional_information_requested' then p_new_status in ('in_review', 'investigating', 'closed', 'rejected')
    when 'investigating' then p_new_status in ('additional_information_requested', 'closed', 'rejected')
    else false
  end;
  if not v_transition_allowed then
    raise exception 'Invalid status transition.' using errcode = '22023';
  end if;

  update public.complaints
     set status = p_new_status,
         closed_at = case when p_new_status in ('closed', 'rejected') then clock_timestamp() else null end
   where id = p_complaint_id;

  insert into public.complaint_status_history (
    complaint_id, from_status, to_status, changed_by_profile_id,
    internal_note, user_visible_note
  ) values (
    p_complaint_id, v_old_status, p_new_status, v_actor,
    nullif(trim(p_internal_note), ''), nullif(trim(p_user_visible_note), '')
  );
end;
$$;

create or replace function public.register_complaint_evidence(
  p_complaint_id uuid,
  p_uploaded_by_profile_id uuid,
  p_storage_object_path text,
  p_encrypted_original_filename text,
  p_filename_encryption_key_version text,
  p_detected_mime_type text,
  p_size_bytes bigint,
  p_sha256 text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := gen_random_uuid();
begin
  if auth.role() <> 'service_role' and current_user <> 'postgres' then
    raise exception 'Server authorization required.' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.complaints c
    where c.id = p_complaint_id and c.owner_id = p_uploaded_by_profile_id
  ) or split_part(p_storage_object_path, '/', 1) <> p_uploaded_by_profile_id::text
     or split_part(p_storage_object_path, '/', 2) <> p_complaint_id::text
     or p_storage_object_path !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|pdf|mp4|webm)$'
     or p_detected_mime_type is null
     or p_detected_mime_type not in ('image/jpeg', 'image/png', 'application/pdf', 'video/mp4', 'video/webm')
     or p_size_bytes is null or p_size_bytes not between 1 and 12582912
     or p_sha256 is null or p_sha256 !~ '^[a-f0-9]{64}$'
     or p_encrypted_original_filename is null
     or char_length(p_encrypted_original_filename) not between 40 and 4096
     or p_filename_encryption_key_version is null
     or p_filename_encryption_key_version !~ '^[A-Za-z0-9._-]{1,50}$' then
    raise exception 'Invalid evidence metadata.' using errcode = '22023';
  end if;

  insert into public.complaint_evidence (
    id, complaint_id, uploaded_by_profile_id, storage_object_path,
    encrypted_original_filename, filename_encryption_key_version,
    detected_mime_type, size_bytes, sha256
  ) values (
    v_id, p_complaint_id, p_uploaded_by_profile_id, p_storage_object_path,
    p_encrypted_original_filename, p_filename_encryption_key_version,
    p_detected_mime_type, p_size_bytes, p_sha256
  );
  return v_id;
end;
$$;

create or replace function public.mark_evidence_scan(
  p_evidence_id uuid,
  p_scan_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() <> 'service_role' and current_user <> 'postgres' then
    raise exception 'Server authorization required.' using errcode = '42501';
  end if;
  if p_scan_status not in ('clean', 'quarantined', 'rejected') then
    raise exception 'Invalid scan status.' using errcode = '22023';
  end if;
  update public.complaint_evidence
     set scan_status = p_scan_status, scan_completed_at = clock_timestamp()
   where id = p_evidence_id and scan_status = 'pending';
  if not found then
    raise exception 'Pending evidence not found.' using errcode = 'P0002';
  end if;
end;
$$;

-- Application calls this for reads/downloads because SELECT triggers do not
-- exist. Hashes must be keyed HMACs produced outside the database.
create or replace function public.record_sensitive_access(
  p_actor_id uuid,
  p_action text,
  p_resource_type text,
  p_resource_id text,
  p_outcome text,
  p_request_id text default null,
  p_ip_hash text default null,
  p_user_agent_hash text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := gen_random_uuid();
begin
  if auth.role() <> 'service_role' and current_user <> 'postgres' then
    raise exception 'Server authorization required.' using errcode = '42501';
  end if;
  if p_action !~ '^[a-z][a-z0-9_.:-]{1,79}$'
     or p_resource_type !~ '^[a-z][a-z0-9_.:-]{1,79}$'
     or char_length(coalesce(p_resource_id, '')) > 200
     or p_outcome not in ('success', 'denied', 'failure')
     or char_length(coalesce(p_request_id, '')) > 128
     or (p_ip_hash is not null and p_ip_hash !~ '^[a-f0-9]{64}$')
     or (p_user_agent_hash is not null and p_user_agent_hash !~ '^[a-f0-9]{64}$')
     or jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) <> 'object'
     or octet_length(coalesce(p_metadata, '{}'::jsonb)::text) > 4096 then
    raise exception 'Invalid audit event.' using errcode = '22023';
  end if;

  insert into public.audit_logs (
    id, actor_id, action, resource_type, resource_id, request_id,
    ip_hash, user_agent_hash, auth_aal, outcome, metadata
  ) values (
    v_id, p_actor_id, p_action, p_resource_type, nullif(p_resource_id, ''),
    nullif(p_request_id, ''), p_ip_hash, p_user_agent_hash,
    public.current_auth_aal(), p_outcome, coalesce(p_metadata, '{}'::jsonb)
  );
  return v_id;
end;
$$;

-- Owner-safe read functions never return ciphertext, internal notes, provider
-- identifiers, payment failure details, or administrative fields.
create or replace function public.my_security_context()
returns table (
  profile_id uuid,
  email text,
  display_name text,
  status text,
  aal text,
  roles text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.email, p.display_name, p.status, public.current_auth_aal(),
         coalesce(array_agg(pr.role_key order by pr.role_key)
           filter (where pr.role_key is not null), '{}'::text[])
  from public.profiles p
  left join public.profile_roles pr on pr.profile_id = p.id
  where p.id = auth.uid()
  group by p.id, p.email, p.display_name, p.status;
$$;

create or replace function public.my_complaints(
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  complaint_id uuid,
  tracking_code text,
  category_name text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.tracking_code, cc.name, c.status, c.created_at, c.updated_at
  from public.complaints c
  join public.complaint_categories cc on cc.code = c.category_code
  join public.profiles p on p.id = c.owner_id and p.status = 'active'
  where c.owner_id = auth.uid()
  order by c.created_at desc
  limit greatest(1, least(coalesce(p_limit, 20), 100))
  offset greatest(0, coalesce(p_offset, 0));
$$;

create or replace function public.my_complaint_timeline(p_complaint_id uuid)
returns table (
  history_id uuid,
  status text,
  note text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select h.id, h.to_status, h.user_visible_note, h.created_at
  from public.complaint_status_history h
  join public.complaints c on c.id = h.complaint_id
  join public.profiles p on p.id = c.owner_id and p.status = 'active'
  where c.id = p_complaint_id
    and c.owner_id = auth.uid()
    and h.user_visible_note is not null
  order by h.created_at asc;
$$;

create or replace function public.my_subscription_summary()
returns table (
  subscription_id uuid,
  plan_code text,
  plan_name text,
  status text,
  access_until timestamptz,
  cancel_at_period_end boolean,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, p.code, p.name, s.status, s.access_until,
         s.cancel_at_period_end, s.updated_at
  from public.subscriptions s
  join public.plans p on p.id = s.plan_id
  join public.profiles owner on owner.id = s.user_id and owner.status = 'active'
  where s.user_id = auth.uid()
  order by s.created_at desc;
$$;

-- Storage helper: upload path is <user UUID>/<complaint UUID>/<opaque UUID>.<ext>.
create or replace function public.can_upload_complaint_object(
  p_bucket_id text,
  p_object_name text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_parts text[];
  v_complaint_id uuid;
begin
  if v_uid is null or p_bucket_id <> 'complaint-evidence'
     or p_object_name !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|pdf|mp4|webm)$' then
    return false;
  end if;
  v_parts := storage.foldername(p_object_name);
  if cardinality(v_parts) <> 2 or v_parts[1] <> v_uid::text then
    return false;
  end if;
  begin
    v_complaint_id := v_parts[2]::uuid;
  exception when invalid_text_representation then
    return false;
  end;
  return exists (
    select 1 from public.complaints c
    join public.profiles p on p.id = c.owner_id and p.status = 'active'
    where c.id = v_complaint_id and c.owner_id = v_uid
  );
end;
$$;

-- Used by the backend before issuing a short-lived signed download URL. There
-- is intentionally no authenticated SELECT policy on storage.objects, so every
-- evidence read can be recorded with record_sensitive_access().
create or replace function public.can_read_complaint_object(
  p_bucket_id text,
  p_object_name text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(exists (
    select 1
    from public.complaint_evidence e
    join public.complaints c on c.id = e.complaint_id
    join public.profiles p on p.id = c.owner_id and p.status = 'active'
    where e.bucket_id = p_bucket_id
      and e.storage_object_path = p_object_name
      and e.scan_status = 'clean'
      and e.removed_at is null
      and c.owner_id = auth.uid()
  ), false);
$$;

-- ---------------------------------------------------------------------------
-- Auth synchronization, updated_at, immutability, and mutation audit triggers
-- ---------------------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
after update of email on auth.users
for each row execute function public.sync_auth_user_email();

-- Backfill if the migration is applied after Google Auth was enabled.
insert into public.profiles (id, email, display_name)
select u.id,
       lower(u.email),
       left(coalesce(
         nullif(u.raw_user_meta_data ->> 'full_name', ''),
         nullif(u.raw_user_meta_data ->> 'name', ''),
         split_part(u.email, '@', 1)
       ), 120)
from auth.users u
where u.email is not null
on conflict (id) do nothing;

insert into public.profile_roles (profile_id, role_key)
select p.id, 'member' from public.profiles p
on conflict do nothing;

insert into public.admin_security (profile_id)
select pr.profile_id
from public.profile_roles pr
where pr.role_key = 'admin'
on conflict (profile_id) do nothing;

drop trigger if exists profile_roles_ensure_admin_security on public.profile_roles;
create trigger profile_roles_ensure_admin_security
after insert on public.profile_roles
for each row execute function public.ensure_admin_security_row();

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'profiles', 'roles', 'admin_security', 'plans', 'plan_prices',
    'subscriptions', 'payment_transactions', 'complaints',
    'complaint_categories', 'provinces', 'cantons', 'districts'
  ] loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', v_table, v_table);
    execute format(
      'create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      v_table, v_table
    );
  end loop;
end $$;

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'profiles', 'roles', 'profile_roles', 'admin_security', 'plans',
    'plan_prices', 'subscriptions', 'payment_transactions',
    'payment_provider_events', 'complaint_categories', 'provinces', 'cantons',
    'districts', 'complaints',
    'complaint_evidence', 'complaint_status_history'
  ] loop
    execute format('drop trigger if exists %I_audit_mutation on public.%I', v_table, v_table);
    execute format(
      'create trigger %I_audit_mutation after insert or update or delete on public.%I for each row execute function public.audit_mutation()',
      v_table, v_table
    );
  end loop;
end $$;

drop trigger if exists audit_logs_append_only on public.audit_logs;
create trigger audit_logs_append_only
before update or delete on public.audit_logs
for each row execute function public.prevent_immutable_mutation();

drop trigger if exists complaint_status_history_append_only on public.complaint_status_history;
create trigger complaint_status_history_append_only
before update or delete on public.complaint_status_history
for each row execute function public.prevent_immutable_mutation();

-- ---------------------------------------------------------------------------
-- RLS: enabled and forced on every application table
-- ---------------------------------------------------------------------------

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'profiles', 'roles', 'profile_roles', 'admin_security', 'plans',
    'plan_prices', 'subscriptions', 'payment_transactions',
    'payment_provider_events', 'complaint_categories', 'provinces', 'cantons',
    'districts', 'complaints', 'complaint_evidence',
    'complaint_status_history', 'audit_logs', 'rate_limit_buckets'
  ] loop
    execute format('alter table public.%I enable row level security', v_table);
    execute format('alter table public.%I force row level security', v_table);
  end loop;
end $$;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select to authenticated
using (id = (select auth.uid()));
drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_admin on public.profiles
for select to authenticated
using (public.is_admin());
drop policy if exists profiles_update_own_safe_columns on public.profiles;
create policy profiles_update_own_safe_columns on public.profiles
for update to authenticated
using (id = (select auth.uid()) and status = 'active')
with check (id = (select auth.uid()) and status = 'active');

drop policy if exists roles_read_authenticated on public.roles;
create policy roles_read_authenticated on public.roles
for select to authenticated using (true);

drop policy if exists profile_roles_read_own on public.profile_roles;
create policy profile_roles_read_own on public.profile_roles
for select to authenticated
using (profile_id = (select auth.uid()) or public.is_admin());

drop policy if exists admin_security_read_own on public.admin_security;
create policy admin_security_read_own on public.admin_security
for select to authenticated
using (profile_id = (select auth.uid()) or public.is_admin());

drop policy if exists plans_public_active on public.plans;
create policy plans_public_active on public.plans
for select to anon, authenticated
using (is_active);
drop policy if exists plans_admin_all on public.plans;
create policy plans_admin_all on public.plans
for select to authenticated using (public.is_admin());
drop policy if exists plan_prices_public_active on public.plan_prices;
create policy plan_prices_public_active on public.plan_prices
for select to anon, authenticated
using (
  is_active and exists (select 1 from public.plans p where p.id = plan_id and p.is_active)
);
drop policy if exists plan_prices_admin_all on public.plan_prices;
create policy plan_prices_admin_all on public.plan_prices
for select to authenticated using (public.is_admin());

drop policy if exists subscriptions_read_own on public.subscriptions;
create policy subscriptions_read_own on public.subscriptions
for select to authenticated
using (
  (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.status = 'active'
    )
  )
  or public.has_role('admin')
  or public.has_role('finance')
);

drop policy if exists payment_transactions_read_own on public.payment_transactions;
create policy payment_transactions_read_own on public.payment_transactions
for select to authenticated
using (
  (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.status = 'active'
    )
  )
  or public.has_role('admin')
  or public.has_role('finance')
);

drop policy if exists payment_provider_events_staff_read on public.payment_provider_events;
create policy payment_provider_events_staff_read on public.payment_provider_events
for select to authenticated
using (public.has_role('admin') or public.has_role('finance'));

drop policy if exists complaint_categories_public_active on public.complaint_categories;
create policy complaint_categories_public_active on public.complaint_categories
for select to anon, authenticated
using (is_active);
drop policy if exists complaint_categories_staff_all on public.complaint_categories;
create policy complaint_categories_staff_all on public.complaint_categories
for select to authenticated
using (public.is_admin() or public.has_role('moderator'));

drop policy if exists provinces_public_active on public.provinces;
create policy provinces_public_active on public.provinces
for select to anon, authenticated
using (is_active);
drop policy if exists provinces_staff_all on public.provinces;
create policy provinces_staff_all on public.provinces
for select to authenticated
using (public.is_admin() or public.has_role('moderator'));

drop policy if exists cantons_public_active on public.cantons;
create policy cantons_public_active on public.cantons
for select to anon, authenticated
using (
  is_active and exists (
    select 1 from public.provinces p
    where p.code = province_code and p.is_active
  )
);
drop policy if exists cantons_staff_all on public.cantons;
create policy cantons_staff_all on public.cantons
for select to authenticated
using (public.is_admin() or public.has_role('moderator'));

drop policy if exists districts_public_active on public.districts;
create policy districts_public_active on public.districts
for select to anon, authenticated
using (
  is_active and exists (
    select 1
    from public.cantons c
    join public.provinces p on p.code = c.province_code and p.is_active
    where c.code = canton_code and c.is_active
  )
);
drop policy if exists districts_staff_all on public.districts;
create policy districts_staff_all on public.districts
for select to authenticated
using (public.is_admin() or public.has_role('moderator'));

drop policy if exists complaints_read_owner_or_staff on public.complaints;
create policy complaints_read_owner_or_staff on public.complaints
for select to authenticated
using (
  (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.status = 'active'
    )
  )
  or public.is_admin()
  or public.has_role('moderator')
);

drop policy if exists complaint_evidence_clean_owner_or_staff on public.complaint_evidence;
create policy complaint_evidence_clean_owner_or_staff on public.complaint_evidence
for select to authenticated
using (
  removed_at is null
  and (
    (scan_status = 'clean' and exists (
      select 1
      from public.complaints c
      join public.profiles p on p.id = c.owner_id and p.status = 'active'
      where c.id = complaint_id and c.owner_id = (select auth.uid())
    ))
    or public.is_admin()
    or public.has_role('moderator')
  )
);

drop policy if exists complaint_status_history_owner_visible_or_staff on public.complaint_status_history;
create policy complaint_status_history_owner_visible_or_staff on public.complaint_status_history
for select to authenticated
using (
  (
    user_visible_note is not null and exists (
      select 1
      from public.complaints c
      join public.profiles p on p.id = c.owner_id and p.status = 'active'
      where c.id = complaint_id and c.owner_id = (select auth.uid())
    )
  )
  or public.is_admin()
  or public.has_role('moderator')
);

drop policy if exists audit_logs_admin_read on public.audit_logs;
create policy audit_logs_admin_read on public.audit_logs
for select to authenticated using (public.is_admin());

-- No client policy is created for rate_limit_buckets. The server-only function
-- is the only supported boundary.

-- ---------------------------------------------------------------------------
-- Explicit privileges and column protections
-- ---------------------------------------------------------------------------

revoke all on table public.profiles, public.roles, public.profile_roles,
  public.admin_security, public.plans, public.plan_prices, public.subscriptions,
  public.payment_transactions, public.payment_provider_events,
  public.complaint_categories, public.provinces, public.cantons,
  public.districts, public.complaints, public.complaint_evidence,
  public.complaint_status_history, public.audit_logs,
  public.rate_limit_buckets
from public, anon, authenticated;

grant select (id, code, name, description, is_active, created_at, updated_at)
  on public.plans to anon, authenticated;
grant select (id, plan_id, currency, amount_minor, billing_interval, provider, is_active, created_at, updated_at)
  on public.plan_prices to anon, authenticated;
grant select (code, name, is_active)
  on public.complaint_categories to anon, authenticated;
grant select (code, name, is_active)
  on public.provinces to anon, authenticated;
grant select (code, province_code, name, is_active)
  on public.cantons to anon, authenticated;
grant select (code, canton_code, name, is_active)
  on public.districts to anon, authenticated;

grant select (id, email, display_name, status, locale, last_seen_at, created_at, updated_at)
  on public.profiles to authenticated;
grant update (display_name, locale) on public.profiles to authenticated;
grant select (key, name, description, requires_aal2)
  on public.roles to authenticated;
grant select (profile_id, role_key, granted_at)
  on public.profile_roles to authenticated;
grant select (profile_id, mfa_required, suspended_until, last_aal2_seen_at, access_reviewed_at)
  on public.admin_security to authenticated;
grant select (id, user_id, plan_id, plan_price_id, status, current_period_start,
  current_period_end, access_until, cancel_at_period_end, canceled_at, ended_at,
  created_at, updated_at)
  on public.subscriptions to authenticated;
grant select (id, user_id, subscription_id, plan_price_id, kind, status, amount_minor,
  currency, approved_at, created_at, updated_at)
  on public.payment_transactions to authenticated;
grant select (id, provider, provider_event_id, event_type, signature_verified,
  provider_state_confirmed, processing_status, transaction_id, subscription_id,
  attempt_count, received_at, processed_at)
  on public.payment_provider_events to authenticated;
grant select (id, tracking_code, category_code, province_code, canton_code,
  district_code, status, created_at, updated_at)
  on public.complaints to authenticated;
grant select (id, complaint_id, detected_mime_type, size_bytes, sha256,
  scan_status, removed_at, created_at)
  on public.complaint_evidence to authenticated;
grant select (id, complaint_id, from_status, to_status, user_visible_note, created_at)
  on public.complaint_status_history to authenticated;
grant select (id, actor_id, action, resource_type, resource_id, request_id,
  auth_aal, outcome, created_at)
  on public.audit_logs to authenticated;

grant all privileges on table public.profiles, public.roles, public.profile_roles,
  public.admin_security, public.plans, public.plan_prices, public.subscriptions,
  public.payment_transactions, public.payment_provider_events,
  public.complaint_categories, public.provinces, public.cantons,
  public.districts, public.complaints, public.complaint_evidence,
  public.complaint_status_history, public.audit_logs,
  public.rate_limit_buckets
to service_role;

revoke all on function public.new_tracking_code() from public, anon, authenticated;
revoke all on function public.current_auth_aal() from public, anon;
revoke all on function public.has_role(text) from public, anon;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.request_id_from_context() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.audit_mutation() from public, anon, authenticated;
revoke all on function public.prevent_immutable_mutation() from public, anon, authenticated;
revoke all on function public.ensure_admin_security_row() from public, anon, authenticated;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.sync_auth_user_email() from public, anon, authenticated;
revoke all on function public.consume_rate_limit(text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.grant_tilopay_membership(uuid) from public, anon, authenticated;
revoke all on function public.create_complaint(text, text, text, text, text, text, text, boolean, boolean, boolean) from public, anon;
revoke all on function public.staff_set_complaint_status(uuid, text, text, text) from public, anon;
revoke all on function public.register_complaint_evidence(uuid, uuid, text, text, text, text, bigint, text) from public, anon, authenticated;
revoke all on function public.mark_evidence_scan(uuid, text) from public, anon, authenticated;
revoke all on function public.record_sensitive_access(uuid, text, text, text, text, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.my_security_context() from public, anon;
revoke all on function public.my_complaints(integer, integer) from public, anon;
revoke all on function public.my_complaint_timeline(uuid) from public, anon;
revoke all on function public.my_subscription_summary() from public, anon;
revoke all on function public.can_upload_complaint_object(text, text) from public, anon;
revoke all on function public.can_read_complaint_object(text, text) from public, anon;

grant execute on function public.current_auth_aal() to authenticated, service_role;
grant execute on function public.has_role(text) to authenticated, service_role;
grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.create_complaint(text, text, text, text, text, text, text, boolean, boolean, boolean)
  to authenticated;
grant execute on function public.staff_set_complaint_status(uuid, text, text, text)
  to authenticated;
grant execute on function public.my_security_context(),
  public.my_complaints(integer, integer),
  public.my_complaint_timeline(uuid),
  public.my_subscription_summary(),
  public.can_upload_complaint_object(text, text),
  public.can_read_complaint_object(text, text)
to authenticated;
grant execute on function public.consume_rate_limit(text, text, integer, integer),
  public.check_rate_limit(text, integer, integer),
  public.grant_tilopay_membership(uuid),
  public.register_complaint_evidence(uuid, uuid, text, text, text, text, bigint, text),
  public.mark_evidence_scan(uuid, text),
  public.record_sensitive_access(uuid, text, text, text, text, text, text, text, jsonb)
to service_role;

-- ---------------------------------------------------------------------------
-- Private Storage bucket and ownership policy
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'complaint-evidence',
  'complaint-evidence',
  false,
  12582912,
  array['image/jpeg', 'image/png', 'application/pdf', 'video/mp4', 'video/webm']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists complaint_evidence_upload_owned_prefix on storage.objects;
create policy complaint_evidence_upload_owned_prefix
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'complaint-evidence'
  and public.can_upload_complaint_object(bucket_id, name)
);

-- Intentionally no authenticated SELECT/UPDATE/DELETE policy for this bucket.
-- The backend checks can_read_complaint_object(), records the read/download,
-- and then returns a short-lived signed URL. This preserves access auditing.

comment on table public.rate_limit_buckets is
  'Server-only fixed-window counters. For IP/device subjects, store a keyed HMAC, never a raw identifier.';
comment on table public.payment_provider_events is
  'Idempotent Tilopay event inbox containing hashes and normalized metadata only; never raw webhook/card data.';
comment on table public.audit_logs is
  'Append-only mutation and sensitive-access ledger. Metadata must remain value-minimized.';

commit;
