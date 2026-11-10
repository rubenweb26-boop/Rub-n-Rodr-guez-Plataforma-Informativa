# Supabase: configuración segura

Esta migración prepara Supabase para Google OAuth, Postgres con RLS y un bucket privado de evidencias. No contiene claves ni activa producción por sí sola.

## Aplicación

1. Crear un proyecto Supabase para el entorno correspondiente.
2. Aplicar `supabase/migrations/0001_security_foundation.sql` con Supabase CLI (`supabase db push`) o desde el editor SQL en un proyecto vacío.
3. Verificar que todas las tablas de `public` muestran RLS habilitado y que `complaint-evidence` es privado.
4. Probar con dos usuarios distintos, un token anónimo y un administrador con `aal2`; nunca probar aislamiento solo con la clave `service_role`, porque esa clave omite RLS.

Antes de habilitar denuncias, cargar `provinces`, `cantons` y `districts` desde una fuente autorizada. Sus relaciones están protegidas por claves foráneas y solo las filas activas se exponen a `anon`/`authenticated`; ningún cliente puede modificar los catálogos.

Variables previstas:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
DATA_ENCRYPTION_KEY_V1=
DATA_ENCRYPTION_KEY_V2=
DATA_ENCRYPTION_KEY_VERSION=v1
AUDIT_HMAC_KEY=
RATE_LIMIT_HMAC_KEY=
```

Solo la URL y la clave **publishable** pueden llegar al navegador. `SUPABASE_SECRET_KEY` (o la clave heredada `SUPABASE_SERVICE_ROLE_KEY`), las claves de cifrado y las claves HMAC pertenecen al gestor de secretos del servidor. No se guardan en Git, logs, capturas ni variables `NEXT_PUBLIC_*`.

## Google OAuth y sesiones

Google Cloud Console entrega el Client ID y Client Secret; Supabase Auth administra OAuth y la sesión. Configurar esas credenciales en **Supabase Dashboard → Authentication → Providers → Google**, no en el frontend. En Google registrar el callback que muestra Supabase, normalmente `https://<project-ref>.supabase.co/auth/v1/callback`; en Supabase limitar los redirect URLs al dominio HTTPS real de la aplicación y a los puertos locales necesarios, incluido `/auth/callback`.

Usar el flujo PKCE/SSR de Supabase. Las cookies deben ser `HttpOnly`, `Secure` en producción y `SameSite=Lax`. Las rutas administrativas deben comprobar el JWT actual y `aal = aal2`; la migración también lo exige para los roles `admin`, `moderator` y `finance`. No se implementan contraseñas locales ni hashing propio. Si se habilita email/password más adelante, Supabase Auth es quien debe almacenar el hash.

Para otorgar el primer rol administrativo, usar el UUID confirmado de `auth.users` desde un canal de administración, exigir que la persona haya inscrito MFA y luego insertar el rol con una sesión privilegiada. Nunca elegir un administrador solo por correo:

```sql
insert into public.profile_roles (profile_id, role_key, granted_by_profile_id)
values ('UUID_CONFIRMADO', 'admin', null)
on conflict do nothing;
```

## Datos cifrados

`complaints.encrypted_payload` recibe un sobre cifrado, no JSON en claro. El servidor debe cifrar el objeto `{ title, description, locality, approximateLocation, occurredOn }` y nunca enviar esos campos en claro a Postgres. Además debe:

- construir un JSON mínimo con título, relato, fechas, localidad y contacto;
- cifrarlo con AES-256-GCM y un nonce aleatorio de 96 bits que nunca se reutiliza con la misma clave;
- autenticar el contexto de cifrado (tipo de dato y versión) como AAD para que un nombre de archivo no pueda sustituir un payload de denuncia;
- guardar nonce, ciphertext y tag en un sobre versionado, y la versión en `encryption_key_version`;
- usar una clave HMAC separada para `payload_fingerprint` cuando haga falta comparar un dato exacto;
- descifrar únicamente en el backend después de autorizar y registrar el acceso.

Las claves se rotan por versión: mantener `DATA_ENCRYPTION_KEY_V1` mientras existan sobres `v1`, añadir `DATA_ENCRYPTION_KEY_V2`, cambiar la versión activa a `v2`, re-cifrar los registros `v1` de forma controlada y retirar la clave antigua solo después. El cifrado del proveedor en reposo complementa este control, pero no lo sustituye. No cifrar con una clave durable en el navegador.

## Denuncias, archivos y auditoría

`create_complaint` deriva usuario, estado, código y timestamps en la base; el cliente no puede manipularlos. El cliente autenticado no recibe la columna `encrypted_payload`: el ciphertext y la clave de descifrado permanecen exclusivamente en el servidor. Los RPCs resumidos (`my_complaints`, `my_complaint_timeline`, `my_subscription_summary`) omiten ciphertext, notas internas e IDs del proveedor.

Flujo de evidencia:

1. Crear primero la denuncia.
2. Subir a `complaint-evidence/<user_uuid>/<complaint_uuid>/<opaque_uuid>.<ext>`.
3. El backend limita el cuerpo antes de parsearlo, valida extensión, MIME y firma real, calcula SHA-256 y llama `register_complaint_evidence` con `service_role`.
4. Un escáner antimalware mueve el estado de `pending` a `clean`, `quarantined` o `rejected` mediante `mark_evidence_scan`.
5. Para leer, el backend comprueba `can_read_complaint_object`, llama `record_sensitive_access` y emite una URL firmada de vida corta con descarga forzada.

No hay política de lectura directa del bucket para usuarios autenticados: así no se puede saltar el registro de acceso. Los objetos huérfanos o pendientes deben eliminarse mediante una tarea periódica. No servir archivos pendientes, SVG, HTML, ejecutables ni documentos con macros.

Los triggers registran mutaciones sin copiar valores sensibles. PostgreSQL no dispone de triggers para `SELECT`; por eso toda lectura o descarga sensible debe pasar por `record_sensitive_access`. IP y User-Agent se registran, si son necesarios, como HMAC-SHA-256 con rotación, nunca en claro ni como hash simple.

## Rate limiting y pagos

`check_rate_limit(p_key, p_limit, p_window_seconds)` es el RPC booleano para la aplicación; internamente usa un contador atómico de ventana fija y solo puede invocarse desde el servidor. Para una IP o dispositivo, `p_key` debe contener un HMAC calculado con `AUDIT_HMAC_KEY`, no la IP. Programar limpieza de filas cuyo `expires_at` haya vencido. Complementar este control con Cloudflare Turnstile y límites del edge.

Las tablas de pagos aceptan Tilopay y no almacenan PAN, CVV, token de tarjeta ni cuerpo crudo del webhook. El algoritmo de `OrderHash` no es público: mientras Tilopay no lo entregue al comercio, `signature_verified` permanece falso. El backend consulta el estado final contra Tilopay, compara orden/monto/moneda, deduplica el aviso y solo entonces marca el pago; el callback o `thanks_url` nunca concede una membresía.

## Verificación mínima antes de habilitar datos reales

- Un usuario no puede leer, actualizar ni adivinar registros de otro.
- Un usuario no puede enviar `owner`, `status`, `role`, `amount`, `currency` ni IDs de proveedor.
- Un rol administrativo sin `aal2` es rechazado.
- `anon` solo lee planes, precios y categorías activos.
- El bucket rechaza rutas que no empiecen con el UUID autenticado y la denuncia propia.
- Los archivos no son descargables directamente y cada URL firmada queda auditada.
- Repetir webhooks o solicitudes idempotentes no duplica pagos ni acceso.
- El historial de estados y `audit_logs` no admiten edición o borrado desde la API.
