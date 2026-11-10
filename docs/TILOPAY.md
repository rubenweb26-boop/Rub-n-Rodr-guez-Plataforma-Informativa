# Integración Tilopay

## Alcance implementado

La aplicación usa **cobros recurrentes** (planes y suscriptores) como modo de venta principal, y conserva el flujo **Hosted Payment Page (HPP) API v1** para cobros únicos. En ambos casos los datos de tarjeta se capturan en una página de Tilopay; nunca atraviesan este servidor.

### Recurrencia (modo activo)

- creación de planes con `POST /api/v1/createPlanRepeat` (herramienta administrativa, no se ejecuta por visita);
- obtención de la URL de registro o renovación con `POST /api/v1/recurrentUrl`;
- suscripción local vinculada por `<plan_id>:<correo>` — Tilopay identifica al suscriptor por correo dentro de un plan;
- receptor de webhooks por tipo (`subscribe`, `payment`, `rejected`, `unsubscribe`, `reactive`);
- extensión de acceso por exactamente un período, idempotente por número de orden.

### Cobro único (HPP, conservado)

- login servidor-a-servidor y caché del bearer token según `expires_in`;
- creación de la URL de pago con `POST /api/v1/processPayment`;
- confirmación con `POST /api/v1/consult` y comparación estricta de orden, importe y moneda.

### Medidas comunes

- una orden alfanumérica única, persistida antes de contactar al proveedor;
- el callback GET ignora `code=1` como fuente de verdad y consulta la orden;
- receptor de webhook con límite de cuerpo, deduplicación y sin guardar el payload;
- bloqueo de URLs de checkout que no sean HTTPS bajo `tilopay.com`, `.tilopay.com`, `tp.cr` o `.tp.cr`;
- rate limiting, validación de origen y auditoría para crear checkouts;
- estado inerte si falta el feature flag, una credencial, el id de plan, Supabase o la URL fija de callback.

## Métodos de pago y Apple Pay

La página hospedada y el enlace de registro de Tilopay muestran los métodos habilitados **en la cuenta del comercio**, no por parámetro del código. Visa y Mastercard están disponibles por defecto; Apple Pay y Google Pay requieren habilitación en la cuenta.

Requisitos verificados en la documentación oficial (SDK 2.1.1):

| Método | Requisito real |
| --- | --- |
| Visa / Mastercard | Ninguno adicional más allá de la afiliación. |
| Apple Pay | Cuenta **en producción** (en pruebas el botón no aparece y `applePaySupported` es `false`), método con `apple_pay = 1` en `init.methods`, **dominio certificado** para Apple Pay, HTTPS, Safari en dispositivo Apple, tarjetas Visa/Mastercard/Amex. |
| Google Pay | Se habilita en la cuenta de comercio; el SDK no expone un parámetro propio equivalente al de Apple Pay. |

La certificación del dominio es **exacta**: `www.dominio.com` y `dominio.com` son dominios distintos y se certifican por separado escribiendo a `soporte@tilopay.com` con el dominio exacto.

Esta implementación usa el flujo de **enlace de registro/reintento** (`recurrentUrl`), no el SDK embebido. Es una decisión deliberada: el SDK exige que los campos `tlpy_cc_number`, `tlpy_cc_expiration_date` y `tlpy_cvv` existan en la página aunque el pago sea con Apple Pay, lo que amplía el alcance de cumplimiento PCI del sitio. Con el enlace hospedado, ningún campo de tarjeta vive en RubénWeb. Si más adelante se quiere Apple Pay dibujado dentro del sitio, ver la sección «Trabajo pendiente».

## Rutas

| Ruta | Método | Uso |
| --- | --- | --- |
| `/api/payments/tilopay/subscribe` | POST autenticado | **Modo activo.** Devuelve solo `subscriptionUrl` del plan recurrente. |
| `/api/payments/tilopay/checkout` | POST autenticado | Selecciona un precio activo en servidor, persiste la orden y devuelve solo `checkoutUrl`. |
| `/api/payments/tilopay/callback` | GET público | Recibe la redirección, registra una huella y confirma la orden por API. |
| `/api/webhooks/tilopay` | POST público JSON | Aviso de compra única. Confirma la orden por API; nunca guarda el cuerpo crudo. |
| `/api/webhooks/tilopay/recurring` | POST público JSON | Avisos de recurrencia, distinguidos por `?kind=`. |

El cliente de suscripción envía `planCode` y un token Turnstile válido para la acción `tilopay_subscribe`. No puede enviar ni reemplazar importe, moneda, usuario, estado, id de plan ni correo.

## Variables

```text
TILOPAY_PAYMENTS_ENABLED=false
TILOPAY_API_USER=
TILOPAY_API_PASSWORD=
TILOPAY_API_KEY=
TILOPAY_MERCHANT_ID=
TILOPAY_API_BASE_URL=https://app.tilopay.com
TILOPAY_CALLBACK_URL=https://dominio.example/api/payments/tilopay/callback

TILOPAY_RECURRING_ENABLED=false
TILOPAY_RECURRING_PLAN_ID=
TILOPAY_RECURRING_PLAN_CODE=contenido-mensual
TILOPAY_RECURRING_FREQUENCY=monthly
```

`TILOPAY_API_USER`, `TILOPAY_API_PASSWORD`, `TILOPAY_API_KEY` y el bearer token son secretos exclusivos del backend. Nunca deben usar prefijo `NEXT_PUBLIC_`, incluirse en Git, enviarse al navegador ni aparecer en logs. Si se filtran, hay que rotar las credenciales: **los tokens emitidos no tienen operación de revocación**.

