# Plan y registro de pruebas

## Estado actual

Este archivo es el registro de aceptación. Una prueba solo se marca como aprobada cuando se ejecuta contra el entorno indicado y conserva evidencia. Las integraciones sin credenciales o sandbox permanecen bloqueadas; no se simulan como si fueran reales.

## Registro de ejecución

| Fecha | Commit | Entorno | Comando/escenario | Resultado | Evidencia |
| --- | --- | --- | --- | --- | --- |
| 2026-11-02 | Sin commit | Local | `npm run lint` | Aprobado | Salida vacía, código 0 |
| 2026-11-02 | Sin commit | Local | `npm run build` | Aprobado | Build complete; rutas nuevas presentes |
| 2026-11-02 | Sin commit | Local | `npx tsc --noEmit` | Aprobado | Sin diagnósticos |
| 2026-11-02 | Sin commit | Local | `npm run security:secrets` | Aprobado | 183 archivos, sin patrones de credenciales |
| Pendiente | Pendiente | Local | QA responsive y navegación | Por ejecutar | — |
| Pendiente | Pendiente | Local | Inicio de sesión Google/Apple/Facebook | Requiere credenciales OAuth | — |
| Pendiente | Pendiente | Local | Alta, cobro y baja de suscripción | Requiere cuenta Tilopay | — |
| Pendiente | Pendiente | Local | Aplicar migración `0002_recurring_subscriptions.sql` | Por ejecutar | — |

Actualizar esta tabla después de cada entrega.

## Pruebas automatizadas mínimas

- validación de esquemas de entrada;
- autorización por propietario y rol;
- transiciones permitidas de suscripción y denuncia;
- idempotencia de eventos de pago;
- verificación de importe y moneda;
- generación de códigos de seguimiento no predecibles;
- expiración de URLs de evidencia/video;
- límites y tipos de archivo;
- serialización segura y manejo de errores;
- componentes críticos y accesibilidad básica.

## Matriz de aceptación

### Identidad y cuenta

| Caso | Resultado esperado | Estado |
| --- | --- | --- |
| Inicio de sesión Google | Identidad creada por Supabase Auth y callback permitido | Requiere proyecto Supabase/Google de prueba |
| Inicio de sesión Apple | Identidad creada; correo privado de Apple aceptado | Requiere Apple Developer y dominio certificado |
| Inicio de sesión Facebook | Identidad creada; app en modo Live | Requiere app de Facebook verificada |
| Proveedor no habilitado | `/auth/sign-in/x` no inicia sesión | Implementado; falta prueba en navegador |
| Cancelación en el proveedor | Error `provider_denied`, sin sesión creada | Implementado; falta prueba en navegador |
| Redirect URL no permitida | OAuth la rechaza sin filtrar sesión | Requiere proyecto Supabase/Google de prueba |
| Cierre de sesión | Cookie invalidada y ruta privada rechazada | Requiere proyecto Supabase de prueba |
| Persistencia entre dispositivos | Datos recuperados desde servidor según RLS | Requiere proyecto Supabase de prueba |
| Eliminación de caché | No cambia membresía ni historial | Requiere proyecto Supabase de prueba |
| MFA administrativo | Rol admin sin `aal2` es rechazado | Requiere proyecto Supabase de prueba |

### Pagos y membresías

| Caso | Resultado esperado | Estado |
| --- | --- | --- |
| Pago exitoso | Activación de un mes solo tras `/consult` válido | Requiere cuenta Tilopay de prueba |
| Pago rechazado | Sin membresía; mensaje claro | Requiere sandbox |
| Retorno falso de éxito | No activa membresía | Requiere cuenta Tilopay de prueba |
| Webhook duplicado | Un solo efecto contable y de acceso | Requiere cuenta Tilopay de prueba |
| Webhook falsificado | Sin cambios; consulta no confirma la orden | Requiere cuenta Tilopay de prueba |
| Importe/moneda incorrectos | Rechazo y revisión | Requiere sandbox |
| Dos pagos válidos | Dos períodos consecutivos, nunca dos por el mismo evento | Requiere cuenta Tilopay de prueba |
| Vencimiento | Acceso retirado según `access_until` | Requiere control de contenido premium |
| Cancelación | No cobros futuros; vigencia definida | Requiere decisión comercial |
| Reembolso/contracargo | Estado y auditoría coherentes | Requiere sandbox |
| Acceso premium sin pagar | 403 desde servidor | Requiere implementación |

