create or replace function public.delete_empty_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare target_id uuid := auth.uid();
begin
  if target_id is null then raise exception 'not_authenticated'; end if;
  if exists(select 1 from public.complaints where owner_id = target_id)
    or exists(select 1 from public.subscriptions where user_id = target_id)
    or exists(select 1 from public.payment_transactions where user_id = target_id)
  then raise exception 'account_has_records'; end if;
  delete from public.profiles where id = target_id;
  delete from auth.users where id = target_id;
end;
$$;
revoke all on function public.delete_empty_account() from public, anon;
grant execute on function public.delete_empty_account() to authenticated;
