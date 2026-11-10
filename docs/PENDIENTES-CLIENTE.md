# Lo que se necesita de tu parte

Estado: el código de autenticación y de cobros recurrentes **ya está escrito, compila y pasa lint**. Nada cobra todavía, a propósito: cada integración queda inerte hasta que existan las credenciales y los ids reales.

Este documento lista exactamente qué hay que conseguir. Está ordenado por dependencia: lo de arriba bloquea lo de abajo.

---

## 1. Cuenta de Tilopay (bloquea todo el cobro)

Todavía no tenés cuenta. **No existen credenciales de sandbox compartidas**: cada comercio se registra y recibe las suyas por correo.

**Qué hacer:**

1. Registrarse en <https://tilopay.com/developers/registro> con los datos del negocio.
2. Recibir por correo la cuenta de pruebas y sus credenciales.
3. Entrar al panel → **Integración con plataformas** y copiar:
   - `apiuser`
   - `password`
   - `key`

**Qué me tenés que pasar:** esos tres valores, más el `merchantId` si el panel lo muestra aparte.

**Requisito legal/comercial:** al registrarse hay que declarar el negocio y la actividad. Conviene definir antes quién es el titular de la cuenta (persona física o sociedad) y a qué cuenta bancaria se liquidan los fondos.

---

## 2. Plan recurrente creado en Tilopay (bloquea la suscripción)

El código no crea planes solo: hay que crear el plan en Tilopay y darme su id.

**Qué decidir primero:**

| Decisión | Valor actual en el código | Necesito confirmación |
| --- | --- | --- |
| Precio mensual | ₡3.500 | ¿Es el precio final? |
| Frecuencia | Mensual | ¿Mensual o anual? |
| Moneda | CRC | ¿Solo colones o también USD? |
| Días de prueba gratis | 0 | ¿Querés prueba gratis? |
| Reintentos de cobro | 3 (sugerido) | ¿Cuántos reintentos? |
| Renovación | Automática | Confirmado |

**Qué me tenés que pasar:** el **id numérico** del plan que devuelve Tilopay al crearlo (por ejemplo `624`).

Con ese id configuro `TILOPAY_RECURRING_PLAN_ID` y la suscripción queda operativa.

---

## 3. Certificación de dominio para Apple Pay (bloquea Apple Pay)

Esto es lo más fácil de pasar por alto. De la documentación oficial:

- Apple Pay **no funciona en modo de pruebas**: el botón no aparece y `applePaySupported` es `false`. Solo se prueba en producción real.
- El dominio debe estar **certificado para Apple Pay en la cuenta de Tilopay**.
- La comparación es **exacta**: `www.rubenrodriguezoficial.com` y `rubenrodriguezoficial.com` son dominios distintos y se certifican por separado.

**Qué me tenés que pasar:** el **dominio exacto** donde vivirá el sitio (con o sin `www`, tal como quedará publicado), para solicitar la certificación a `soporte@tilopay.com`.

**Nota importante sobre el enfoque:** implementé los pagos con el **enlace hospedado de Tilopay**, no con el SDK embebido. Es una decisión deliberada de seguridad: el SDK de Apple Pay exige que los campos de número de tarjeta, vencimiento y CVV existan en tu propia página aunque el cliente pague con Apple Pay, lo que amplía mucho el alcance de cumplimiento PCI del sitio. Con el enlace hospedado, ningún dato de tarjeta toca RubénWeb.

Si querés Apple Pay dibujado dentro del sitio (el botón negro nativo en tu propia página), decímelo: se puede, pero implica asumir ese alcance de cumplimiento.

---

## 4. Google Pay (bloquea Google Pay)

Google Pay se habilita **en la cuenta de comercio de Tilopay**, no por código. No hay un parámetro equivalente al de Apple Pay.

**Qué hacer:** pedir a Tilopay que habiliten Google Pay en la cuenta, indicando el dominio final.

---

## 5. Credenciales de OAuth para los tres inicios de sesión (bloquea el login)

Escribí el soporte para **Google, Apple y Facebook**. Cada uno necesita su propia app registrada. Apple es el más tardado porque requiere cuenta de desarrollador de Apple pagada.

