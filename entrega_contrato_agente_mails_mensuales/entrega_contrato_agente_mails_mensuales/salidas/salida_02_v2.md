## 1. Identificación

| Campo | Valor |
|---|---|
| Archivo procesado | `MASTER_MARZO_2026.xlsx` |
| Versión del contrato | v2 |
| Período informado | febrero de 2026 (`RESUMEN TOTAL!A18` = 28/02/2026) |
| Fecha prevista de comunicación | 10/03/2026 |
| Información auditada hasta | 31/12/2025 |
| Línea de base estructural | `COMPARACIÓN_NO_DISPONIBLE` |

## 2. Checklist de controles

| ID | Control | Estado | Alcance afectado | Evidencia | Acción |
|---|---|---|---|---|---|
| C01 | El archivo puede abrirse | OK | Todos | El libro y `RESUMEN TOTAL` son legibles | Ninguna |
| C02 | `RESUMEN TOTAL!A18` contiene un período válido | OK | Todos | `A18` = 28/02/2026 | Ninguna |
| C03 | Se identifican sin ambigüedad Fondo A y Series I–IV | OK | Todos | Etiquetas localizadas en filas 6 y 8:11 | Ninguna |
| C04 | Los campos obligatorios son numéricos, completos y válidos | OK | Todos | Todos los campos requeridos son numéricos y no negativos donde corresponde | Ninguna |
| C05 | Provincias = total de cabezas del Fondo A | OK | Mail 1 | Provincias J:Q = 4.413; R6 = `SUM(J6:Q6)` = 4.413 | Ninguna |
| C06 | Provincias = total de cabezas de la Serie I | OK | Mails 2 y 3 | Provincias J:Q = 2.831; R8 = `SUM(J8:Q8)` = 2.831 | Ninguna |
| C07 | Provincias = total de cabezas de la Serie II | OK | Mails 2 y 3 | Provincias J:Q = 6.577; R9 = `SUM(J9:Q9)` = 6.577 | Ninguna |
| C08 | Provincias = total de cabezas de la Serie III | OK | Mails 2 y 3 | Provincias J:Q = 2.777; R10 = `SUM(J10:Q10)` = 2.777 | Ninguna |
| C09 | Provincias = total de cabezas de la Serie IV | OK | Mails 2 y 3 | Provincias J:Q = 3.385; R11 = `SUM(J11:Q11)` = 3.385 | Ninguna |
| C10 | La fecha auditada es correcta y está disponible | OK | Todos | Al 10/03/2026 corresponde el cierre 31/12/2025 | Ninguna |
| C11 | Plantillas, idioma y formato numérico son consistentes | OK | Todos | Se aplicaron las tres plantillas y los formatos ES/EN de v2 | Revisión humana |

## 3. Alertas

| Tipo | Hoja | Sección | Celda o rango | Cambio o problema | Impacto sobre los mails | Acción requerida |
|---|---|---|---|---|---|---|
| COMPARACIÓN_NO_DISPONIBLE | — | Línea de base | — | No se proporcionó un MASTER anterior aprobado para comparar estructura | No bloquea | Conservar este MASTER como línea de base tras aprobación humana |

## 4. Estado de los mails

| Mail | Idioma | Alcance | Estado | Motivo |
|---|---|---|---|---|
| 1 | Español | Fondo A | LISTO_PARA_REVISIÓN | C01–C11 sin errores aplicables |
| 2 | Español | Fondo B, Series I–IV | LISTO_PARA_REVISIÓN | C01–C11 sin errores aplicables |
| 3 | Inglés | Fondo B, Series I–IV | LISTO_PARA_REVISIÓN | C01–C11 sin errores aplicables |

## 5. Mails generados

### Mail 1

**Asunto:** Informe Mensual de Gestión | Fondo A | febrero de 2026

**Cuerpo:**

Estimados:

Adjuntamos al presente el Informe Mensual de Gestión del Fondo A, correspondiente al mes de febrero de 2026 (información auditada hasta el 31 de diciembre de 2025).

Algunos datos de interés del informe adjunto:

Fondo A – Ganadero

- Fondos fideicomitidos totales: $ 9.598.777.589
- Valor unitario del CP: 9,599
- Variación mensual del Fondo: 4,49%
- YTD al 28/02: 7,63%

Al cierre del mes tenemos 4.413 cabezas de hacienda distribuidas en establecimientos productivos en Corrientes, Santa Fe, Entre Ríos, Santiago del Estero y Buenos Aires.

