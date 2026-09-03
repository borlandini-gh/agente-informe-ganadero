## 1. Identificación

| Campo | Valor |
|---|---|
| Archivo procesado | `MASTER_AGOSTO_2026.xlsx` |
| Versión del contrato | v3 |
| Período informado | julio de 2026 (`RESUMEN TOTAL!A18` = 31/07/2026) |
| Fecha prevista de comunicación | 10/08/2026 |
| Información auditada hasta | 31/03/2026 |
| Línea de base estructural | `MASTER_MARZO_2026.xlsx`, aprobado después de la corrida 2 |

## 2. Checklist de controles

| ID | Control | Estado | Alcance afectado | Evidencia | Acción |
|---|---|---|---|---|---|
| C01 | El archivo puede abrirse | OK | Todos | El libro y las hojas requeridas son legibles | Ninguna |
| C02 | `RESUMEN TOTAL!A18` contiene un período válido | OK | Todos | `A18` = 31/07/2026 | Ninguna |
| C03 | Se identifican sin ambigüedad Fondo A y Series I–IV | OK | Todos | Las cinco etiquetas y sus campos obligatorios son inequívocos | Ninguna |
| C04 | Los campos obligatorios son numéricos, completos y válidos | OK | Todos | Valores numéricos completos; no hay negativos no permitidos | Ninguna |
| C05 | Provincias = total de cabezas del Fondo A | OK | Mail 1 | Provincias J:R = 4.818; S6 = `SUM(J6:R6)` = 4.818 | Ninguna |
| C06 | Provincias = total de cabezas de la Serie I | OK | Mails 2 y 3 | Provincias J:R = 2.848; S8 = `SUM(J8:R8)` = 2.848 | Ninguna |
| C07 | Provincias = total de cabezas de la Serie II | OK | Mails 2 y 3 | Provincias J:R = 8.245; S9 = `SUM(J9:R9)` = 8.245 | Ninguna |
| C08 | Provincias = total de cabezas de la Serie III | OK | Mails 2 y 3 | Provincias J:R = 4.049; S10 = `SUM(J10:R10)` = 4.049 | Ninguna |
| C09 | Provincias = total de cabezas de la Serie IV | OK | Mails 2 y 3 | Provincias J:R = 4.650; S11 = `SUM(J11:R11)` = 4.650 | Ninguna |
| C10 | La fecha auditada es correcta y está disponible | OK | Todos | El 30/06/2026 recién estará disponible el 15/08; al 10/08 corresponde 31/03/2026 | Ninguna |
| C11 | Plantillas, idioma y formato numérico son consistentes | OK | Todos | Cabezas y toneladas se presentan como enteros; equivalencia ES/EN verificada | Revisión humana |

## 3. Alertas

