# Manifiesto de corridas

Este directorio conserva tres ejecuciones reales. Cada JSON reúne explícitamente la fecha, una entrada resumida suficiente para reconstruir la salida, los controles, las alertas y los mails.

| Corrida | Fecha de ejecución | Entrada | Línea de base | Salida original | Salida estructurada |
|---|---|---|---|---|---|
| 1 | 27/08/2026 | `MASTER_MARZO_2026.xlsx`, cierre 28/02/2026 | No disponible | `originales/salida_01_v1.md` | `corrida_01_v1.json` |
| 2 | 27/08/2026 | El mismo MASTER, cierre 28/02/2026 | No disponible; pasa a ser base tras aprobación | `originales/salida_02_v2.md` | `corrida_02_v2.json` |
| 3 | 27/08/2026 | `MASTER_AGOSTO_2026.xlsx`, cierre 31/07/2026 | `MASTER_MARZO_2026.xlsx` | `originales/salida_03_v3.md` | `corrida_03_v3.json` |

## Relación entre los dos formatos

- Los archivos de `originales/` se preservan tal como fueron documentados durante el proceso, sin reescribir su contenido.
- Los JSON agregan una capa de serialización común para que un corrector automático pueda comparar las tres ejecuciones y validar el schema.
- La serialización no modifica estados, evidencias, alertas ni textos de los mails.
- Los nombres reales fueron reemplazados por alias antes de incorporar la evidencia al repositorio público.

## Reconstrucción

Para reconstruir cada corrida, un tercero puede:

1. leer `identificacion.fecha_ejecucion` y `identificacion.entrada`;
2. consultar la versión del contrato indicada en `identificacion.version_contrato` dentro de `prompts/historial/`;
3. seguir C01–C11 en el orden del array `checklist`;
4. verificar la regla de bloqueo contra `estado_mails`;
5. comparar `mails_generados` con el archivo correspondiente de `originales/`.

Los MASTER no se publican porque contienen información confidencial. La entrada resumida conserva exclusivamente los campos necesarios para reconstruir la decisión y la redacción del agente.

