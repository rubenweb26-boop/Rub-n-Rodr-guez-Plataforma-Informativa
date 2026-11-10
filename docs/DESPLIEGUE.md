# Despliegue

## Entornos

| Entorno | Uso | Datos permitidos |
| --- | --- | --- |
| Local | Desarrollo y pruebas unitarias/manuales | Solo datos ficticios. |
| Pruebas privadas | QA de integración | Usuarios y pagos de prueba controlados. |
| Producción | Operación pública | Solo después de aprobar seguridad, legal, respaldo y monitoreo. |

No se debe cambiar la audiencia del Site a pública sin la aprobación expresa del propietario.

## Precondiciones por entorno

1. Crear un proyecto Supabase distinto por entorno y aplicar `supabase/migrations/0001_security_foundation.sql` una única vez en cada uno.
2. Configurar Google OAuth en Supabase y registrar únicamente redirect URLs del entorno correspondiente.
3. Crear una configuración Turnstile por dominio y activar la validación server-side.
4. Cargar secretos en el gestor del hosting; no usar archivos `.env` en el artefacto ni en Git.
5. Confirmar que `complaint-evidence` es un bucket privado y que RLS está habilitado/forzado en cada tabla de `public`.
6. Mantener `COMPLAINT_INTAKE_ENABLED=false` y `TILOPAY_PAYMENTS_ENABLED=false` hasta completar pruebas y aprobación operativa.

## Inventario de variables

| Variable | Alcance | Descripción |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Pública | URL HTTPS del proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Pública | Clave publishable; RLS limita su alcance. |
| `SUPABASE_SECRET_KEY` | Secreta | Solo backend; permite tareas privilegiadas. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Pública | Identificador del widget Turnstile. |
| `TURNSTILE_SECRET_KEY` | Secreta | Verificación server-side de Turnstile. |
| `TURNSTILE_EXPECTED_HOSTNAME` | Configuración | Host canónico que debe devolver Turnstile; si falta se valida contra el host de la solicitud. |
| `DATA_ENCRYPTION_KEY_V1` | Secreta | 32 bytes aleatorios codificados base64url. |
| `DATA_ENCRYPTION_KEY_V2` | Secreta | Siguiente clave de 32 bytes durante una rotación controlada. |
| `DATA_ENCRYPTION_KEY_VERSION` | Secreta/configuración | Versión de la clave de cifrado, actualmente `v1`. |
| `AUDIT_HMAC_KEY`, `RATE_LIMIT_HMAC_KEY` | Secretas | Secretos independientes para pseudónimos y límites. |
| `TILOPAY_*` | Secretas salvo callback | Credenciales de comercio y callback HTTPS fijo. |
| `COMPLAINT_INTAKE_ENABLED`, `TILOPAY_PAYMENTS_ENABLED` | Configuración | Deben cambiarse a `true` solo tras la aprobación correspondiente. |

Nunca enviar al navegador `SUPABASE_SECRET_KEY`, claves HMAC, claves de cifrado ni credenciales Tilopay. Después de una rotación, publicar una versión que consuma la nueva revisión de secretos.

## Verificación antes de publicar

```powershell
npm run install:ci
npm run security:secrets
npm run security:audit
npm run lint
npx tsc --noEmit
npm run build
```

Para lint SQL local se necesita Docker:

```powershell
supabase start
supabase db lint --schema public
supabase stop
```

En la base de prueba, validar al menos:

- `anon` no lee datos privados;
- dos usuarios no pueden leer ni cambiar registros del otro;
- un administrador sin MFA (`aal2`) no obtiene capacidades administrativas;
- las URLs de evidencia expiran y toda descarga deja auditoría;
- callbacks/webhooks duplicados no conceden más de un período por transacción;
- un importe, moneda u orden distintos no activan acceso.

## Publicación en Sites

1. Confirmar que `.openai/hosting.json` conserva el `project_id` existente y no declara bindings D1/R2 ya no usados.
2. Verificar los comandos anteriores con el commit exacto que se publicará.
3. Guardar los secretos en el entorno de Sites sin exponerlos en logs.
4. Crear una versión privada, esperar el estado terminal y verificar las rutas `/auth`, `/membresia`, `/denuncias`, `/mi-cuenta` y `/admin`.
5. Revisar cabeceras HTTPS/CSP, logs de error y accesos de Supabase/Tilopay.
6. Conservar versión, commit, fecha, responsable y resultado de QA en el registro de cambios.

## Reversión e incidentes

Una reversión de código no deshace una migración, un pago ni una sesión emitida. Ante un incidente:

1. Desactivar las feature flags de pagos y recepción sensible si aplica.
2. Rotar inmediatamente secretos expuestos y revocar sesiones/credenciales según el proveedor.
3. Restaurar la última versión conocida como segura; para base de datos usar una migración correctiva, no editar una migración aplicada.
4. Preservar auditoría, investigar alcance, restaurar datos desde un respaldo probado y documentar el incidente.

## Lista de apertura pública

- OAuth Google, MFA administrativa, RLS y Storage privados verificados en producción.
- Tilopay probado por el comercio, incluido rechazo, abandono, repetición, reembolso y contracargo.
- Especificación `OrderHash`/webhook validada con Tilopay.
- Antimalware, retención, respaldos restaurables, alertas y contacto de incidentes operativos.
- Términos, privacidad y procedimiento editorial aprobados por asesoría competente.
- Dominio, DNS y HTTPS definitivos aprobados por el propietario.