| Tipo | Hoja | Sección | Celda o rango | Cambio o problema | Impacto sobre los mails | Acción requerida |
|---|---|---|---|---|---|---|
| CAMBIO_DE_ESTRUCTURA — EVOLUCIÓN_COMPATIBLE | `RESUMEN TOTAL` | Encabezado del bloque provincial | Q3 | Se agregó la provincia La Pampa respecto de la línea de base | No bloquea; se incorpora dinámicamente | Verificar la provincia y aprobar la nueva línea de base |
| CAMBIO_DE_ESTRUCTURA — EVOLUCIÓN_COMPATIBLE | `RESUMEN TOTAL` | Encabezado del bloque provincial | R3 | Buenos Aires se desplazó de Q3 a R3 | No bloquea; la etiqueta sigue siendo inequívoca | Verificar desplazamiento |
| CAMBIO_DE_ESTRUCTURA — EVOLUCIÓN_COMPATIBLE | `RESUMEN TOTAL` | Totales de cabezas | S6, S8:S11 | El total se desplazó de R a S y ahora suma exactamente J:R | No bloquea; C05–C09 usan la fórmula actual | Verificar fórmulas y aprobar la nueva línea de base |
| CAMBIO_DE_ESTRUCTURA — EVOLUCIÓN_COMPATIBLE | `Fondo A – Establecimientos` | Rango utilizado | A1:BN80 | El rango utilizado creció desde A1:BI70 | No bloquea los mails; relevante para usos futuros | Revisar las nuevas columnas y filas |
| CAMBIO_DE_ESTRUCTURA — EVOLUCIÓN_COMPATIBLE | `Fondo A – Establecimientos` | Nuevas etiquetas y resumen | A10, A28:A29, A32, A34, A43, A56, A78:A80 | Se incorporaron campos/filas; el resumen incluye La Pampa | No bloquea los mails | Revisar contenido y documentar uso futuro |
| CAMBIO_DE_ESTRUCTURA — EVOLUCIÓN_COMPATIBLE | `Serie I – Establecimientos` | Rango utilizado | A1:BF82 | El rango utilizado creció desde A1:BA77 | No bloquea los mails | Revisar expansión |
| CAMBIO_DE_ESTRUCTURA — EVOLUCIÓN_COMPATIBLE | `Serie I – Establecimientos` | Nuevas etiquetas y resumen | A9, A23, A32, A46, A53, A82 | Se incorporaron campos/filas y un registro provincial para La Pampa | No bloquea los mails | Revisar contenido y documentar uso futuro |
| CAMBIO_DE_ESTRUCTURA — EVOLUCIÓN_COMPATIBLE | `Serie II – Establecimientos` | Rango utilizado | A1:BM89 | El rango utilizado creció desde A1:BH77 | No bloquea los mails | Revisar expansión |
| CAMBIO_DE_ESTRUCTURA — EVOLUCIÓN_COMPATIBLE | `Serie II – Establecimientos` | Nuevas etiquetas y provincias | A19, A25, A35, A37:A39, A45, A62:A63, A85:A86 | Se incorporaron campos/filas y campos provinciales | No bloquea los mails | Revisar contenido y documentar uso futuro |
| CAMBIO_DE_ESTRUCTURA — EVOLUCIÓN_COMPATIBLE | `Serie III – Establecimientos` | Rango utilizado | A1:AK78 | El rango utilizado creció desde A1:AF70 | No bloquea los mails | Revisar expansión |
| CAMBIO_DE_ESTRUCTURA — EVOLUCIÓN_COMPATIBLE | `Serie III – Establecimientos` | Nuevas etiquetas y resumen | A25, A35, A47:A51, A76 | Se incorporaron campos/filas y un registro provincial para La Pampa | No bloquea los mails | Revisar contenido y documentar uso futuro |
| CAMBIO_DE_ESTRUCTURA — EVOLUCIÓN_COMPATIBLE | `Serie IV – Establecimientos` | Rango utilizado | A1:AC83 | El rango utilizado creció desde A1:X74 | No bloquea los mails | Revisar expansión |
| CAMBIO_DE_ESTRUCTURA — EVOLUCIÓN_COMPATIBLE | `Serie IV – Establecimientos` | Nuevas etiquetas y resumen | A12:A13, A33, A47:A48, A52:A53, A79, A81 | Se incorporaron campos, filas y posiciones de resumen | No bloquea los mails | Revisar contenido y documentar uso futuro |

## 4. Estado de los mails

| Mail | Idioma | Alcance | Estado | Motivo |
|---|---|---|---|---|
| 1 | Español | Fondo A | LISTO_PARA_REVISIÓN | C01–C11 en OK; cambios estructurales compatibles |
| 2 | Español | Fondo B, Series I–IV | LISTO_PARA_REVISIÓN | C01–C11 en OK; cambios estructurales compatibles |
| 3 | Inglés | Fondo B, Series I–IV | LISTO_PARA_REVISIÓN | C01–C11 en OK; cambios estructurales compatibles |

## 5. Mails generados

### Mail 1

**Asunto:** Informe Mensual de Gestión | Fondo A | julio de 2026

**Cuerpo:**

Estimados:

Adjuntamos al presente el Informe Mensual de Gestión del Fondo A, correspondiente al mes de julio de 2026 (información auditada hasta el 31 de marzo de 2026).

Algunos datos de interés del informe adjunto:

Fondo A – Ganadero

- Fondos fideicomitidos totales: $ 9.580.487.004
- Valor unitario del CP: 9,580
- Variación mensual del Fondo: 1,09%
- YTD al 31/07: 7,42%

Al cierre del mes tenemos 4.818 cabezas de hacienda distribuidas en establecimientos productivos en Córdoba, Entre Ríos, Santiago del Estero, La Pampa y Buenos Aires.

Cualquier duda, pueden acercarnos sus comentarios.

Saludos,

El equipo de Gestión

### Mail 2

