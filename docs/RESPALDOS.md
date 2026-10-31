# Copias de seguridad y recuperación

## Objetivos propuestos

Los valores definitivos deben aprobarse según costo, volumen y obligaciones legales.

| Activo | RPO objetivo | RTO objetivo | Retención inicial |
| --- | --- | --- | --- |
| D1: casos, perfiles, pagos y auditoría | 24 h; menor para pagos | 8 h | 35 días + cierres mensuales 12 meses |
| R2: evidencias y material editorial | 24 h | 24 h | Según política legal y editorial |
| Código y migraciones | Por commit | 4 h | Historial Git |
| Configuración no secreta | Por cambio | 4 h | Historial Git |
| Secretos | No se respaldan en Git | Rotación inmediata | Gestor autorizado |

RPO es la pérdida máxima tolerada de datos; RTO es el tiempo objetivo de recuperación.

## Alcance

Respaldar:

- tablas D1 y metadatos de migración;
- objetos R2 y metadatos necesarios para relacionarlos;
- repositorio, lockfile, manifiesto de hosting y documentación;
- configuración exportable de proveedores sin secretos;
- registro de versiones y despliegues;
- evidencia de conciliación financiera.

No crear respaldos informales en escritorios personales, correo o servicios no aprobados.

## Requisitos de seguridad

- cifrado en tránsito y reposo;
- acceso de menor privilegio y MFA;
- separación entre producción y copias;
- registro de creación, descarga, restauración y eliminación;
- verificación de integridad mediante hash o mecanismo del proveedor;
- retención y eliminación coherentes con privacidad y litigios;
- secretos y claves de cifrado administrados fuera del respaldo.

## Procedimiento D1

Aplicable cuando el binding `DB` esté habilitado:

1. identificar versión desplegada y última migración aplicada;
2. iniciar exportación o snapshot con la herramienta oficial disponible;
3. registrar fecha, entorno, tamaño, responsable y checksum;
4. copiar a ubicación de respaldo autorizada y restringida;
5. comprobar que el archivo puede leerse y contiene tablas esperadas;
6. mantener migraciones y esquema del mismo commit que produjo el respaldo.

No modificar el archivo de respaldo. Los datos de pagos deben poder reconciliarse además con el proveedor.

## Procedimiento R2

Aplicable cuando el binding `BUCKET` esté habilitado:

1. generar inventario de objetos, versión, tamaño y checksum;
2. copiar objetos a destino autorizado con cifrado;
3. preservar claves lógicas y metadatos mínimos;
4. verificar una muestra y comparar inventario completo;
5. aplicar la misma política de retención y eliminación a copias;
6. asegurar que ninguna copia convierta evidencias en contenido público.

## Restauración

1. Abrir ticket de recuperación y determinar punto objetivo.
2. Preservar el entorno afectado para análisis.
3. Crear un entorno aislado, nunca restaurar primero sobre producción.
4. Restaurar esquema/migraciones compatibles y luego datos D1.
5. Restaurar objetos R2 y validar referencias.
6. Ejecutar pruebas de conteo, integridad, propietarios, permisos y archivos.
7. Reconciliar pagos y estados de suscripción con el proveedor.
8. Realizar prueba funcional de acceso, denuncias y administración.
9. Autorizar el cambio a producción y monitorear.
10. Documentar resultados, pérdida real y acciones preventivas.

## Prueba periódica

- Restauración completa trimestral durante el primer año.
- Prueba adicional después de cambios grandes de esquema o proveedor.
- Muestra mensual de lectura de archivos y consistencia de inventario.
- Evidencia de fecha, duración, errores, RPO/RTO logrado y aprobación.

Un respaldo no se considera válido hasta que se haya restaurado y verificado.

## Responsables pendientes

El cliente debe designar:

- propietario del proceso;
- custodio de credenciales;
- persona autorizada para restaurar;
- contacto de incidentes;
- asesor que aprueba retención y eliminación.
