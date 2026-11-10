-- Migration 0003: Investigations, Advertisers Showcase & Complaint Categories
-- Focused on Rubén Rodríguez's authentic investigative work and commercial showcase.

begin;

-- ---------------------------------------------------------------------------
-- 1. Expanded Complaint Categories for Animal Welfare & Illegal Breeding
-- ---------------------------------------------------------------------------

insert into public.complaint_categories (code, name)
values
  ('maltrato_animal', 'Maltrato animal y crueldad'),
  ('criaderos_clandestinos', 'Criaderos clandestinos o peleas ilegales'),
  ('fauna_silvestre', 'Tráfico de fauna y vida silvestre')
on conflict (code) do update
set name = excluded.name,
    updated_at = clock_timestamp();

-- ---------------------------------------------------------------------------
-- 2. Commercial Membership Plan (₡3.500 / mes)
-- ---------------------------------------------------------------------------

insert into public.plans (code, name, description, is_active)
values
  ('commercial_monthly', 'Membresía Comercial', 'Vitrina comercial, hasta 10 productos/servicios y aparición en el carrusel publicitario.', true)
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    is_active = excluded.is_active,
    updated_at = clock_timestamp();

insert into public.plan_prices (plan_id, currency, amount_minor, billing_interval, provider)
select id, 'CRC', 350000, 'month', 'onvo'
from public.plans
where code = 'commercial_monthly'
on conflict (plan_id, currency, billing_interval, provider) do update
set amount_minor = excluded.amount_minor,
    updated_at = clock_timestamp();

-- ---------------------------------------------------------------------------
-- 3. Investigations and Exclusive Videos
-- ---------------------------------------------------------------------------

create table if not exists public.investigations (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 5 and 250),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  summary text not null check (char_length(summary) between 10 and 1000),
  content text not null,
  cover_image text not null,
  is_premium boolean not null default true,
  video_url text,
  video_duration text,
  author text not null default 'Rubén Rodríguez',
  category text not null,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz not null default clock_timestamp(),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create index if not exists investigations_slug_idx on public.investigations (slug);
create index if not exists investigations_status_published_idx on public.investigations (status, published_at desc);

-- ---------------------------------------------------------------------------
-- 4. Advertisers (Vitrina Comercial)
-- ---------------------------------------------------------------------------

create table if not exists public.advertisers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  business_name text not null check (char_length(business_name) between 2 and 150),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  logo_url text,
  description text not null check (char_length(description) between 10 and 2000),
  category text not null,
  whatsapp text not null check (char_length(whatsapp) between 8 and 30),
  phone text,
  website text,
  instagram text,
  facebook text,
  province_code text references public.provinces(code),
  canton_code text references public.cantons(code),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'paused')),
  rejection_reason text,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create index if not exists advertisers_status_idx on public.advertisers (status);
create index if not exists advertisers_slug_idx on public.advertisers (slug);

-- ---------------------------------------------------------------------------
-- 5. Advertiser Products & Services (Limit: max 10 per business)
-- ---------------------------------------------------------------------------

create table if not exists public.advertiser_products (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references public.advertisers(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 150),
  description text not null check (char_length(description) between 5 and 1500),
  category text not null,
  price_crc numeric(12, 2) check (price_crc is null or price_crc >= 0),
  image_url text not null,
  provider_url text,
  status text not null default 'approved' check (status in ('pending', 'approved', 'rejected')),
  sort_order integer not null default 0,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create index if not exists advertiser_products_advertiser_idx on public.advertiser_products (advertiser_id, sort_order asc);

-- Trigger to strictly guard the 10 products per advertiser limit
create or replace function public.check_advertiser_product_limit()
returns trigger as $$
begin
  if (select count(*) from public.advertiser_products where advertiser_id = NEW.advertiser_id) >= 10 then
    raise exception 'Un negocio no puede tener más de 10 productos o servicios registrados.';
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_check_advertiser_product_limit on public.advertiser_products;
create trigger trg_check_advertiser_product_limit
before insert on public.advertiser_products
for each row execute function public.check_advertiser_product_limit();

-- ---------------------------------------------------------------------------
-- 6. Row Level Security Policies
-- ---------------------------------------------------------------------------

alter table public.investigations enable row level security;
alter table public.advertisers enable row level security;
alter table public.advertiser_products enable row level security;

-- Public can read published investigations
create policy investigations_public_read on public.investigations
  for select
  using (status = 'published');

-- Public can read approved advertisers and their approved products
create policy advertisers_public_read on public.advertisers
  for select
  using (status = 'approved');

create policy advertiser_products_public_read on public.advertiser_products
  for select
  using (status = 'approved');

-- Owners can view and edit their own advertiser profiles and products
create policy advertisers_owner_manage on public.advertisers
  for all
  using (owner_id = auth.uid());

create policy advertiser_products_owner_manage on public.advertiser_products
  for all
  using (
    advertiser_id in (select id from public.advertisers where owner_id = auth.uid())
  );

-- Admins and moderators have full access
create policy investigations_admin_manage on public.investigations
  for all
  using (
    exists (
      select 1 from public.profile_roles pr
      where pr.profile_id = auth.uid() and pr.role_key in ('admin', 'moderator')
    )
  );

create policy advertisers_admin_manage on public.advertisers
  for all
  using (
    exists (
      select 1 from public.profile_roles pr
      where pr.profile_id = auth.uid() and pr.role_key in ('admin', 'moderator')
    )
  );

create policy advertiser_products_admin_manage on public.advertiser_products
  for all
  using (
    exists (
      select 1 from public.profile_roles pr
      where pr.profile_id = auth.uid() and pr.role_key in ('admin', 'moderator')
    )
  );

commit;
