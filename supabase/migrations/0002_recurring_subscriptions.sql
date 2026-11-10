-- Recurring subscription support for the Tilopay plan flow.
-- Additive only: it does not alter or drop any object created by 0001.
-- No credentials, plan ids, or environment-specific values are stored here.

begin;

-- ---------------------------------------------------------------------------
-- Recurring charge linkage
-- ---------------------------------------------------------------------------

-- Tilopay identifies a recurring subscriber per plan by email, so the local
-- subscription reference is "<planId>:<email>" in `provider_subscription_id`.
-- 0001 already enforces uniqueness on (provider, provider_subscription_id);
-- this comment records the agreed format so future readers do not guess.
comment on column public.subscriptions.provider_subscription_id is
  'Tilopay recurring reference: "<plan_id>:<lowercased email>". Unique per provider.';

-- A recurring charge may arrive before the associated transaction is visible to
-- the reconciler. This index keeps the lookup that guards idempotency cheap.
create index if not exists payment_transactions_recurring_order_idx
  on public.payment_transactions (provider, provider_order_number)
  where kind = 'charge' and subscription_id is not null;

-- ---------------------------------------------------------------------------
-- Access window semantics for recurring plans
-- ---------------------------------------------------------------------------

-- Access is granted for the window already paid for. A cancellation or a failed
-- renewal never shortens `access_until`; it stops future extension instead.
comment on column public.subscriptions.access_until is
  'End of the paid access window. Only extended after a confirmed charge; never reduced by cancel or past_due.';

create or replace function public.subscription_has_access(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.subscriptions s
     where s.user_id = p_user_id
       and s.status in ('active', 'past_due', 'canceled')
       and s.access_until is not null
       and s.access_until > clock_timestamp()
  );
$$;

revoke all on function public.subscription_has_access(uuid) from public, anon;
grant execute on function public.subscription_has_access(uuid) to authenticated;

comment on function public.subscription_has_access(uuid) is
  'True when the profile has a paid, unexpired access window. Canceled and past_due subscriptions keep access until access_until.';

-- ---------------------------------------------------------------------------
-- Expiry sweep
-- ---------------------------------------------------------------------------

-- Marks windows that have elapsed as expired. Safe to run repeatedly; the
-- caller is the scheduled job or the server, never an end user.
create or replace function public.expire_lapsed_subscriptions(p_limit integer default 500)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_updated integer;
begin
  if p_limit is null or p_limit < 1 or p_limit > 5000 then
    raise exception 'p_limit out of range';
  end if;

  with lapsed as (
    select s.id
      from public.subscriptions s
     where s.status in ('active', 'past_due', 'canceled')
       and s.access_until is not null
       and s.access_until <= clock_timestamp()
     order by s.access_until
     limit p_limit
     for update skip locked
  )
  update public.subscriptions s
     set status = 'expired',
         ended_at = coalesce(s.ended_at, clock_timestamp()),
         updated_at = clock_timestamp()
    from lapsed
   where s.id = lapsed.id;

  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

revoke all on function public.expire_lapsed_subscriptions(integer)
  from public, anon, authenticated;

comment on function public.expire_lapsed_subscriptions(integer) is
  'Server-only sweep that expires subscriptions whose paid window has elapsed. Never callable by an end user.';

-- ---------------------------------------------------------------------------
-- Owner-visible subscription detail
-- ---------------------------------------------------------------------------

-- Extends the 0001 summary with the fields a subscriber needs to understand
-- their own billing state. It exposes no provider credentials or card data.
create or replace function public.my_subscription_detail()
returns table (
  subscription_id uuid,
  plan_code text,
  plan_name text,
  status text,
  amount_minor bigint,
  currency text,
  billing_interval text,
  current_period_end timestamptz,
  access_until timestamptz,
  cancel_at_period_end boolean,
  has_access boolean
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    s.id,
    p.code,
    p.name,
    s.status,
    pp.amount_minor,
    pp.currency,
    pp.billing_interval,
    s.current_period_end,
    s.access_until,
    s.cancel_at_period_end,
    (s.access_until is not null and s.access_until > clock_timestamp())
  from public.subscriptions s
  join public.plans p on p.id = s.plan_id
  left join public.plan_prices pp on pp.id = s.plan_price_id
  where s.user_id = (select auth.uid())
  order by s.created_at desc
  limit 1;
$$;

revoke all on function public.my_subscription_detail() from public, anon;
grant execute on function public.my_subscription_detail() to authenticated;

comment on function public.my_subscription_detail() is
  'Owner-only view of the caller''s latest subscription. Returns billing state, never provider secrets.';

commit;
