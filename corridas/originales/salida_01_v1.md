## 1. Identificación

| Campo | Valor |
|---|---|
| Archivo procesado | `MASTER_MARZO_2026.xlsx` |
| Versión del contrato | v1 |
| Período informado | febrero de 2026 (`RESUMEN TOTAL!A18` = 28/02/2026) |
| Fecha prevista de comunicación | 10/03/2026 |
| Información auditada hasta | 31/12/2025 |
| Línea de base estructural | No contemplada en v1 |

## 2. Checklist de controles

| ID | Control | Estado | Alcance afectado | Evidencia | Acción |
|---|---|---|---|---|---|
| C01 | El archivo puede abrirse | OK | Todos | El libro y `RESUMEN TOTAL` son legibles | Ninguna |
| C02 | `RESUMEN TOTAL!A18` contiene un período válido | OK | Todos | `A18` = 28/02/2026 | Ninguna |
| C03 | Se identifican sin ambigüedad Fondo A y Series I–IV | OK | Todos | Filas fijas 6 y 8:11 localizadas | Ninguna |
| C04 | Los campos obligatorios son numéricos, completos y válidos | OK | Todos | B:E, H y J:S contienen valores numéricos | Ninguna |
| C05 | Provincias = total de cabezas del Fondo A | ERROR | Mail 1 | Suma J:R = 8.826; S6 = 740 | Revisar columnas de provincias y total |
| C06 | Provincias = total de cabezas de la Serie I | ERROR | Mails 2 y 3 | Suma J:R = 5.662; S8 = 903 | Revisar columnas de provincias y total |
| C07 | Provincias = total de cabezas de la Serie II | ERROR | Mails 2 y 3 | Suma J:R = 13.154; S9 = 1.646 | Revisar columnas de provincias y total |
| C08 | Provincias = total de cabezas de la Serie III | ERROR | Mails 2 y 3 | Suma J:R = 5.554; S10 = 2.462 | Revisar columnas de provincias y total |
| C09 | Provincias = total de cabezas de la Serie IV | ERROR | Mails 2 y 3 | Suma J:R = 6.770; S11 = 1.542 | Revisar columnas de provincias y total |
| C10 | La fecha auditada es correcta y está disponible | OK | Todos | Al 10/03/2026 está disponible el cierre 31/12/2025 | Ninguna |
| C11 | Plantillas, idioma y formato numérico son consistentes | NO_VERIFICADO | Todos | No se generaron mails por C05–C09 | Resolver controles previos |

## 3. Alertas

| Tipo | Hoja | Sección | Celda o rango | Cambio o problema | Impacto sobre los mails | Acción requerida |
|---|---|---|---|---|---|---|
| INCONSISTENCIA | `RESUMEN TOTAL` | Fondo A | J6:S6 | La suma J:R no coincide con S6 | Bloquea mail 1 | Revisar origen del total |
| INCONSISTENCIA | `RESUMEN TOTAL` | Fondo B – Serie I | J8:S8 | La suma J:R no coincide con S8 | Bloquea mails 2 y 3 | Revisar origen del total |
| INCONSISTENCIA | `RESUMEN TOTAL` | Fondo B – Serie II | J9:S9 | La suma J:R no coincide con S9 | Bloquea mails 2 y 3 | Revisar origen del total |
| INCONSISTENCIA | `RESUMEN TOTAL` | Fondo B – Serie III | J10:S10 | La suma J:R no coincide con S10 | Bloquea mails 2 y 3 | Revisar origen del total |
| INCONSISTENCIA | `RESUMEN TOTAL` | Fondo B – Serie IV | J11:S11 | La suma J:R no coincide con S11 | Bloquea mails 2 y 3 | Revisar origen del total |

## 4. Estado de los mails

| Mail | Idioma | Alcance | Estado | Motivo |
|---|---|---|---|---|
| 1 | Español | Fondo A | BLOQUEADO | C05 |
| 2 | Español | Fondo B, Series I–IV | BLOQUEADO | C06–C09 |
| 3 | Inglés | Fondo B, Series I–IV | BLOQUEADO | C06–C09 |

## 5. Mails generados

### Mail 1

`BLOQUEADO — C05`

### Mail 2

`BLOQUEADO — C06, C07, C08, C09`

### Mail 3

`BLOQUEADO — C06, C07, C08, C09`


