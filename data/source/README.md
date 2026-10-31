# Fuentes oficiales de la División Territorial Administrativa

Fecha de consulta y descarga: **2026-10-30** (America/Costa_Rica).

Este directorio conserva una copia verificable de las fuentes oficiales usadas para provincias, cantones y distritos de Costa Rica. Los nombres se mantienen tal como los publica cada institución; no se corrigen ni normalizan silenciosamente.

## Fuente primaria vigente: IGN / SNIT

- **Responsable:** Instituto Geográfico Nacional (IGN), Registro Nacional de Costa Rica.
- **Servicio oficial:** Sistema Nacional de Información Territorial (SNIT), nodo `IGN Cartografía 1:5mil CO`.
- **Capa:** `DTA (Límite Distrital)` / `IGN_5_CO:limitedistrital_5k`.
- **Cobertura comprobada:** 7 provincias, 84 cantones y 494 distritos.
- **Versión publicada en los 494 registros:** `20260410001` (valor literal del atributo `VERSIÓN`; no se presume una semántica adicional).
- **Marca de tiempo del GeoJSON descargado:** `2026-10-31T01:54:00.051Z`, equivalente a 2026-10-30 en Costa Rica.
- **Formato de origen:** WFS 2.0 con salida GeoJSON (`application/json`), CRS `EPSG:8908`.
- **WFS:** <https://geos.snitcr.go.cr/be/IGN_5_CO/wfs>
- **GetCapabilities:** <https://geos.snitcr.go.cr/be/IGN_5_CO/wfs?service=WFS&request=GetCapabilities>
- **Consulta descargada:** <https://geos.snitcr.go.cr/be/IGN_5_CO/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=IGN_5_CO%3Alimitedistrital_5k&outputFormat=application%2Fjson>
- **Confirmación institucional de la URL del nodo DTA:** <https://www.registronacional.go.cr/noticias/comunicados/2023/03%20Nueva%20ubicacion%20para%20capas%20DTA%20en%20el%20SNIT.pdf>
- **Directorio oficial de capas:** <https://www1.snitcr.go.cr/pdfs/tutoriales_presentaciones/Manual%20para%20la%20consulta%20de%20Capas%20Oficiales%20Institucionales%20del%20SNIT.pdf>

Archivos:

- `ign-snit-dta-distritos-version-20260410001.geojson`: respuesta íntegra del WFS, incluida la geometría oficial.
- `ign-snit-dta-distritos-version-20260410001.csv`: extracto derivado sin geometría, ordenado por `codigo_dta`, codificado como UTF-8 con BOM. Conserva código DTA, jerarquía, legislación, fecha de oficialización, región, área publicada en `SDE` y versión. No modifica los valores de origen.

El manual de capas del SNIT identifica esta capa como **oficial** y explica que representa las jerarquías político-administrativas hasta el distrito. El IGN también declara que brinda la consulta de la DTA y servicios OGC/WFS: <https://www.registronacional.go.cr/instituto_geografico/>.

## Fuente secundaria de contraste: INEC

- **Responsable de la publicación:** Instituto Nacional de Estadística y Censos (INEC) de Costa Rica.
- **Publicación:** `Anuario estadístico 2024-2025. Medio Ambiente`.
- **Vigencia declarada:** 2025 para los cuadros de DTA.
- **Formato:** XLSX.
- **Página oficial:** <https://admin.inec.cr/node/58161>
- **Descarga oficial:** <https://admin.inec.cr/sites/default/files/2026-09/reambienteanuario2024-2025.xlsx>
- **Archivo local:** `inec-anuario-medio-ambiente-2024-2025.xlsx`.

El cuadro 9.1 declara como fuente al Instituto Geográfico Nacional de Costa Rica y contiene 7 provincias, 84 cantones y 494 distritos. La cobertura coincide con el WFS. Se detectaron diferencias de escritura entre ambas publicaciones —por ejemplo, `León Cortés`/`León Cortés Castro`, `Monte Verde`/`Monteverde`, `Varablanca`/`Vara Blanca` y `Pejibaye`/`Pejivalle`—, por lo que no deben mezclarse nombres entre fuentes sin una decisión editorial documentada. Para el catálogo operativo se conserva literalmente el WFS más reciente.

## Condiciones de uso y atribución

Las condiciones oficiales del SNIT permiten que entidades privadas, con o sin fines de lucro, usen sus servicios e información; sin embargo, indican expresamente que **no está autorizado el uso comercial de la información geográfica directa o derivada**. Véase <https://www.snitcr.go.cr/snit_condiciones>.

Por ello:

1. Estos archivos quedan habilitados para evaluación y desarrollo interno.
2. Antes de incorporar el GeoJSON o el CSV derivado en un producto comercial o de membresía se requiere aclaración o autorización escrita del IGN/SNIT.
3. El contacto indicado por SNIT para consultas de uso es `snit.info@rnp.go.cr`.
4. Los metadatos WFS `Fees: NONE` y `AccessConstraints: NONE` describen el acceso técnico al servicio, pero no sustituyen las condiciones de uso publicadas por SNIT.
5. La página y el XLSX del INEC consultados no exhiben una licencia de reutilización separada. Se conserva la atribución y no se presume una licencia más amplia.

Atribución recomendada para cualquier uso autorizado:

> Fuente: Instituto Geográfico Nacional (IGN), Registro Nacional de Costa Rica, vía Sistema Nacional de Información Territorial (SNIT), capa oficial DTA (Límite Distrital), `IGN_5_CO:limitedistrital_5k`, versión `20260410001`; consulta 2026-10-30.

Para el contraste estadístico:

> Fuente secundaria: INEC Costa Rica, Anuario estadístico 2024-2025, Medio Ambiente, cuadro 9.1; fuente original declarada por el cuadro: Instituto Geográfico Nacional de Costa Rica, DTA 2025.

## Integridad

SHA-256:

```text
BEA20E9F85734788A74BEAA5592807754A53E1100F99BC424D8F03617A0E5DDF  ign-snit-dta-distritos-version-20260410001.csv
3CEBA4EF2D67FFBDB4A758F1E6D99A8C5F4AB9565706E9F9551B761EE665177B  ign-snit-dta-distritos-version-20260410001.geojson
726DB4B20BA1CEF2CD27568D127B0112DFA918DB504F3114957D959A6E106AC0  inec-anuario-medio-ambiente-2024-2025.xlsx
```

## Actualización

El SNIT señala que consumir sus servicios web permite acceder a la versión más reciente que posea la institución. Antes de publicar o importar estos datos debe repetirse la consulta WFS, comparar el atributo `VERSIÓN`, verificar los conteos y conservar un nuevo archivo con fecha o versión; no se debe sobrescribir esta evidencia de origen.