Cualquier duda, pueden acercarnos sus comentarios.

Saludos,

El equipo de Gestión

### Mail 2

**Asunto:** Informes Mensuales de Gestión | Fondo B | febrero de 2026

**Cuerpo:**

Estimados:

Les acercamos nuestros Informes de Gestión del Fondo B correspondientes al mes de febrero de 2026 (información auditada hasta el 31 de diciembre de 2025).

Algunos datos de interés de los informes adjuntos:

Fondo B – Serie I

- Fondos fideicomitidos totales: $ 7.798.543.788
- Valor unitario del CP: 9,832
- Variación mensual del Fondo: 4,35%
- YTD al 28/02: 5,93%

Al cierre del mes tenemos 2.831 cabezas de hacienda distribuidas en establecimientos productivos en Corrientes, Santa Fe, Entre Ríos, Santiago del Estero y Buenos Aires, además de 2.375,4 toneladas de granos.

Fondo B – Serie II

- Fondos fideicomitidos totales: $ 18.428.302.337
- Valor unitario del CP: 8,571
- Variación mensual del Fondo: 3,06%
- YTD al 28/02: 6,33%

Al cierre del mes tenemos 6.577 cabezas de hacienda distribuidas en establecimientos productivos en Corrientes, Córdoba, Santa Fe, Entre Ríos, San Luis y Buenos Aires, además de 7.292,4 toneladas de granos.

Fondo B – Serie III

- Fondos fideicomitidos totales: $ 10.822.897.935
- Valor unitario del CP: 3,608
- Variación mensual del Fondo: 5,68%
- YTD al 28/02: 7,26%

Al cierre del mes tenemos 2.777 cabezas de hacienda distribuidas en establecimientos productivos en Salta, Corrientes, Córdoba, Santa Fe, Entre Ríos y Buenos Aires, además de 2.548,655 toneladas de granos.

Fondo B – Serie IV

- Fondos fideicomitidos totales: $ 9.715.923.583
- Valor unitario del CP: 2,135
- Variación mensual del Fondo: 6,76%
- YTD al 28/02: 8,15%

Al cierre del mes tenemos 3.385 cabezas de hacienda distribuidas en establecimientos productivos en Salta, Corrientes, Córdoba, Santa Fe, San Luis y Buenos Aires, además de 1.796 toneladas de granos.

Cualquier duda, pueden acercarnos sus comentarios.

Saludos,

El equipo de Gestión

### Mail 3

**Subject:** Fund B | February 2026 Business and Financial Report

**Body:**

Dear Investment Team,

Please find attached the Fund B Business and Financial Report for February 2026, which includes audited information as of December 31, 2025.

Below are some key highlights from the report:

Fund B – Series I

- Total funds held in trust: ARS 7,798,543,788
- Participation Certificate (CP) unit value: 9.832
- Monthly return: 4.35%
- YTD return as of February 28: 5.93%

As of month-end, the trust held 2,831 head of cattle across production farms in Corrientes, Santa Fe, Entre Ríos, Santiago del Estero and Buenos Aires, as well as 2,375.4 metric tons of grain.

Fund B – Series II

- Total funds held in trust: ARS 18,428,302,337
- Participation Certificate (CP) unit value: 8.571
- Monthly return: 3.06%
- YTD return as of February 28: 6.33%

As of month-end, the trust held 6,577 head of cattle across production farms in Corrientes, Córdoba, Santa Fe, Entre Ríos, San Luis and Buenos Aires, as well as 7,292.4 metric tons of grain.

Fund B – Series III

- Total funds held in trust: ARS 10,822,897,935
- Participation Certificate (CP) unit value: 3.608
- Monthly return: 5.68%
- YTD return as of February 28: 7.26%

As of month-end, the trust held 2,777 head of cattle across production farms in Salta, Corrientes, Córdoba, Santa Fe, Entre Ríos and Buenos Aires, as well as 2,548.655 metric tons of grain.

Fund B – Series IV

- Total funds held in trust: ARS 9,715,923,583
- Participation Certificate (CP) unit value: 2.135
- Monthly return: 6.76%
- YTD return as of February 28: 8.15%

As of month-end, the trust held 3,385 head of cattle across production farms in Salta, Corrientes, Córdoba, Santa Fe, San Luis and Buenos Aires, as well as 1,796 metric tons of grain.

Please let us know if you have any questions or comments.

Best regards,

Fund Management Team