`TILOPAY_RECURRING_PLAN_ID` debe ser el id numérico devuelto por `createPlanRepeat`. Si falta o no es numérico, la suscripción queda inerte en lugar de cobrar contra un plan equivocado.

## Flujo de confianza

1. La API valida sesión, mismo origen, límite de intentos, Turnstile y JSON estricto.
2. Verifica que `planCode` coincida con `TILOPAY_RECURRING_PLAN_CODE`.
3. Busca `plan_prices` por código, proveedor y moneda; el navegador no fija el precio.
4. Inserta `payment_transactions` en estado `pending` con una orden única.
5. Pide a Tilopay la URL de registro o renovación y la revalida antes de devolverla.
6. Registra una `subscriptions` local en estado `pending` vinculada a `<plan_id>:<correo>`.
7. El webhook identifica al suscriptor **por correo**, nunca por el cuerpo recibido.
8. El acceso solo se extiende en `payment`, y solo si llegan número de orden y monto válidos.
9. La extensión es idempotente por número de orden: un reintento no añade otro período.

`returnData`, `code`, `auth`, `OrderHash`, ids del webhook y cualquier token recibido se consideran entrada no confiable. No se almacena PAN, CVV, token de tarjeta, bearer token ni cuerpo crudo del webhook.

## Semántica de acceso

El acceso se rige por `subscriptions.access_until`:

| Evento | Efecto sobre el acceso |
| --- | --- |
| `payment` confirmado | Extiende un período desde el mayor entre «ahora» y el vencimiento actual. Nunca acorta. |
| `rejected` | Marca `past_due`. **No revoca**: el suscriptor conserva lo ya pagado y Tilopay reintenta. |
| `unsubscribe` | Marca `canceled`. Conserva acceso hasta `access_until` y no se renueva. |
| `subscribe` / `reactive` | Marca `active`. |
| Vencimiento | `expire_lapsed_subscriptions()` pasa a `expired`. |

Este criterio (conservar lo pagado ante un rechazo) es una **decisión de producto revisable**. La alternativa —revocar de inmediato— es más estricta pero castiga fallos temporales del banco. Debe confirmarse con el cliente antes de producción.

## Webhook y `OrderHash`

Tilopay documenta que el algoritmo de `OrderHash` se entrega al comercio bajo solicitud a `soporte@tilopay.com`. La recurrencia **no envía token de tarjeta**; la compra única sí lo envía y es utilizable.

Mientras no se reciba y pruebe la especificación del hash:

- `signature_verified` permanece `false`;
- ninguno de los cinco webhooks concede acceso por sí mismo: todos exigen que exista una suscripción local que coincida;
- los eventos que no se puedan confirmar quedan en `payment_provider_events` para reconciliación operativa.

Reintentos documentados: **recurrencia 5 intentos** ante 400/404/403/502/504; **compras 1 intento**. Un HTTP 200 se considera entrega correcta, por eso el receptor responde 200 en cuanto registra el evento.

## Preparación del comercio

1. Registrarse en <https://tilopay.com/developers/registro>. **No hay credenciales de sandbox compartidas**: cada comercio recibe las suyas por correo.
2. Obtener `apiuser`, `password` y `key` en el panel · Integración con plataformas.
3. Crear el plan recurrente con `createPlanRepeat` (frecuencia 3 = mensual) y anotar el `id` devuelto.
4. Configurar en ese plan los webhooks `webhook_subscribe`, `webhook_payment`, `webhook_rejected`, `webhook_unsubscribe` y `webhook_reactive` apuntando a `/api/webhooks/tilopay/recurring?kind=<tipo>`.
5. Configurar `thanks_url` y la URL callback HTTPS exacta.
6. Confirmar en Supabase el plan y precio CRC activos. La migración crea una semilla de ₡3.500 (`350000` centésimos) que debe aprobarse comercialmente antes de habilitar cobros.
7. Solicitar a soporte la especificación de `OrderHash` y del webhook de `processPayment`.
8. Para Apple Pay: habilitar el método en la cuenta y **certificar el dominio exacto**.
9. Probar aprobación, rechazo, abandono, alta, baja, reactivación, webhook duplicado y consulta no disponible.
10. Cambiar `TILOPAY_PAYMENTS_ENABLED` y `TILOPAY_RECURRING_ENABLED` a `true` solo en el entorno probado.

Pruebas y producción comparten host: el entorno depende de las credenciales asignadas al comercio.

## Trabajo pendiente

- **Apple Pay dentro del sitio**: exigiría adoptar el SDK v2 con los tres campos de tarjeta en la página, ampliando el alcance PCI. No implementado a propósito.
- **Cancelación desde la cuenta**: hoy la baja ocurre en Tilopay. Falta una acción propia que llame a `deleteSuscriptorPlan` o `pauseSuscriptorPlan`.
- **Verificación de firma**: depende del algoritmo de `OrderHash`.
- **Conciliación programada**: `expire_lapsed_subscriptions()` existe pero todavía no tiene un disparador automático.

## Referencia oficial

- [Autenticación del API](https://tilopay.com/developers/api/autenticacion)
- [Hosted Payment Page: processPayment](https://tilopay.com/developers/api/hosted-payment-page/process-payment)
- [Crear plan recurrente](https://tilopay.com/developers/api/recurrentes/planes/create-plan)
- [URL de registro y renovación](https://tilopay.com/developers/api/recurrentes/suscriptores/consult-url)
- [Webhooks](https://tilopay.com/developers/api/webhooks)
- [Apple Pay con el SDK](https://tilopay.com/developers/sdk/apple-pay)
- [Consulta de transacciones](https://tilopay.com/developers/api/procesos-operativos/consult)
