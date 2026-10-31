# Seguridad y privacidad

## Estado y alcance

Este documento define controles mínimos para el MVP y la ruta a producción. No certifica que el sistema sea seguro ni sustituye una auditoría independiente, pruebas de penetración o asesoría legal.

El MVP permanece privado y no debe recibir datos sensibles hasta que D1/R2, roles, auditoría, retención y restauración estén implementados y probados.

## Activos sensibles

- identidad y datos de contacto de usuarios;
- estado de membresía e historial de pagos;
- denuncias, identidad del informante y terceros mencionados;
- fotografías, videos y documentos de evidencia;
- tokens de sesión, secretos de webhook y credenciales de proveedores;
- contenido premium y URLs temporales de reproducción;
- acciones administrativas y decisiones editoriales.

## Límites de confianza

1. Navegador: nunca es fuente de verdad para roles, pagos o propiedad.
2. Sites: autentica la visita y entrega identidad firmada al Worker.
3. Worker: valida, autoriza y registra todas las operaciones.
4. D1: fuente de verdad de registros y estados.
5. R2: almacén privado de objetos; ningún bucket debe ser público.
6. Proveedores externos: datos no confiables hasta verificar autenticidad y semántica.

## Controles obligatorios

### Identidad y sesiones

- Usar únicamente la identidad inyectada por Sites o un proveedor aprobado.
- Clave durable: `oai-authenticated-user-id`; no usar correo como ID.
- Rechazar en servidor toda ruta protegida sin identidad.
- Administradores con MFA cuando la plataforma final lo permita.
- Roles de menor privilegio y revisión trimestral de accesos.
- Invalidación o suspensión inmediata ante pérdida de cuenta.

### Autorización

- Verificar propietario o permiso explícito en cada consulta y mutación.
- Consultas siempre acotadas por `owner_user_id` para datos de usuario.
- Separar permisos de lectura, moderación, publicación, finanzas y configuración.
- Probar acceso horizontal y vertical; cambiar un ID nunca debe exponer otro registro.

### Entrada y salida

- Validar en servidor con esquemas estrictos y listas permitidas.
- Rechazar campos desconocidos en operaciones sensibles.
- Parametrizar consultas; no concatenar SQL.
- Escapar salida y evitar HTML arbitrario de usuarios.
- Usar CSP, `X-Content-Type-Options`, políticas de `Referrer-Policy` y permisos mínimos.
- Restringir CORS a orígenes necesarios.

### Archivos

- Carga directa autorizada con identificador opaco y vencimiento corto.
- Validar tamaño, extensión, MIME declarado y firma real del archivo.
- Renombrar objetos; nunca usar el nombre del usuario como ruta confiable.
- Cuarentena y análisis antimalware antes de que un moderador pueda abrirlos.
- Bloquear ejecutables, HTML activo, archivos con macros y formatos no aprobados.
- Descargar mediante autorización del backend y encabezado `Content-Disposition: attachment`.
- Eliminar metadatos innecesarios de imágenes publicables.

### Pagos y webhooks

- Secretos solo en configuración alojada; nunca en cliente o Git.
- Verificar firma con el cuerpo crudo y la documentación del proveedor.
- Ventana de tiempo y protección contra repetición.
- Identificador de evento único e idempotencia transaccional.
- Comparar importe, moneda, comercio, referencia y estado esperado.
- La redirección de éxito no activa membresías.
- Registrar resultado sin almacenar números completos de tarjeta ni CVV.

### Abuso y disponibilidad

- Límites por identidad, IP y operación para inicio de sesión, búsqueda, carga y formularios.
- CAPTCHA o desafío adaptativo en endpoints públicos cuando sea necesario.
- Límites de tamaño y tiempo; paginación obligatoria.
- Alarmas para picos de errores, intentos administrativos y webhooks fallidos.
- Mensajes de error sin enumeración de cuentas ni detalles internos.

## Denuncias, difamación y protección de identidad

- Las denuncias son privadas por defecto y jamás se publican automáticamente.
- Evitar solicitar datos personales que no sean necesarios.
- Advertir que el canal no sustituye a autoridades ni servicios de emergencia.
- Restringir exportaciones y descargas masivas.
- Registrar quién abrió una evidencia o cambió un estado.
- Redactar datos de terceros antes de cualquier publicación.
- Exigir revisión editorial y, para casos sensibles, asesoría legal.
- Mantener mecanismos de rectificación, apelación y eliminación aplicables.
- No revelar el estado de un caso por WhatsApp solo con teléfono o código.

## Privacidad y retención

La plataforma debe evaluar la Ley 8968 de Costa Rica y normativa aplicable con asesoría profesional. Como mínimo:

- informar finalidad, base de tratamiento y responsables;
- registrar consentimiento cuando corresponda;
- definir plazos por categoría de dato;
- permitir solicitudes de acceso, rectificación y eliminación cuando procedan;
- documentar proveedores y transferencias internacionales;
- cifrar transporte y proteger respaldos;
- eliminar copias y derivados al vencer la retención, salvo obligación legal.

## Gestión de secretos

- Usar herramientas nativas de Sites para producción.
- Mantener `.env` local fuera de Git.
- Rotar inmediatamente cualquier secreto expuesto.
- Separar sandbox y producción.
- Usar credenciales de menor privilegio y propietario identificable.
- No enviar secretos por correo, chat, documentación o capturas.

## Auditoría e incidentes

Registrar de forma inmutable:

- cambios de rol y configuración;
- lectura o descarga de evidencia sensible;
- cambios de estado de denuncias;
- publicación/retiro de contenido o anuncios;
- reembolsos, cancelaciones y ajustes de membresía;
- fallos de verificación de webhook;
- exportaciones y acciones de respaldo/restauración.

Ante un incidente: contener, preservar evidencia, rotar credenciales, evaluar alcance, notificar responsables, restaurar servicio, documentar causas y aplicar acciones correctivas. La obligación de notificar a afectados o autoridades debe determinarse con asesoría legal.

## Lista de salida a producción

- [ ] Modelo de amenazas revisado.
- [ ] Roles, MFA administrativa y revocación probados.
- [ ] D1/R2 privados, migrados y con aislamiento validado.
- [ ] Cargas con cuarentena y análisis antimalware.
- [ ] Pagos probados en sandbox, incluidos fraude y repetición.
- [ ] CSP, CORS, encabezados y límites de abuso configurados.
- [ ] Alertas, logs y contacto de incidentes activos.
- [ ] Respaldos cifrados y restauración probada.
- [ ] Términos, privacidad y protocolo editorial aprobados.
- [ ] Revisión de dependencias y pruebas de seguridad completadas.
- [ ] Aprobación formal del propietario.
