# Web pública y CRM privado

## Aplicaciones

| Aplicación | Código | Proceso | Exposición |
| --- | --- | --- | --- |
| Web pública | `app/`, `components/`, `lib/` | `npm run dev` | Dominio público |
| CRM | `CRM/` | `npm run dev` en `CRM/` | Subdominio administrativo |
| API privada | `backend/` | `npm start` en `backend/` | Subdominio de API con TLS |

La web pública conserva sus páginas, denuncias, membresías y pagos. La ruta `/admin` se retiró. El CRM usa una compilación Vite independiente y no se incluye en `dist/` de la web. Ambas aplicaciones comparten **Supabase Auth, Postgres y Storage**. La web envía denuncias mediante `/api/complaints`; el CRM las consulta y gestiona mediante la API privada. Los datos privados nunca se obtienen directamente desde la web pública.

## Desarrollo local

Se requiere Node.js >= 22.13.0 y un proyecto Supabase con las migraciones de `supabase/migrations/` aplicadas. Las tres partes deben usar el mismo proyecto Supabase.

1. Web pública: configurar `rubenweb-platform/.env.local` según `.env.example`; `npm install` y `npm run dev` en la raíz del repositorio.
2. API: copiar `backend/.env.example` a `backend/.env`, completar los valores y cargar esas variables en el entorno del proceso; `npm install` y `npm start` en `backend/`.
3. CRM: copiar `CRM/.env.example` a `CRM/.env.local`, completar valores públicos; `npm install` y `npm run dev` en `CRM/`.

En Windows PowerShell, `node --env-file=.env src/server.mjs` inicia la API con su archivo de entorno. El `CRM_ORIGIN` debe coincidir exactamente con el origen del CRM. El servidor local escucha en `127.0.0.1:4100`; en producción, colóquelo detrás de un proxy HTTPS que termine TLS y ajuste la escucha según el entorno de despliegue. Configure la URL HTTPS de la API en `VITE_API_URL` antes de compilar el CRM.

Para acceder, la cuenta de Rubén debe tener un rol `admin` o `moderator` asignado en Supabase, perfil activo, factor TOTP registrado y sesión `aal2`. El correo electrónico no concede permisos. La API verifica el JWT con Supabase en cada solicitud, comprueba rol y AAL, y deja la decisión de actualización de estados al RPC `staff_set_complaint_status` y las políticas RLS. La clave de servicio existe solo en la API para auditoría, lectura de detalles cifrados y Storage; jamás se configura con prefijo `VITE_` ni `NEXT_PUBLIC_`.

## Compilación y despliegue

- Web: `npm run build` en la raíz. Publicar su Worker según `docs/DESPLIEGUE.md`.
- CRM: `npm run build` en `CRM/`. Publicar solo `CRM/dist/` en un host estático separado, con HTTPS y sin acceso público a archivos fuente o `.env`.
- API: instalar dependencias de `backend/` y ejecutar `node src/server.mjs` como proceso privado. Configure `CRM_ORIGIN`, credenciales de Supabase y claves de cifrado existentes. Exponer únicamente la API con HTTPS y controles de red. No servir `backend/` como archivos estáticos.

No copie `CRM/` ni `backend/` al paquete de la web pública. El origen permitido por CORS es una protección adicional; la autorización real se realiza con el token, rol y MFA. Mantenga RLS y la auditoría activas en Supabase. Configure copias de seguridad y rotación de secretos antes de producción.

## Estado de los módulos

- Funcionales: sesión Google, MFA TOTP, panel, estadísticas por provincia, lista y filtros de denuncias, lectura de detalles, historial, cambio de estado y exportación local XLSX con hojas por provincia.
- Preparados sin envíos externos: borrador de campaña, secciones de Facebook, Instagram, TikTok, WhatsApp Business y asistente IA. El envío, programación y respuestas automáticas requieren cuentas aprobadas, APIs oficiales, consentimiento verificable, manejo de tokens y pruebas con proveedores reales. Permanecen desactivados.
- El webhook de WhatsApp se movió a `backend/`, comprueba token de verificación o firma HMAC de Meta y no envía respuestas ni almacena mensajes hasta completar la integración aprobada.
- El archivo XLSX se genera con los hasta 500 registros sincronizados de la sesión y contiene resumen y hojas provinciales. Los gráficos se muestran en el panel; el archivo todavía no incorpora gráficos embebidos.
- La web conserva consulta autenticada de casos en `mi-cuenta`. La recepción requiere `COMPLAINT_INTAKE_ENABLED=true` y ambas claves de Turnstile. El formulario y la API cierran la recepción si falta cualquiera de esos requisitos; aún deben completarse los requisitos legales y de análisis de archivos descritos en el README.
- Ambas aplicaciones tienen manifiesto PWA y shell para una experiencia limitada sin conexión. El soporte offline completo de denuncias, cambios del CRM y sincronización está pendiente. Para proteger los datos personales, el CRM no guarda denuncias descifradas en el almacenamiento del navegador. Los informes locales funcionan mientras los datos de la sesión permanezcan cargados.
