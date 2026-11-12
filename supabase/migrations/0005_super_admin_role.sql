-- Add super_admin role for secure platform administration
-- This role has full access to all administrative functions

insert into public.roles (key, name, description, requires_aal2, is_system)
values (
  'super_admin',
  'Super Administración',
  'Acceso total a todas las funciones administrativas, incluyendo gestión de roles y configuración de seguridad.',
  true,
  true
)
on conflict (key) do update
set name = excluded.name,
    description = excluded.description,
    requires_aal2 = excluded.requires_aal2,
    is_system = excluded.is_system,
    updated_at = clock_timestamp();

-- Ensure super_admin has admin_security row with MFA required
insert into public.admin_security (profile_id)
select pr.profile_id
from public.profile_roles pr
where pr.role_key = 'super_admin'
on conflict (profile_id) do nothing;