**Asunto:** Informes Mensuales de Gestión | Fondo B | julio de 2026

**Cuerpo:**

Estimados:

Les acercamos nuestros Informes de Gestión del Fondo B correspondientes al mes de julio de 2026 (información auditada hasta el 31 de marzo de 2026).

Algunos datos de interés de los informes adjuntos:

Fondo B – Serie I

- Fondos fideicomitidos totales: $ 7.639.611.693
- Valor unitario del CP: 9,632
- Variación mensual del Fondo: 1,02%
- YTD al 31/07: 3,77%

Al cierre del mes tenemos 2.848 cabezas de hacienda distribuidas en establecimientos productivos en Entre Ríos, Santiago del Estero y Buenos Aires, además de 2.376 toneladas de granos.

Fondo B – Serie II

- Fondos fideicomitidos totales: $ 17.800.392.362
- Valor unitario del CP: 8,279
- Variación mensual del Fondo: 1,12%
- YTD al 31/07: 2,70%

Al cierre del mes tenemos 8.245 cabezas de hacienda distribuidas en establecimientos productivos en Corrientes, Córdoba, Santa Fe, Entre Ríos, San Luis, Santiago del Estero, La Pampa y Buenos Aires, además de 7.042 toneladas de granos.

Fondo B – Serie III

- Fondos fideicomitidos totales: $ 10.577.837.344
- Valor unitario del CP: 3,526
- Variación mensual del Fondo: 1,34%
- YTD al 31/07: 4,83%

Al cierre del mes tenemos 4.049 cabezas de hacienda distribuidas en establecimientos productivos en Salta, Corrientes, Córdoba, Santa Fe, Entre Ríos y Buenos Aires, además de 2.549 toneladas de granos.

Fondo B – Serie IV

- Fondos fideicomitidos totales: $ 9.003.075.757
- Valor unitario del CP: 1,979
- Variación mensual del Fondo: 1,00%
- YTD al 31/07: 3,97%

Al cierre del mes tenemos 4.650 cabezas de hacienda distribuidas en establecimientos productivos en Salta, Corrientes, Córdoba, Santa Fe, Entre Ríos, San Luis, Santiago del Estero y Buenos Aires, además de 1.796 toneladas de granos.

Cualquier duda, pueden acercarnos sus comentarios.

Saludos,

El equipo de Gestión

### Mail 3

**Subject:** Fund B | July 2026 Business and Financial Report

**Body:**

Dear Investment Team,

Please find attached the Fund B Business and Financial Report for July 2026, which includes audited information as of March 31, 2026.

Below are some key highlights from the report:

Fund B – Series I

- Total funds held in trust: ARS 7,639,611,693
- Participation Certificate (CP) unit value: 9.632
- Monthly return: 1.02%
- YTD return as of July 31: 3.77%

As of month-end, the trust held 2,848 head of cattle across production farms in Entre Ríos, Santiago del Estero and Buenos Aires, as well as 2,376 metric tons of grain.

Fund B – Series II

- Total funds held in trust: ARS 17,800,392,362
- Participation Certificate (CP) unit value: 8.279
- Monthly return: 1.12%
- YTD return as of July 31: 2.70%

As of month-end, the trust held 8,245 head of cattle across production farms in Corrientes, Córdoba, Santa Fe, Entre Ríos, San Luis, Santiago del Estero, La Pampa and Buenos Aires, as well as 7,042 metric tons of grain.

Fund B – Series III

- Total funds held in trust: ARS 10,577,837,344
- Participation Certificate (CP) unit value: 3.526
- Monthly return: 1.34%
- YTD return as of July 31: 4.83%

As of month-end, the trust held 4,049 head of cattle across production farms in Salta, Corrientes, Córdoba, Santa Fe, Entre Ríos and Buenos Aires, as well as 2,549 metric tons of grain.

Fund B – Series IV

- Total funds held in trust: ARS 9,003,075,757
- Participation Certificate (CP) unit value: 1.979
- Monthly return: 1.00%
- YTD return as of July 31: 3.97%

As of month-end, the trust held 4,650 head of cattle across production farms in Salta, Corrientes, Córdoba, Santa Fe, Entre Ríos, San Luis, Santiago del Estero and Buenos Aires, as well as 1,796 metric tons of grain.

Please let us know if you have any questions or comments.

Best regards,

Fund Management Team


