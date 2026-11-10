# Configuración de Pagos y Suscripciones con ONVO Pay en Costa Rica

Esta plataforma implementa soporte nativo para **ONVO Pay (ONVO Checkout y Pagos Recurrentes)**, con facturación en **Colones Costarricenses (CRC)** a un precio oficial de **₡3.500 al mes**, admitiendo pagos mediante **Tarjetas de Débito/Crédito y SINPE Móvil**.

---

## 1. ¿Por qué ONVO Pay para Costa Rica?

ONVO Pay es la pasarela líder de pagos y checkout diseñada para Costa Rica y Centroamérica:
- **Aceptación Integral:** Permite cobrar con **SINPE Móvil**, tarjetas locales de bancos costarricenses (BAC, BCR, Banco Nacional, etc.) y tarjetas internacionales (Visa, Mastercard, Amex).
- **Checkout Alojado Seguro:** La experiencia de pago se realiza en la pasarela oficial cifrada con TLS (`https://checkout.onvopay.com`), evitando la manipulación de montos en el frontend y cumpliendo con estándares PCI-DSS.
- **Cobro en Colones:** Los importes están fijados en el servidor en céntimos de colón (`350000` = ₡3.500 CRC).

---

## 2. Variables de Entorno Requeridas

En su archivo `.env` o en las variables de entorno de su proveedor de despliegue (Cloudflare / Vercel / Railway):

```env
# Clave secreta obtenida en el Dashboard de ONVO Pay (Developers > API Keys)
# Comienza con onvo_test_ en pruebas o onvo_live_ en producción
ONVO_SECRET_KEY=<clave-secreta>

# Secreto de validación de Webhook (Dashboard > Developers > Webhooks)
# Comienza con webhook_secret_...
ONVO_WEBHOOK_SECRET=<secreto-webhook>

# Clave pública de ONVO Pay (opcional para integraciones frontend)
ONVO_PUBLIC_KEY=<clave-publica>
```

---

## 3. Configuración del Webhook Oficial de ONVO Pay

Para garantizar que el acceso premium se active de inmediato tras un pago exitoso:

1. Ingrese a [ONVO Pay Dashboard > Developers > Webhooks](https://dashboard.onvopay.com).
2. Haga clic en **Crear Webhook** / **Agregar Endpoint**.
3. Ingrese la URL pública de la plataforma:
   ```
   https://tudominio.com/api/webhooks/onvo
   ```
4. Seleccione los eventos clave:
   - `checkout-session.succeeded`: Activa la suscripción inmediatamente por 32 días.
   - `payment-intent.succeeded`: Registra la transacción confirmada en Supabase.
   - `subscription.renewal.succeeded`: Extiende la membresía mensual de forma automática.
   - `subscription.renewal.failed`: Gestiona fallos de renovación protegiendo el acceso previo ya pagado.
5. Copie el valor del secreto generado (`webhook_secret_...`) y colóquelo en `ONVO_WEBHOOK_SECRET`.

---

## 4. Arquitectura de Seguridad e Idempotencia

- **Verificación Criptográfica:** El endpoint `/api/webhooks/onvo` valida el encabezado `X-Webhook-Secret` mediante comparación en tiempo constante (`crypto.timingSafeEqual`), bloqueando cualquier intento de suplantación.
- **Idempotencia Estricta:** Cada webhook recibido se registra en la tabla `payment_provider_events` con un hash SHA-256 de su carga. Si la red reintenta una entrega ya procesada, el sistema no duplica cobros ni registros.
- **Precios Protegidos en Servidor:** El usuario nunca puede alterar el precio ni la divisa desde la consola del navegador; el servidor calcula y envía `350000` céntimos de CRC.