### 5.1 Google

1. <https://console.cloud.google.com> → crear proyecto.
2. Habilitar la API de OAuth.
3. Crear credencial de **ID de cliente OAuth** tipo «Aplicación web».
4. URI de redirección autorizado: el que da Supabase (te lo indico abajo).

**Necesito:** Client ID y Client Secret.

### 5.2 Apple (el más lento — empezá por aquí si querés Apple)

1. Requiere **Apple Developer Program** (99 USD al año). Sin eso no hay forma.
2. Crear un **App ID** con la capacidad «Sign in with Apple».
3. Crear un **Services ID** (es el Client ID que se usa para web).
4. Configurar el dominio y la URL de retorno.
5. Crear una **clave privada** (.p8) con «Sign in with Apple» habilitado.

**Necesito:** Services ID, Team ID, Key ID y el archivo `.p8`.

Ojo: la clave `.p8` **solo se puede descargar una vez**. Guardala bien.

### 5.3 Facebook

1. <https://developers.facebook.com> → crear app tipo «Consumidor».
2. Agregar el producto «Inicio de sesión con Facebook».
3. Configurar la URI de redirección de OAuth válida.
4. Pasar la app a **modo Live** (en modo desarrollo solo funcionan cuentas de prueba). Esto requiere política de privacidad publicada y verificación del negocio.

**Necesito:** App ID y App Secret.

### 5.4 Proyecto de Supabase

Supabase Auth es quien hace el intercambio OAuth. Necesito:

1. **URL del proyecto**: `https://xxxxx.supabase.co`
2. **Publishable key** (puede ir en el navegador; está protegida por RLS)
3. **Secret key** (servidor únicamente — nunca la compartas por canales inseguros)

Y en el panel de Supabase → Authentication → Providers, hay que **activar los tres proveedores** y pegar ahí las credenciales del punto 5.1, 5.2 y 5.3. En cada uno, la URL de redirección que Supabase muestra es del tipo:

```
https://xxxxx.supabase.co/auth/v1/callback
```

Esa es la que va en Google, Apple y Facebook.

---

## 6. Cloudflare Turnstile (bloquea el cobro)

Protege el formulario de suscripción contra abuso automatizado. El código ya lo exige.

1. <https://dash.cloudflare.com> → Turnstile → agregar sitio.
2. Obtener **Site Key** (pública) y **Secret Key** (privada).

**Necesito:** ambas, más el dominio exacto para restringirlo.

---

## 7. Dominio y despliegue

**Necesito:** el dominio final. Con él se configuran las URLs de callback, los CORS de los tres proveedores y la certificación de Apple.

---

## 8. Decisiones de producto que me faltan

| Tema | Situación actual | Qué necesito |
| --- | --- | --- |
| Precio final | ₡3.500 es una semilla de ejemplo | Confirmar o corregir |
| Precio en USD | El código solo lee CRC | ¿Hace falta USD? |
| Prueba gratis | Desactivada | ¿Se quiere? ¿Cuántos días? |
| Cancelación | Hoy se hace en Tilopay | ¿Querés un botón «cancelar» en Mi cuenta? |
| Pago rechazado | Conserva acceso hasta el vencimiento pagado | ¿De acuerdo, o revocar de inmediato? |
| Reembolsos | Sin definir | ¿Política de reembolso? |
| Facturación | Tilopay envía comprobante | ¿Se necesita factura electrónica de Costa Rica? |

---

## Resumen: lo mínimo para empezar a cobrar

1. Cuenta de Tilopay + credenciales (`apiuser`, `password`, `key`)
2. Plan recurrente creado → su id numérico
3. Proyecto de Supabase + secret key
4. Turnstile (site key + secret)
5. Dominio final

Con esos cinco puntos el cobro recurrente queda operativo. Apple Pay y Google Pay suman dos requisitos extra: certificación de dominio y habilitación en la cuenta.

Los tres inicios de sesión son independientes del cobro y se pueden habilitar en paralelo; **Apple es el que más tarda**, así que si lo querés, conviene arrancar la cuenta de desarrollador de Apple ya.
