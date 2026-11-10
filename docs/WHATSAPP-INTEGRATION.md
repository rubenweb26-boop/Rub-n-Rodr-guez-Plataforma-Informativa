# Integración con WhatsApp Business Cloud API

La plataforma cuenta con un endpoint oficial de Webhook en `/api/webhooks/whatsapp` preparado para conectarse con la API oficial de WhatsApp Cloud de Meta.

---

## 1. Funcionalidades del Chatbot de WhatsApp

1. **Menú Interactivo de Bienvenida:**
   - Opción 1: Información detallada de membresías (₡3.500/mes) y enlace directo de pago seguro.
   - Opción 2: Instrucciones y enlace para presentar denuncias ciudadanas privadas.
   - Opción 3: Consulta en tiempo real del estado de un caso.
   - Opción 4: Información para anunciantes y vitrina comercial.
   - Opción 5: Derivación y notificación al equipo de moderación humana de Rubén Rodríguez.
2. **Consulta Autenticada de Estados de Denuncia:**
   - El ciudadano puede escribir su código de seguimiento (ej. `DEN-2026-CR-00101`).
   - El sistema consulta la base de datos y responde con el estado oficial (`Recepción`, `En Revisión`, `En Investigación`, `Concluida`).
   - **Garantía de Privacidad:** No se divulgan por WhatsApp evidencias, relatos íntimos ni datos personales, derivando siempre al usuario a consultar el expediente completo mediante inicio de sesión en su cuenta.

---

## 2. Variables de Entorno Requeridas

```env
# Token de verificacion elegido por usted para el handshake inicial con Meta
WHATSAPP_VERIFY_TOKEN=

# Token de acceso de usuario del sistema de Meta (con permiso whatsapp_business_messaging)
WHATSAPP_API_TOKEN=

# Identificador numerico del numero telefonico en WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=
```

---

## 3. Conexión en Meta for Developers

1. Ingrese a [Meta for Developers](https://developers.facebook.com/apps/) y seleccione su App de WhatsApp Business.
2. En la sección **WhatsApp > Configuración > Webhook**:
   - Ingrese como Callback URL:
     ```
     https://tudominio.com/api/webhooks/whatsapp
     ```
   - Ingrese el Verify Token:
     ```
     ruben_rodriguez_wa_verify_2026
     ```
3. Haga clic en **Verificar y Guardar**. El endpoint responderá con el `hub.challenge` esperado con código 200.
4. Active las suscripciones a campos:
   - `messages` (Obligatorio para recibir y responder mensajes de texto entrantes).
