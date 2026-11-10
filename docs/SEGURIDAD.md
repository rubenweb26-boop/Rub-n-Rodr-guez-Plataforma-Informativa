# Seguridad y privacidad

## Estado

La aplicación incorpora controles de defensa en profundidad, pero no es una certificación ni sustituye una revisión independiente, pruebas de penetración o asesoría legal. Pagos y denuncias sensibles permanecen cerrados hasta la configuración y validación de producción.

## Identidad, sesiones y autorización

- Google OAuth se configura dentro de Supabase Auth; Client Secret y tokens nunca llegan al frontend.
- Cada ruta protegida consulta el usuario actual contra Supabase. No se autoriza usando valores de UI, email o `getSession()` sin verificar.
- Las cookies SSR son `HttpOnly`, `SameSite=Lax`, `Path=/` y `Secure` en producción; el proxy de Next.js refresca y valida sesiones.
- RLS está habilitado y forzado en todas las tablas propias. Las políticas dan acceso solo a filas propias, catálogos activos o roles autorizados.
- Roles administrativos se resuelven en la base y exigen `aal2` (MFA); no se otorgan por una lista de correos del cliente.
- Los RPC delimitan mutaciones y derivan propietario, estados, timestamps, códigos de seguimiento y precio desde el servidor/base de datos. El cliente no puede imponerlos.

## Secretos, cifrado y consultas

- Solo URL y publishable key de Supabase son públicas. La clave de servidor, credenciales Tilopay, claves HMAC y cifrado se mantienen en el gestor de secretos.
- Los secretos se ignoran en Git; CI escanea tanto el árbol actual como el historial. Si se detecta una filtración, rotar la credencial, no solo borrarla del archivo actual.
- Relatos de denuncias y nombres originales se cifran en backend con AES-256-GCM, IV aleatorio, AAD por propósito y versión de clave. La aplicación admite claves `v1`/`v2` para una rotación sin perder lectura de datos existentes.
- IP/User-Agent se registran, si son necesarios, como HMAC-SHA-256 con un secreto independiente. No como IP en claro ni hash simple.
- Se usa el cliente parametrizado de Supabase y RPCs con parámetros tipados. No se concatena SQL con entrada del usuario.
- Las respuestas de cuenta y catálogo seleccionan solo las columnas necesarias; los resúmenes RPC no devuelven notas internas, datos bancarios ni ciphertext.

## Entrada, salida y abuso

- Zod valida estructuras estrictas, longitudes, formatos y listas permitidas; los campos desconocidos o duplicados se rechazan en flujos sensibles.
- Cuerpos JSON y multipart se leen con límites antes de parsearlos. Se normaliza texto y React escapa salida por defecto; no se renderiza HTML enviado por usuarios.
- Turnstile protege checkout y recepción de denuncias. Sus tokens se verifican server-side por acción y hostname; `TURNSTILE_EXPECTED_HOSTNAME` permite fijar el host canónico.
- Los límites de tasa se calculan atómicamente en Postgres por operación, usuario e IP pseudonimizada. Si el mecanismo no está configurado, las rutas sensibles fallan cerradas.
- Las mutaciones exigen mismo origen y `Sec-Fetch-Site` compatible, además de sesión y controles específicos.

## Archivos y evidencia

- El bucket `complaint-evidence` es privado y no tiene políticas de lectura directa para usuarios.
- Se admiten solo JPEG, PNG, PDF, MP4 y WebM dentro de límites estrictos; se revisan extensión, MIME declarado y firma binaria real.
- Los objetos usan nombres UUID opacos bajo el prefijo del propietario y la denuncia. El nombre original queda cifrado en metadatos.
- Toda descarga comprueba autorización, registra auditoría y genera una URL firmada de 60 segundos con descarga forzada.
- Los objetos empiezan en cuarentena `pending`; un escáner antimalware debe marcarlos `clean` antes de poder descargarlos. SVG, HTML, ejecutables y archivos de macros se rechazan.

## Pagos

- Tilopay HPP recibe los datos de tarjeta fuera de la aplicación. No se registran PAN, CVV, token de tarjeta, bearer token ni cuerpo crudo del webhook.
- El backend crea una orden única antes de contactar al proveedor, usa importe/moneda del catálogo propio y permite únicamente checkout HTTPS bajo `tilopay.com`.
- Callback, `code`, `OrderHash`, `returnData` y webhook son entradas no confiables. Se deduplican por huella y la decisión procede de una consulta autenticada a Tilopay que compara orden, importe y moneda.
- Una función de base de datos server-only enlaza una transacción verificada con un mes de acceso de forma idempotente. El mismo evento nunca añade un segundo período.
- Hasta recibir la especificación oficial de `OrderHash` del comercio, `signature_verified` queda en `false`; no habilitar pagos productivos sin completar y probar esa validación.

## Cabeceras, HTTPS y observabilidad

- El Worker redirige HTTP a HTTPS fuera de local y envía HSTS para conexiones HTTPS.
- CSP limita scripts, conexiones, marcos y recursos a los orígenes necesarios (Supabase y Turnstile incluidos).
- Se aplican `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, COOP/CORP y `Permissions-Policy` restrictiva.
- Rutas privadas se devuelven con `Cache-Control: private, no-store`.
- `audit_logs` y el historial de estados son append-only. Las mutaciones y lecturas sensibles relevantes quedan minimizadas y trazables.

## Dependencias y operación

- Ejecutar `npm run security:audit` y `npm run security:secrets` antes de cada despliegue.
- El workflow de GitHub ejecuta escaneo de secretos, auditoría, lint y build; Dependabot propone actualizaciones.
- Mantener Node y dependencias actualizados, revisar cambios mayores y no aceptar automáticamente una actualización que modifique autenticación, cifrado o pagos.
- Respaldos de Postgres y Storage deben cifrarse, probarse mediante restauración y tener una política de retención aprobada.

## Lista de salida a producción

- [ ] Pruebas RLS de aislamiento horizontal/vertical y roles AAL2 superadas.
- [ ] Google OAuth, redirect URLs, cookies y revocación de sesión verificados en dominio final.
- [ ] `DATA_ENCRYPTION_KEY_V1`, secretos HMAC, Turnstile y claves de Supabase almacenados/rotados correctamente.
- [ ] Catálogos autorizados, antimalware y borrado de objetos huérfanos operativos.
- [ ] Tilopay probado en cuenta del comercio, incluyendo repetición, rechazo, abandono, reembolso y contracargo.
- [ ] `OrderHash` y webhook oficiales verificados.
- [ ] `npm audit`, escaneo de secretos, lint, build y revisión de cabeceras aprobados.
- [ ] Privacidad, términos, retención y protocolo editorial aprobados; respaldos y respuesta a incidentes probados.
