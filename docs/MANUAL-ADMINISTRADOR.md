# Manual Operativo para Rubén Rodríguez y Equipo Administrativo

Este documento describe la operación diaria del panel de administración central y la gestión de denuncias, investigaciones y anunciantes en la plataforma.

---

## 1. Acceso a la Consola Administrativa

- **URL de Acceso:** `https://tudominio.com/admin`
- **Requisitos de Seguridad:**
  1. La cuenta de correo debe contar con rol `admin` o `moderator` en la base de datos (o coincidir con `ADMIN_EMAIL` en el entorno).
  2. En producción, la sesión debe cumplir con el nivel de aseguramiento reforzado **AAL2 (Autenticación de Dos Factores - MFA)** gestionado a través de Supabase Auth.
  3. Toda lectura del panel y modificación de expedientes genera un registro inmutable en la tabla `audit_logs` con hash criptográfico del actor, IP anonimizada y timestamp.

---

## 2. Gestión de Denuncias Ciudadanas

La plataforma recibe denuncias confidenciales que son **privadas por defecto**. Ninguna denuncia se publica automáticamente.

### Estados del Flujo de Trabajo
1. **Recepción (`submitted`):**
   - El ciudadano ha completado el formulario oficial (Provincia, Cantón, Distrito, hechos y evidencias).
   - Se ha generado su código único de seguimiento (ej. `DEN-2026-CR-00101`).
   - El caso espera asignación y triaje preliminar.
2. **En Revisión Preliminar (`under_review`):**
   - El equipo analiza los hechos relatados y verifica la consistencia de las pruebas aportadas (fotografías, videos, documentos).
3. **En Investigación de Campo (`investigating`):**
   - El caso requiere inspección en el terreno, coordinación con inspectores de SENASA, solicitud de informes a gobiernos locales o articulación con el OIJ y Fiscalía Ambiental.
4. **Concluida (`closed`):**
   - El caso ha culminado con una resolución administrativa, decomiso judicial o traslado formal ante la autoridad penal competente.

### Cifrado y Cadena de Custodia
- El relato y las evidencias se almacenan cifrados con algoritmo **AES-256-GCM**.
- Los archivos en almacenamiento privado (`complaint-evidence`) se validan con verificación de tipo MIME real por firma de bytes (magic numbers) para evitar cargas maliciosas.

---

## 3. Investigaciones y Videos Exclusivos

Ubicación: Pestaña **Investigaciones y Videos** o `/contenido`.

- **Creación de Reportajes:**
  - Título, slug único, resumen (teaser público), hallazgos clave y contenido en Markdown.
  - Marcado `is_premium: true`: El público general podrá ver el encabezado, fotografías y resumen informativo, pero el informe pericial completo y el reproductor de video en alta definición permanecerán protegidos por el muro de pago de la membresía ciudadana (₡3.500/mes).
  - La verificación de acceso se ejecuta 100% en el servidor mediante `checkUserSubscriptionAccess()`, impidiendo cualquier manipulación desde `localStorage` o cookies del navegador.

---

## 4. Anunciantes y Vitrina Comercial

Ubicación: Pestaña **Anunciantes y Vitrina** o `/anuncios`.

- **Control de Negocios:**
  - El administrador puede aprobar (`approved`), pausar (`paused`) o rechazar (`rejected`) cada comercio registrado.
- **Límite de Catálogo:**
  - Por regla de la plataforma y trigger en base de datos, cada negocio puede registrar un **máximo estricto de 10 productos o servicios**.
- **Botón de Contacto:**
  - Cada producto en la vitrina incluye el botón **"Infórmate directamente con el proveedor"**, enlazando al WhatsApp verificado del comercio para evitar intermediación financiera o falsas pasarelas de pago dentro del sitio.

---

## 5. Suscripciones y Facturación

Ubicación: Pestaña **Suscripciones y Pagos**.

- **Membresía Ciudadana (₡3.500 mensuales):** Financia investigaciones encubiertas y otorga seguimiento prioritario.
- **Membresía Comercial (₡3.500 mensuales):** Habilita el perfil comercial, publicación de hasta 10 productos y presencia en el carrusel de la página de inicio.
- Ambas pasarelas (ONVO Pay y Tilopay) envían webhooks oficiales que extienden la ventana de acceso `access_until` por 32 días en cada cobro recurrente exitoso.
