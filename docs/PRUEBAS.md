# Plan y registro de pruebas

## Estado actual

Este archivo es el registro de aceptación. Una prueba solo se marca como aprobada cuando se ejecuta contra el entorno indicado y conserva evidencia. Las integraciones sin credenciales o sandbox permanecen bloqueadas; no se simulan como si fueran reales.

## Registro de ejecución

| Fecha | Commit | Entorno | Comando/escenario | Resultado | Evidencia |
| --- | --- | --- | --- | --- | --- |
| Pendiente | Pendiente | Local | `npm run lint` | Por ejecutar | — |
| Pendiente | Pendiente | Local | `npm run build` | Por ejecutar | — |
| Pendiente | Pendiente | Local | QA responsive y navegación | Por ejecutar | — |

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
| Registro/inicio de sesión | Identidad creada por proveedor aprobado | Bloqueado por decisión de identidad |
| Verificación de correo | Token único, vencimiento y reintento seguro | Bloqueado |
| Recuperación de contraseña | Sin enumerar usuarios; sesiones revocables | Bloqueado |
| Cierre de sesión | Sesión no reutilizable | Por probar con Sites |
| Persistencia entre dispositivos | Datos recuperados desde servidor | Bloqueado por base de datos |
| Eliminación de caché | No cambia membresía ni historial | Bloqueado por base de datos |
| Sesiones/dispositivos | Listar y revocar sesiones autorizadas | Bloqueado por proveedor final |

### Pagos y membresías

| Caso | Resultado esperado | Estado |
| --- | --- | --- |
| Pago exitoso | Activación solo tras evento auténtico | Requiere sandbox |
| Pago rechazado | Sin membresía; mensaje claro | Requiere sandbox |
| Retorno falso de éxito | No activa membresía | Requiere implementación |
| Webhook duplicado | Un solo efecto contable | Requiere sandbox |
| Webhook falsificado | 4xx, sin cambios, alerta | Requiere sandbox |
| Importe/moneda incorrectos | Rechazo y revisión | Requiere sandbox |
| Renovación | Nueva vigencia sin duplicar cobro | Requiere sandbox |
| Vencimiento | Acceso retirado según política | Requiere implementación |
| Cancelación | No cobros futuros; vigencia definida | Requiere decisión comercial |
| Reembolso/contracargo | Estado y auditoría coherentes | Requiere sandbox |
| Acceso premium sin pagar | 403 desde servidor | Requiere implementación |

### Denuncias

| Caso | Resultado esperado | Estado |
| --- | --- | --- |
| Envío válido | Código de seguimiento y registro privado | Requiere D1/R2 |
| Usuario anónimo/no premium | Política aplicada en servidor | Requiere decisión comercial |
| Aislamiento entre usuarios | Nunca leer/modificar caso ajeno | Requiere D1 |
| Cambio de ID en URL/API | 404/403 sin fuga de información | Requiere D1 |
| Estados inválidos | Rechazo y sin mutación | Requiere D1 |
| Archivo ejecutable o HTML | Rechazo/cuarentena | Requiere R2 y escáner |
| Archivo sobredimensionado | Rechazo antes de almacenamiento | Requiere R2 |
| Evidencia autorizada | URL corta y auditada | Requiere R2 |
| Publicación automática | Imposible por diseño | Requiere implementación |
| Exportación administrativa | Permiso, minimización y auditoría | Requiere panel |

### Contenido, video y anuncios

| Caso | Resultado esperado | Estado |
| --- | --- | --- |
| Video público | Avance reproducible | Requiere proveedor |
| Video premium | Token temporal tras autorización | Requiere proveedor |
| URL expirada | Rechazo | Requiere proveedor |
| Programación | Publica una vez en fecha prevista | Requiere D1 |
| Anuncio nuevo | Pendiente de revisión | Requiere D1 |
| Aprobación/rechazo | Rol válido e historial | Requiere panel |
| Enlace externo | Destino permitido y marcado como publicidad | Por probar |
| Clic comercial | Conteo sin afirmar venta | Requiere D1 |

### Administración y seguridad

| Caso | Resultado esperado | Estado |
| --- | --- | --- |
| Usuario normal abre `/admin` | 403/404 | Requiere panel |
| Moderador intenta finanzas | 403 | Requiere roles |
| Cambio de rol | MFA/aprobación y auditoría | Requiere roles |
| XSS almacenado/reflejado | Entrada neutralizada | Requiere formularios |
| SQL injection | Consultas parametrizadas | Requiere D1 |
| CSRF | Operación rechazada cuando aplique | Requiere rutas |
| Fuerza bruta/abuso | Límite y alerta | Requiere controles |
| Enumeración de usuario | Respuestas indistinguibles | Requiere proveedor final |
| Secreto en bundle/log | Ninguna exposición | Por revisar en build |
| CORS/origen no permitido | Rechazo | Requiere API |

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