### Denuncias

| Caso | Resultado esperado | Estado |
| --- | --- | --- |
| Envío válido | Código de seguimiento y registro privado | Requiere Supabase/Turnstile de prueba |
| Usuario anónimo | Rechazo antes de procesar contenido | Requiere Supabase de prueba |
| Aislamiento entre usuarios | Nunca leer/modificar caso ajeno | Requiere Supabase RLS |
| Cambio de ID en URL/API | 404/403 sin fuga de información | Requiere Supabase RLS |
| Estados inválidos | Rechazo y sin mutación | Requiere Supabase de prueba |
| Archivo ejecutable o HTML | Rechazo/cuarentena | Requiere Storage y escáner |
| Archivo sobredimensionado | Rechazo antes de almacenamiento | Requiere Supabase Storage |
| Evidencia autorizada | URL corta y auditada | Requiere Supabase Storage |
| Publicación automática | Imposible por diseño | Requiere implementación |
| Exportación administrativa | Permiso, minimización y auditoría | Requiere panel |

### Contenido, video y anuncios

| Caso | Resultado esperado | Estado |
| --- | --- | --- |
| Video público | Avance reproducible | Requiere proveedor |
| Video premium | Token temporal tras autorización | Requiere proveedor |
| URL expirada | Rechazo | Requiere proveedor |
| Programación | Publica una vez en fecha prevista | Pendiente de módulo de contenido |
| Anuncio nuevo | Pendiente de revisión | Pendiente de módulo comercial |
| Aprobación/rechazo | Rol válido e historial | Requiere panel |
| Enlace externo | Destino permitido y marcado como publicidad | Por probar |
| Clic comercial | Conteo sin afirmar venta | Pendiente de módulo comercial |

### Administración y seguridad

| Caso | Resultado esperado | Estado |
| --- | --- | --- |
| Usuario normal abre `/admin` | 404 sin datos ni enumeración | Requiere Supabase MFA de prueba |
| Moderador intenta finanzas | Sin permiso de administración | Requiere roles de prueba |
| Cambio de rol | MFA/aprobación y auditoría | Requiere roles de prueba |
| XSS almacenado/reflejado | Entrada neutralizada | Requiere Supabase de prueba |
| SQL injection | Consultas parametrizadas/RPC | Cubierto por revisión; probar contra Supabase |
| CSRF | Operación rechazada cuando aplique | Requiere rutas de prueba |
| Fuerza bruta/abuso | Límite y Turnstile | Requiere entorno de prueba |
| Enumeración de usuario | Respuestas indistinguibles | Requiere OAuth de prueba |
| Secreto en bundle/log | Ninguna exposición | Revisar build y escaneo |
| CORS/origen no permitido | Rechazo | Requiere API de prueba |

### Operación

| Caso | Resultado esperado | Estado |
| --- | --- | --- |
| Build limpio | Salida exitosa sin secretos | Por ejecutar |
| Responsive | 320 px, tablet y escritorio sin pérdida funcional | Por ejecutar |
| Teclado/lector | Orden, foco, nombres y contraste adecuados | Por ejecutar |
| Enlaces/redes | Destinos confirmados | Pendiente de cliente |
| WhatsApp autenticado | No revela datos sin identidad | Requiere cuenta |
| Error de proveedor | Degradación segura y reintento controlado | Requiere integraciones |
| Restauración | RPO/RTO e integridad alcanzados | Requiere respaldos |

## Datos de prueba

- Usar personas y organizaciones ficticias claramente marcadas.
- No copiar denuncias, documentos o números reales.
- Tarjetas únicamente de sandbox del proveedor.
- Un usuario por rol y al menos dos usuarios normales para aislamiento.
- Archivos benignos y muestras de prueba antimalware autorizadas en entorno aislado.

## Evidencia requerida

Para cada ejecución conservar:

- commit y versión desplegada;
- entorno, fecha y responsable;
- entradas no sensibles;
- salida/log relevante con secretos redactados;
- captura o reporte cuando aplique;
- defecto encontrado, severidad y ticket;
- fecha de corrección y reejecución.

## Criterio de salida

No publicar al público con defectos críticos/altos abiertos, pruebas de aislamiento fallidas, restauración no verificada, webhooks sin autenticación, evidencia accesible públicamente o decisiones legales/comerciales pendientes.
