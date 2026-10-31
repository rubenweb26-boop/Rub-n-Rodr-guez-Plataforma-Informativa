# Despliegue

## Entornos

| Entorno | Uso | Datos permitidos |
| --- | --- | --- |
| Local | Desarrollo y pruebas rápidas | Datos ficticios |
| Site privado | Revisión del cliente y QA | Datos ficticios o controlados |
| Producción pública | Operación real | Solo tras cumplir la lista de salida |

El proyecto actual corresponde al segundo entorno. No cambiar el acceso a público sin aprobación explícita del cliente y sin completar seguridad, legal, integraciones y restauración.

## Requisitos

- Node.js `>=22.13.0`.
- Git y `tar`.
- Dependencias instaladas con el lockfile.
- Acceso autorizado al proyecto de Sites.
- Variables y secretos definidos en Sites, no en el repositorio.

## Verificación local

```powershell
npm run install:ci
npm run lint
npm run build
```

Para desarrollo:

```powershell
npm run dev
```

Para probar el artefacto Worker después del build:

```powershell
npm run start
```

Registrar fecha, commit, versión de Node y resultados en `docs/PRUEBAS.md`.

## D1 y R2

Los bindings lógicos `DB` y `BUCKET` y el esquema Drizzle ya están declarados. Para habilitar almacenamiento sensible de forma segura:

1. generar la migración con `npm run db:generate`;
2. inspeccionar y versionar SQL y metadatos Drizzle;
3. construir el proyecto para generar la configuración local;
4. aplicar migraciones a la base local en orden, sin repetir las ya aplicadas;
5. cargar datos maestros autorizados fuera de la migración;
6. ejecutar pruebas de aislamiento, autorización, cargas y restauración;
7. conectar antimalware y aprobar la operación legal;
8. publicar mediante el flujo de Sites, que aplica migraciones alojadas antes del Worker.

Las migraciones aplicadas son inmutables. Las correcciones posteriores se agregan en una migración nueva.

## Variables y secretos

- Usar `.env.example` solo como inventario.
- No colocar secretos en variables `NEXT_PUBLIC_*`.
- Sandbox y producción deben usar valores distintos.
- Revisar quién posee y puede rotar cada credencial.
- Después de cambiar una variable alojada, desplegar una versión guardada para aplicar la revisión de entorno.

## Flujo de publicación en Sites

1. Confirmar que `.openai/hosting.json` conserva el `project_id` existente.
2. Ejecutar lint, build y pruebas con el código exacto que se publicará.
3. Crear un commit y empujarlo al repositorio de origen asociado al Site.
4. Empaquetar el artefacto generado mediante el helper oficial de Sites.
5. Guardar y desplegar la versión privada exacta del commit.
6. Esperar estado terminal `succeeded` o investigar `failed`.
7. Verificar la URL publicada, navegación, recursos, accesibilidad básica y logs.
8. Conservar ID de versión, commit, despliegue y responsable en el registro de cambios.

No crear un Site nuevo si `.openai/hosting.json` ya contiene un `project_id`.

## Dominio y acceso

- El dominio definitivo y el nombre siguen pendientes.
- Mantener acceso privado durante el MVP.
- Configurar dominio, DNS y audiencia únicamente cuando el cliente lo autorice.
- HTTPS es obligatorio y debe estar activo antes de aceptar tráfico real.

## Reversión

1. Detener nuevas operaciones sensibles si hay riesgo de corrupción o exposición.
2. Seleccionar la última versión conocida como segura.
3. Desplegar esa versión sin reescribir historial de migraciones.
4. Si una migración ya se aplicó, crear una migración correctiva compatible; no editar la aplicada.
5. Verificar integridad de datos y servicios externos.
6. Documentar el incidente y acciones posteriores.

Una reversión de código no revierte automáticamente D1, R2, pagos ni mensajes externos.

## Criterios para producción pública

- arquitectura final y proveedor de identidad aprobados;
- datos de marca/contacto confirmados;
- D1/R2 o Supabase implementados con aislamiento y respaldo;
- pagos y webhooks probados en sandbox;
- MFA, roles, auditoría y procedimientos administrativos;
- correo, video y WhatsApp con cuentas autorizadas;
- políticas legales y editoriales aprobadas;
- pruebas de seguridad, carga, accesibilidad y restauración superadas;
- monitoreo y atención de incidentes disponibles;
- autorización escrita del propietario.
