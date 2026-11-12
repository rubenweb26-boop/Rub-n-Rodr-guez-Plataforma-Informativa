# WhatsApp Business

La conexión de WhatsApp Business pertenece al CRM y a la API privada, no a la web pública. El webhook se encuentra en `backend/src/server.mjs` bajo `/webhooks/whatsapp`. La antigua ruta pública `/api/webhooks/whatsapp` fue eliminada.

Para la verificación GET, configure `WHATSAPP_VERIFY_TOKEN` en el entorno de la API. No existe un valor por defecto. Para recibir POST, configure `WHATSAPP_APP_SECRET`; la API comprueba `X-Hub-Signature-256` con HMAC SHA-256 sobre el cuerpo exacto y rechaza solicitudes sin firma válida.

Actualmente el webhook confirma los eventos válidos sin almacenar conversaciones ni enviar respuestas. La integración permanecerá inactiva hasta contar con una cuenta WhatsApp Business autorizada, consentimiento de los participantes, almacenamiento cifrado, reglas de retención, plantillas aprobadas y credenciales de la API oficial. No configure tokens en `CRM/` ni en la web pública.
