# Plataforma digital de Rubén Rodríguez

MVP de una plataforma editorial con membresías, denuncias privadas y una pasarela de pago alojada. La arquitectura elegida es **Google OAuth → Supabase Auth/Postgres/Storage → Tilopay Hosted Payment Page**.

> El proyecto sigue en preparación. Los cobros y la recepción de denuncias están cerrados por defecto y no deben habilitarse con datos reales hasta completar la lista de salida a producción.

## Arquitectura actual

- Next.js/Vinext sobre Cloudflare Worker (OpenAI Sites) para la aplicación web.
- Supabase Auth con Google OAuth y cookies `HttpOnly`, `Secure` en producción y `SameSite=Lax`.
- Supabase Postgres para perfiles, roles, membresías, pagos, denuncias y auditoría. La migración fuerza RLS en todas las tablas de aplicación.
- Supabase Storage privado para evidencias; las descargas pasan por autorización, auditoría y URLs firmadas cortas.
- Tilopay HPP para cobrar fuera de la aplicación. Ningún PAN, CVV o token de tarjeta llega a RubénWeb.
- Cloudflare Turnstile, límites de tasa, validación estricta y cabeceras de seguridad para rutas sensibles.

## Controles incluidos

- Ningún secreto está en el código ni usa un prefijo `NEXT_PUBLIC_`; la clave publishable de Supabase es pública por diseño y RLS limita sus permisos.
- Autenticación obligatoria para cuenta, denuncias, pagos, evidencias y administración; los roles administrativos requieren MFA (`aal2`).
- RLS, funciones SQL con privilegios mínimos, consultas parametrizadas por el cliente de Supabase y columnas permitidas explícitamente.
- Cifrado AES-256-GCM de la información sensible de denuncias y nombres de archivos antes de almacenarlos.
- Auditoría append-only de mutaciones y de cada descarga autorizada de evidencia; IP y User-Agent se pseudonimizan con HMAC.
- Límites de tasa atómicos, Turnstile, tamaño máximo de solicitudes, esquemas Zod estrictos y rechazo de campos no esperados.
- Archivos con límite, tipo real detectado por firma, ruta opaca, bucket privado y estado de cuarentena antes de descargar.
- CSP, HSTS sobre HTTPS, protección contra clickjacking, `nosniff`, política de referencias y respuestas privadas sin caché.
- Escaneo de secretos y dependencias en CI, Dependabot y comandos locales de seguridad.
- Pago Tilopay con orden única persistida, consulta servidor-a-servidor, comparación de importe/moneda y activación mensual idempotente solo tras confirmación.

## Preparación de Supabase y Google

1. Crear un proyecto Supabase por entorno y aplicar [la migración de seguridad](supabase/migrations/0001_security_foundation.sql) en un proyecto nuevo.
2. En Google Cloud Console, crear el cliente OAuth y registrar el callback que muestra Supabase: `https://<project-ref>.supabase.co/auth/v1/callback`.
3. En Supabase, activar el proveedor Google, guardar allí el Client ID/secret y permitir únicamente los redirect URLs HTTPS de la aplicación, incluido `https://<dominio>/auth/callback`.
4. Cargar las ubicaciones autorizadas en `provinces`, `cantons` y `districts` antes de permitir denuncias.
5. Configurar las variables del entorno siguiendo [.env.example](.env.example). Solo URL, clave publishable y site key de Turnstile pueden exponerse al navegador.

El detalle operativo está en [docs/SUPABASE.md](docs/SUPABASE.md). No se implementan contraseñas locales: si más adelante se activa email/contraseña, Supabase Auth gestiona los hashes.

## Tilopay

La aplicación usa Hosted Payment Page y permanece desactivada hasta que se configuren credenciales propias, Turnstile, precios, callback HTTPS y pruebas del comercio. El flujo no confía en `code=1`, la URL de retorno ni el webhook: consulta Tilopay desde el servidor y compara orden, importe y moneda antes de conceder un mes de acceso.

Revisar [docs/TILOPAY.md](docs/TILOPAY.md) antes de activar `TILOPAY_PAYMENTS_ENABLED=true`. Falta incorporar y probar el algoritmo `OrderHash` privado que Tilopay entrega al comercio; hasta entonces la consulta autenticada es el control de decisión y el webhook se guarda solo como huella deduplicada.

## Desarrollo y verificaciones

Requiere Node.js `>=22.13.0`.

```powershell
npm run install:ci
npm run dev
npm run lint
npx tsc --noEmit
npm run build
npm run security:secrets
npm run security:audit
```

`npm run start` ejecuta localmente el artefacto Worker después de un build; no publica nada. La comprobación SQL local requiere Docker y Supabase CLI (`supabase start` y después `supabase db lint --schema public`).

## Documentación

- [Arquitectura](docs/ARQUITECTURA.md)
- [Supabase, RLS y Google OAuth](docs/SUPABASE.md)
- [Tilopay](docs/TILOPAY.md)
- [Seguridad y privacidad](docs/SEGURIDAD.md)
- [Despliegue](docs/DESPLIEGUE.md)
- [Pruebas](docs/PRUEBAS.md)
- [Respaldos](docs/RESPALDOS.md)

## Condiciones pendientes antes de producción

- Crear y proteger las cuentas reales de Google Cloud, Supabase, Tilopay y Turnstile.
- Aplicar y probar la migración contra una base Supabase de prueba con usuarios distintos y un administrador MFA.
- Cargar catálogos territoriales cuya licencia permita su uso y definir retención/atención de denuncias con asesoría legal.
- Conectar análisis antimalware y una tarea de limpieza para evidencias pendientes u huérfanas.
- Probar pagos aprobados, rechazados, abandonados, repetidos, reembolsos y contracargos con credenciales del comercio.
- Solicitar a Tilopay y verificar la especificación de webhook y `OrderHash`.
- Configurar monitoreo, respaldos restaurables, dominio definitivo y aprobación formal del propietario.
