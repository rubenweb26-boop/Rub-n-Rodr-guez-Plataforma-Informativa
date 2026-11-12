# Prueba del flujo de denuncias — 11 de noviembre de 2026

## Entorno conectado (solo lectura)

- Catálogos disponibles: 7 provincias, 84 cantones, 494 distritos y 10 categorías.
- El bucket `complaint-evidence` existe y no es público.
- Las consultas anónimas a `complaints` y `my_complaints` son rechazadas.
- No había perfiles ni denuncias al momento de la comprobación.
- `COMPLAINT_INTAKE_ENABLED` figuraba como `true` en el entorno local, pero faltaban la clave secreta y la clave pública de Turnstile. Se corrigió la aplicación para cerrar el formulario y la API ante esta configuración incompleta; se eliminó un bypass que aceptaba un token de prueba o la ausencia del secreto.

## Pruebas automatizadas

`backend/test/access.test.mjs` verifica que la API privada rechaza solicitudes sin sesión y orígenes ajenos, y exige firma válida para el webhook de WhatsApp.

`backend/test/flow.test.mjs` usa un servicio Supabase simulado y comprueba que:

1. Una sesión administrativa `aal1` no puede leer denuncias.
2. Una sesión ciudadana `aal2` no puede acceder al CRM.
3. Una sesión administrativa `aal2` puede leer una denuncia sintética.
4. El cambio de estado llama al RPC autorizado y deja eventos de auditoría.

Ambas pruebas pasan con `npm test` en `backend/`. La web y el CRM compilan por separado; la web pasa TypeScript.

## Prueba real con datos sintéticos

El propietario confirmó que el proyecto conectado es de ensayo y puede reiniciarse. El script `scripts/test-live-complaint-flow.mjs` (requiere el argumento explícito `--staging`) creó tres cuentas de prueba y una denuncia sintética, sin información personal real. Verificó que el propietario la ve, otra cuenta no ve ni el caso ni su historial, el administrador `aal1` no puede actualizarla, y después de registrar TOTP obtiene `aal2`. La API privada mostró la denuncia, descifró su detalle, actualizó su estado y el propietario vio la nota pública. Todas las comprobaciones pasaron.

El script eliminó las cuentas temporales de observador y administrador. `scripts/cleanup-live-complaint-flow.mjs` eliminó la denuncia sintética y la cuenta propietaria. Una comprobación final de solo lectura confirmó **0 perfiles y 0 denuncias**, con los catálogos y el bucket privado intactos. El registro local de la prueba está en `outputs/live-complaint-flow.json` (ignorado por Git).

La interfaz web de envío no se probó de extremo a extremo: faltan las claves de Turnstile en el entorno local, por lo que ahora permanece cerrada. [Cloudflare indica](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) que sus claves de prueba no incluyen `action` ni el hostname real en la respuesta; la validación estricta de la aplicación requiere las credenciales del widget del entorno para cubrir esa ruta. El script `scripts/check-integration-readiness.mjs` permite repetir la comprobación de solo lectura sin imprimir credenciales ni datos personales.
