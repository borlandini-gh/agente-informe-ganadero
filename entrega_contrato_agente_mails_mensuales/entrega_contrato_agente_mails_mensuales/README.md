# Contrato de agente para generar mails mensuales

## Qué construí

Construí el contrato de un agente que recibe el Excel MASTER actualizado de cada mes, controla los datos necesarios y prepara tres correos:

1. Fondo A ganadero, en español.
2. Fondo B —Series I, II, III y IV— consolidado en español.
3. Fondo B —Series I, II, III y IV— consolidado en inglés.

Además de redactar, el agente alerta datos faltantes o inconsistentes. Un problema exclusivo del Fondo A bloquea solamente el mail 1; un problema en cualquiera de las Series I–IV bloquea los mails 2 y 3. Los mails nunca se envían automáticamente: quedan listos para revisión humana.

La versión pública usa alias para no revelar la empresa, los fondos, las series, los archivos ni las hojas reales. Los valores de las corridas provienen de casos reales; los Excel fuente no se incluyen por confidencialidad.

## Archivos de la entrega

| Archivo | Contenido |
|---|---|
| `system_prompt.md` | Contrato final aprobado, versión 3 |
| `user_prompt.md` | Pedido que acompaña cada nuevo MASTER |
| `salidas/salida_01_v1.md` | Primera corrida real con el contrato v1 |
| `salidas/salida_02_v2.md` | Segunda corrida real, luego de la primera mejora |
| `salidas/salida_03_v3.md` | Tercera corrida real, con el contrato final |
| `historial_prompts/system_prompt_v1.md` | Contrato anterior que permite reproducir la primera falla |
| `historial_prompts/system_prompt_v2.md` | Contrato anterior que permite reproducir la segunda falla |

## Cómo está dividido el contrato

Las seis piezas pedidas aparecen explícitamente separadas:

| Pieza | Ubicación | Decisión principal |
|---|---|---|
| Rol | System prompt, sección 1 | Analista de control y comunicación; redacta, controla y no envía |
| Contexto | System prompt, sección 2 | Un MASTER mensual, Fondo A, cuatro series del Fondo B y fechas de auditoría trimestrales |
| Tarea | System prompt, sección 3 | Leer, extraer, controlar, comparar estructura, redactar y bloquear selectivamente |
| Restricciones | System prompt, sección 4 | Fuente única, lectura semántica, no inventar, fechas, evolución del MASTER y bloqueo |
| Formato | System prompt, sección 5 | Cinco tablas/secciones fijas y checklist C01–C11 |
| Ejemplos | System prompt, sección 7 | Fecha auditada, provincias/granos y bloqueo parcial |
| Pedido puntual | User prompt | Procesar el MASTER adjunto y devolver solamente el formato obligatorio |

Las plantillas fijas de los tres mails están en la sección 6 del system prompt. Se ubicaron allí porque funcionan como una especificación reusable, no como parte del pedido mensual.

## Formato estructurado y comparable

Las tres corridas usan exactamente las mismas cinco secciones:

1. Identificación.
2. Checklist de controles C01–C11.
3. Alertas.
4. Estado de los mails.
5. Mails generados.

Las tablas conservan nombres y orden de columnas. Los estados posibles también son cerrados: `OK`, `ERROR`, `NO_VERIFICADO`, `LISTO_PARA_REVISIÓN` y `BLOQUEADO`. Esto permite comparar una corrida con otra sin interpretar prosa libre.

## Casos reales utilizados

| Corrida | Caso | Contrato | Resultado general |
|---|---|---|---|
| 1 | MASTER con cierre 28/02/2026 | v1 | Los tres mails quedaron bloqueados por falsos errores de totales |
| 2 | El mismo MASTER con cierre 28/02/2026 | v2 | Los tres mails se generaron; apareció una ambigüedad de presentación |
| 3 | Evolución más reciente del MASTER, cierre 31/07/2026 | v3 | Los tres mails se generaron y los cambios de estructura quedaron ubicados y documentados |

Usé el mismo archivo en las corridas 1 y 2 para aislar el efecto de la primera modificación. La corrida 3 usa una evolución real posterior del MASTER para probar el contrato frente a nuevas provincias y nuevos campos en las pestañas de establecimientos.

## Iteración 1 — dejar de confundir identidad con posición

### Antes: qué falló

La salida 1 informó textualmente:

- `Suma J:R = 8.826; S6 = 740` para el Fondo A.
- `Suma J:R = 5.662; S8 = 903` para la Serie I.
- Errores equivalentes para las Series II, III y IV.

Por eso C05–C09 quedaron en `ERROR` y los tres mails fueron bloqueados.

Los datos no estaban mal. La restricción v1 fijaba provincias en J:R y total de cabezas en S. En ese MASTER, las provincias terminaban en Q, R ya era el total con fórmula `SUM(J:Q)` y S era otra columna residual. El contrato sumó el total por segunda vez como si fuera Buenos Aires y comparó el resultado con una celda que no era el control.

