# Plataforma digital de Rubén Rodríguez

> **Nombre comercial pendiente de aprobación.** `RubénWeb` es únicamente el nombre de trabajo del MVP.

Repositorio del MVP privado para una futura plataforma de contenido, investigaciones, videos, membresías, denuncias ciudadanas y espacios comerciales de Rubén Rodríguez en Costa Rica.

## Estado de esta entrega

Esta versión es una base técnica y visual en desarrollo, publicada como **sitio privado de revisión**. No debe anunciarse como servicio productivo ni recibir todavía denuncias reales, pagos, documentos privados o datos sensibles.

| Área | Estado | Observación |
| --- | --- | --- |
| Experiencia pública | Implementada para MVP | Portada, contenido, membresía, anuncios, contacto, cuenta y panel responsive. |
| Identidad | Disponible en Sites | Inicio de sesión administrado por la plataforma; no equivale aún al registro por correo solicitado para el producto final. |
| Datos estructurados | Implementado para MVP | Esquema Drizzle completo y binding D1 declarados; falta aplicar y validar la migración alojada. |
| Archivos privados | Preparado y desactivado | Binding R2 y cuarentena implementados; recepción bloqueada hasta conectar antimalware y aprobar la operación. |
| Membresías y pagos | No activo | ONVO es el candidato inicial. Faltan decisión comercial, contrato, credenciales de sandbox y validación de su API. |
| WhatsApp | No activo | Requiere cuenta autorizada de WhatsApp Business Cloud API, plantillas y consentimiento. |
| Panel administrativo | Base implementada | Acceso por allowlist segura, métricas y módulos iniciales; faltan flujos operativos, roles finales y MFA. |

La lista detallada de brechas y decisiones está en [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md).

## Tecnología

- Vinext/Next.js, React 19 y TypeScript.
- Tailwind CSS 4 y componentes accesibles.
- Cloudflare Worker mediante OpenAI Sites.
- Drizzle ORM con Cloudflare D1 como base de datos propuesta para el MVP.
- Cloudflare R2 como almacenamiento privado propuesto.
- Inicio de sesión administrado por Sites/ChatGPT para la revisión privada.

## Requisitos locales

- Node.js `>=22.13.0`.
- Git y `tar`.
- Windows, macOS o Linux.

## Instalación y ejecución

```powershell
npm run install:ci
npm run dev
```

El servidor de desarrollo suele abrir en `http://127.0.0.1:5173`. En el perfil portátil, la identidad local puede simularse visitando `/signin-with-chatgpt?return_to=/`.

```powershell
npm run build
npm run lint
npm run db:generate
npm run start
```

`npm run start` requiere primero un build y levanta localmente el Worker compilado. No despliega el proyecto.

## Configuración

1. Copiar `.env.example` a un archivo local no versionado solo si se necesitan integraciones externas.
2. No colocar secretos en `NEXT_PUBLIC_*`, código fuente ni `.openai/hosting.json`.
3. Configurar los secretos de producción con las herramientas nativas de Sites.
4. Mantener pagos, WhatsApp, correo y streaming desactivados hasta completar los requisitos documentados.

La autenticación alojada por Sites no usa variables locales de Supabase. Si el cliente exige registro tradicional por nombre, correo y contraseña, debe aprobarse la migración o integración descrita en la arquitectura.

## Base de datos y archivos

El esquema relacional está definido en `db/schema.ts` y los bindings `DB`/`BUCKET` están declarados. Antes de habilitar persistencia sensible:

1. Aprobar el modelo de datos y la política de retención.
2. Ejecutar `npm run db:generate` e inspeccionar la migración SQL.
3. Cargar un catálogo territorial autorizado y versionado fuera de la migración.
4. Aplicar la migración al entorno local y verificar aislamiento entre usuarios.
5. Conectar análisis antimalware antes de activar `COMPLAINT_INTAKE_ENABLED`.
6. Publicar mediante el flujo de Sites, que aplica las migraciones alojadas.

Nunca usar `localStorage`, una cookie legible por JavaScript o el estado visual del navegador como fuente de verdad para usuarios, pagos, membresías o denuncias.

### Catálogo territorial

Se validó la capa oficial de límites distritales del IGN/Registro Nacional en SNIT (versión `20260410001`: 7 provincias, 84 cantones y 494 distritos), contrastada con el Anuario INEC 2024–2025. Sus condiciones prohíben el uso comercial directo o derivado; por eso los archivos se conservan solo como referencia local ignorada por Git y el formulario permanece desactivado. Antes de incorporarlos debe obtenerse autorización escrita del SNIT o seleccionarse una fuente con licencia compatible.

## Fuentes de identidad y contenido

El cliente indicó como perfiles autorizados:

- [Facebook](https://www.facebook.com/share/1FGcVCAAKb/)
- [Instagram](https://www.instagram.com/rubenrodriguezoficialdog)
- [Sitio oficial existente](https://rubenrodriguezoficial.com/)

El sitio existente enlaza al mismo Instagram y a la página de Facebook `emprendedorconproyeccionsocial`. También muestra material gráfico, WhatsApp y correo. **El nombre comercial, biografía, logotipo, teléfono, correo y permisos sobre cada archivo deben ser confirmados por escrito por el cliente antes de la publicación pública.** Se deben solicitar originales; no depender de hotlinks ni asumir derechos sobre terceros que aparezcan en fotografías o videos.

## Documentación

- [Arquitectura y decisiones](docs/ARQUITECTURA.md)
- [Seguridad y privacidad](docs/SEGURIDAD.md)
- [Manual de administración](docs/ADMINISTRACION.md)
- [Despliegue](docs/DESPLIEGUE.md)
- [Copias de seguridad](docs/RESPALDOS.md)
- [Plan y resultados de pruebas](docs/PRUEBAS.md)

## Decisiones que requieren al cliente

- Nombre definitivo, dominio, identidad visual y archivos originales.
- Alcance editorial y personas autorizadas para publicar o moderar.
- Si se conserva Sites/D1/R2 o se adopta Supabase para autenticación y datos.
- Precio, moneda y política de renovación/cancelación.
- Proveedor de pago tras revisar contrato, tarifas, recurrencia, webhooks y sandbox.
- Cuenta de WhatsApp Business, proveedor de correo y servicio de video privado.
- Política de privacidad, términos, retención y procedimiento de atención de denuncias revisados por asesoría legal costarricense.

## Advertencia

No se promete seguridad absoluta. La salida a producción exige pruebas, revisión legal, análisis de amenazas, cuentas externas habilitadas, monitoreo, respaldos restaurables y aprobación formal del propietario.