### Pieza modificada

Modifiqué solamente **Restricciones**.

Reemplacé las posiciones fijas por reglas semánticas:

- detectar el bloque contiguo de provincias por encabezados;
- identificar el total por la fórmula que suma exactamente ese bloque;
- excluir las columnas posteriores al total;
- tratar filas y columnas como referencias, no como identidades;
- clasificar evoluciones compatibles e incompatibles;
- comparar con el último MASTER aprobado;
- registrar cada `CAMBIO_DE_ESTRUCTURA` con hoja, sección, celda/rango, impacto y acción;
- monitorear también campos nuevos en las hojas de establecimientos, aunque no alimenten todavía los mails.

No cambié el rol, el contexto, la tarea, el formato ni los ejemplos.

### Después: qué cambió

Con el mismo MASTER, la salida 2 identificó provincias en J:Q y total en R. Los cinco controles pasaron a `OK`:

- Fondo A: provincias = R6 = 4.413.
- Series I–IV: provincias = R8:R11 = 2.831, 6.577, 2.777 y 3.385.

Los tres mails pasaron de `BLOQUEADO` a `LISTO_PARA_REVISIÓN`.

## Iteración 2 — definir la precisión de datos operativos

### Antes: qué falló

La salida 2 respetó la precisión fuente de toneladas, pero produjo una presentación desigual:

- `2.375,4 toneladas`
- `7.292,4 toneladas`
- `2.548,655 toneladas`
- `1.796 toneladas`

El contrato fijaba decimales para CP y porcentajes, pero no decía cuántos decimales mostrar en cabezas ni toneladas. No era un error del Excel: era una decisión de presentación ausente en el contrato.

### Pieza modificada

Modifiqué solamente **Formato**.

Agregué esta regla: cabezas de hacienda y toneladas de granos se presentan como enteros redondeados al entero más cercano, sin redondear los valores antes de los controles, y el mismo entero debe aparecer en español e inglés.

No modifiqué el rol, el contexto, la tarea, las restricciones de lectura ni los ejemplos de decisión.

### Después: qué cambió

En la salida 3 todas las cantidades operativas tienen una presentación homogénea. Por ejemplo, las toneladas aparecen como `2.376`, `7.042`, `2.549` y `1.796` en español, y como `2,376`, `7,042`, `2,549` y `1,796` en inglés. C11 quedó en `OK`.

La tercera corrida también encontró evoluciones reales del MASTER —una nueva provincia, columnas desplazadas y nuevos campos en hojas de establecimientos— sin confundirlas con errores de datos. Cada cambio se informó con ubicación concreta y no bloqueó los mails porque los insumos obligatorios seguían siendo inequívocos.

## Qué funciona y qué queda bajo control humano

El contrato final:

- toma el período de `RESUMEN TOTAL!A18`, no del nombre del archivo;
- calcula la fecha auditada según disponibilidad, no solo según trimestre;
- admite la evolución compatible del MASTER;
- alerta cambios que pueden importar en tareas futuras;
- nunca afirma que no hubo cambios si falta la línea de base;
- bloquea solo los mails afectados;
- genera español e inglés con números equivalentes;
- deja toda salida pendiente de revisión humana.

Quedan fuera del alcance el control contable integral, la validación de cálculos ajenos a los campos utilizados y el envío automático de correos.

## Qué aprendí

La principal lección fue que una regla aparentemente precisa puede ser frágil. “Leer J:R” era concreta, pero confundía la ubicación actual con el significado del dato. En un archivo vivo conviene fijar las identidades que deben permanecer —etiquetas, relaciones y fórmulas— y explicar qué desplazamientos son aceptables.

También aprendí que el formato es parte del contrato. Si no se especifica la precisión, dos salidas pueden ser correctas respecto del Excel pero difíciles de comparar o inadecuadas para comunicación externa.

Por último, separar control, bloqueo y redacción hizo que el agente fuera más útil: una inconsistencia en una serie no debe contaminar el mail independiente del Fondo A, y un cambio compatible debe alertarse sin detener innecesariamente el proceso.

## Cómo reproducir una corrida

1. Usar `system_prompt.md` como system prompt.
2. Adjuntar el MASTER actual y, si está disponible, el último MASTER aprobado.
3. Enviar el contenido de `user_prompt.md`.
4. Comprobar que la respuesta tenga las cinco secciones y los once controles.
5. Revisar todas las alertas y los tres mails antes de aprobarlos.
6. Tras la aprobación, conservar el MASTER actual como línea de base del mes siguiente.

## Estado de entrega

La carpeta se preparó como ZIP porque este entorno no tiene configurado un remoto autenticado del repositorio de la materia. Está lista para cargarse sin incluir los Excel confidenciales. Una vez subida, el enlace a entregar es el de esta carpeta dentro del repositorio.

