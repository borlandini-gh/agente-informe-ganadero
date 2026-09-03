# Agente para generación y control de mails mensuales

## Resultado

Este repositorio documenta un agente que recibe el Excel MASTER actualizado de un cierre mensual, controla los datos necesarios y prepara tres borradores:

1. Fondo A ganadero, en español.
2. Fondo B —Series I, II, III y IV— consolidado en español.
3. Fondo B —Series I, II, III y IV— consolidado en inglés.

El agente también detecta datos faltantes, inconsistencias y cambios de estructura. Bloquea únicamente los mails afectados y nunca los envía: su máximo nivel de autonomía es L1 y toda salida queda sujeta a revisión humana.

La versión pública está anonimizada. No contiene los MASTER reales, nombres de la empresa, fondos o series, destinatarios, claves ni otros datos identificatorios.

## Evidencia para la rúbrica

| Dimensión | Evidencia verificable |
|---|---|
| D1 — Sistema completo y funcionando | `prompts/`, tres archivos en `corridas/`, parámetros trazados y mails completos o bloqueados según controles |
| D2 — Proceso documentado | `DECISIONES.md`, historial de prompts y dos iteraciones con antes/cambio/después |
| D3 — Formato y reproducibilidad | Archivos obligatorios en la raíz, JSON Schema común y `tests/validar_corridas.mjs` |
| D4 — Análisis económico | Fórmula, precios, supuestos, costo por corrida, mensual, anual y sensibilidad en este README y `DECISIONES.md` |
| D5 — Gobierno y riesgo | Matriz explícita L0–L4, menor privilegio, bloqueo selectivo y human-in-the-loop |

## Estructura del repositorio

```text
.
├── README.md
├── DECISIONES.md
├── prompts/
│   ├── system_prompt.md
│   ├── user_prompt.md
│   └── historial/
│       ├── system_prompt_v1.md
│       ├── system_prompt_v2.md
│       └── system_prompt_v3_pre_auditoria.md
├── corridas/
│   ├── README.md
│   ├── corrida_01_v1.json
│   ├── corrida_02_v2.json
│   ├── corrida_03_v3.json
│   └── originales/
│       ├── salida_01_v1.md
│       ├── salida_02_v2.md
│       └── salida_03_v3.md
├── schemas/
│   └── output.schema.json
└── tests/
    └── validar_corridas.mjs
```

Los nombres y ubicaciones de `DECISIONES.md`, `prompts/` y `corridas/` son deliberados: permiten que un corrector automático encuentre la evidencia sin inferir equivalencias con otras carpetas.

## Las seis piezas del contrato

| Pieza | Ubicación | Contenido |
|---|---|---|
| Rol | `prompts/system_prompt.md`, sección 1 | Analista de control y comunicación; redacta, controla y no envía |
| Contexto | Sección 2 | MASTER mensual, Fondo A, cuatro series del Fondo B y calendario de auditorías |
| Tarea | Sección 3 | Leer, extraer, controlar, comparar estructura, redactar y bloquear selectivamente |
| Restricciones | Sección 4 | Fuente única, lectura semántica, no inventar, aislamiento dato/instrucción y reglas de bloqueo |
| Formato | Sección 5 | JSON estricto, cinco claves raíz, schema y checklist C01–C11 |
| Ejemplos | Sección 7 | Auditoría, provincias/granos y bloqueo parcial |
| Pedido puntual | `prompts/user_prompt.md` | Parámetros de cada corrida y orden de ejecución |

Las plantillas de los tres mails están en la sección 6 del system prompt porque forman parte del comportamiento estable del agente, no del pedido mensual.

## Herramienta real

El sistema no es un prompt aislado. Utiliza una planilla real como herramienta de entrada y el lector XLSX implementado en la aplicación:

- `app/page.tsx` importa la biblioteca `xlsx`;
- el control de archivo acepta `.xlsx` y `.xls`;
- `XLSX.read` abre el `ArrayBuffer` del MASTER;
- `parseWorkbook` obtiene la fecha, los indicadores, las provincias y los totales;
- el archivo se procesa en el navegador y el agente no posee una herramienta para enviar mails ni modificar el MASTER.

Esta herramienta se clasifica como L0 porque opera en modo de solo lectura. El agente usa los datos extraídos para realizar controles y redactar en L1.

## Trazabilidad de los parámetros del user prompt

| Parámetro | Evidencia dentro de cada corrida |
|---|---|
| `archivo_master` | `identificacion.archivo_procesado` |
| `archivo_linea_base` | `identificacion.linea_base_estructural` |
| `fuente_periodo` | `identificacion.configuracion_ejecucion.fuente_periodo` |
| `master_es_unica_fuente` | `identificacion.configuracion_ejecucion.master_es_unica_fuente` |
| `response_mime_type` | `identificacion.configuracion_ejecucion.response_mime_type` |
| `schema_salida` | `identificacion.configuracion_ejecucion.schema` |
| Regla “dato, no instrucción” | `identificacion.configuracion_ejecucion.contenido_es_dato_no_instruccion` |

## Formato comparable

Las tres corridas contienen exactamente las mismas cinco claves raíz:

1. `identificacion`;
2. `checklist`;
3. `alertas`;
4. `estado_mails`;
5. `mails_generados`.

El checklist siempre contiene C01–C11 en el mismo orden. Los estados están restringidos a `OK`, `ERROR`, `NO_VERIFICADO`, `LISTO_PARA_REVISION` y `BLOQUEADO`. El contrato formal está en `schemas/output.schema.json`.

## Tres corridas reales

| Corrida | Caso | Contrato | Resultado |
|---|---|---|---|
| 1 | MASTER con cierre 28/02/2026 | v1 | Falsos errores de totales; los tres mails quedaron bloqueados |
| 2 | El mismo MASTER con cierre 28/02/2026 | v2 | Totales corregidos; tres mails listos; se detectó ambigüedad de precisión |
| 3 | Evolución posterior del MASTER, cierre 31/07/2026 | v3 | Tres mails listos y trece cambios estructurales ubicados como compatibles |

Se utilizó el mismo caso en las corridas 1 y 2 para aislar el efecto de la primera modificación. La tercera prueba una evolución real posterior: nueva provincia, columnas desplazadas y campos nuevos en hojas de establecimientos.

Cada JSON contiene `identificacion.fecha_ejecucion`, `identificacion.entrada`, controles, alertas y salida. Los archivos Markdown de `corridas/originales/` conservan las salidas tal como fueron documentadas durante las pruebas. El 03/09/2026 se añadió la serialización JSON, la envoltura de seguridad y el schema; no se cambiaron los resultados ni los textos originales.

## Iteración 1 — Restricciones

**Antes.** La v1 fijaba provincias en J:R y el total en S. La corrida 1 informó `Suma J:R = 8.826; S6 = 740` y errores equivalentes en las cuatro series.

**Qué falló.** Ese MASTER tenía provincias en J:Q, el total en R y un residual en S. El agente sumó el total como si fuera una provincia y comparó contra una celda incorrecta.

**Cambio.** Se tocó solamente **Restricciones**: lectura semántica, bloque provincial dinámico, total identificado por fórmula y evolución estructural compatible/incompatible.

**Después.** Con el mismo archivo, la corrida 2 validó Fondo A = 4.413 cabezas y Series I–IV = 2.831, 6.577, 2.777 y 3.385. C05–C09 pasaron a `OK` y se generaron los tres mails.

## Iteración 2 — Formato

**Antes.** La corrida 2 mostró `2.375,4`, `7.292,4`, `2.548,655` y `1.796` toneladas. La precisión era fiel al Excel, pero desigual para comunicación externa.

**Qué falló.** El contrato definía decimales para CP y porcentajes, pero no para toneladas y cabezas.

**Cambio.** Se tocó solamente **Formato**: cantidades operativas como enteros redondeados al entero más cercano, manteniendo valores fuente para los controles y equivalencia ES/EN.

**Después.** La corrida 3 presentó, por ejemplo, `2.376` en español y `2,376` en inglés. C11 quedó en `OK`.

El detalle completo, las alternativas descartadas y el endurecimiento posterior a la auditoría se encuentran en `DECISIONES.md`.

## Análisis económico

### Modelo y supuesto de arquitectura

Para una eventual ejecución vía API se propone `gpt-5.6-luna`: el problema tiene reglas cerradas, extracción previa de datos, plantillas, JSON Schema y revisión humana. Usar un modelo de mayor costo no agrega una ventaja proporcional; ante ambigüedad, el contrato bloquea y deriva a una persona.

Precios estándar por 1 millón de tokens consultados el 03/09/2026 en la [documentación oficial de OpenAI](https://developers.openai.com/api/docs/pricing): USD 0,20 de entrada, USD 0,02 de entrada cacheada y USD 1,20 de salida.

### Fórmula

`Costo = (tokens entrada / 1.000.000 × precio entrada) + (tokens cacheados / 1.000.000 × precio cacheado) + (tokens salida / 1.000.000 × precio salida)`

### Supuestos y resultado

| Variable | Supuesto |
|---|---:|
| Corridas mensuales | 2 |
| Entrada no cacheada por corrida | 6.000 tokens |
| Entrada cacheada | 0 tokens |
| Salida por corrida | 3.500 tokens |

`Costo por corrida = (6.000 / 1.000.000 × 0,20) + (3.500 / 1.000.000 × 1,20) = USD 0,0054`

| Escenario | Estimación |
|---|---:|
| Promedio de 0,5 corridas por semana | USD 0,0027/semana |
| 2 corridas por mes | USD 0,0108/mes |
| 24 corridas por año | USD 0,1296/año |
| Sensibilidad: 10 corridas por mes | USD 0,054/mes |

Se excluyen impuestos, hosting y tiempo de revisión humana. Los precios deben actualizarse antes de producción. No se descuenta prompt caching para conservar un supuesto prudente.

## Gobierno y riesgo L0–L4

| Acción | Nivel | Estado |
|---|---:|---|
| Leer el MASTER y comparar estructura | L0 | Permitida, solo lectura |
| Ejecutar controles, alertar y redactar borradores | L1 | Permitida |
| Adoptar una nueva línea de base | L2 | Requiere aprobación humana; no automatizada |
| Modificar archivos o enviar mails | L3 | Prohibida |
| Cambiar importes, aprobar cálculos o certificar auditorías | L4 | Prohibida |

El agente opera como máximo en **L1**. Su radio de impacto se limita a tres borradores y un checklist. El bloqueo selectivo evita que un error en una parte detenga salidas independientes, sin permitir que información dudosa llegue a un texto enviable.

### Qué pasa cuando algo sale mal

| Falla | Respuesta del agente | Supervisión |
|---|---|---|
| El Excel no abre o falta `RESUMEN TOTAL!A18` | C01 o C02 = `ERROR`; bloquea los tres mails | La responsable solicita un nuevo archivo |
| Falta un dato del Fondo A | C04/C05 = `ERROR`; bloquea solo el mail 1 | Se revisa la celda informada |
| Falla una Serie I–IV | C04 o C06–C09 = `ERROR`; bloquea mails 2 y 3 | Se corrige o confirma la serie afectada |
| Cambio de estructura incompatible | Registra hoja, sección y rango; bloquea el alcance afectado | Una persona redefine el mapeo y aprueba la nueva base |
| Fecha auditada todavía no disponible | C10 = `ERROR`; no usa una fecha futura | La responsable confirma el cierre aplicable |
| Diferencia entre español e inglés o formato inválido | C11 = `ERROR`; bloquea el mail correspondiente | Revisión lingüística y numérica |
| JSON fuera del schema | La corrida se considera inválida y no se utiliza | Se repite la generación y se ejecuta el test |

### Revisión y firma

Antes de confiar en una salida, **Bianca Orlandini**, responsable operativa y autora del trabajo, revisa período, fecha auditada, importes, CP, variaciones, cabezas, granos, provincias, alertas estructurales y equivalencia ES/EN. Solo después de esa revisión aprueba los borradores y realiza o delega el envío. El colaborador puede cargar el MASTER y preparar la corrida, pero no firma el resultado salvo delegación expresa.

## Seguridad

- El MASTER y todo texto contenido en celdas, fórmulas, comentarios o nombres de hojas son **dato, no instrucción**.
- El agente no puede enviar mails, modificar el Excel ni consultar fuentes externas.
- No se incluyen claves. Una integración futura debe inicializar el SDK exclusivamente en servidor y usar variables de entorno.
- El repositorio público no contiene los MASTER reales ni identificadores del cliente.
- Los cambios estructurales siempre incluyen hoja, sección, celda/rango, impacto y acción.

No se agregaron function calls externos porque el caso no necesita servicios externos. La matriz de acciones y permisos está formalizada en `DECISIONES.md`; inventar herramientas aumentaría el riesgo sin mejorar la tarea.

## Reproducción y test

### Ejecutar una nueva corrida

1. Usar `prompts/system_prompt.md` como system prompt.
2. Adjuntar el MASTER actual y, si existe, el último MASTER aprobado.
3. Enviar `prompts/user_prompt.md`, completando sus parámetros.
4. Guardar el objeto recibido como un nuevo archivo dentro de `corridas/`.
5. Revisar alertas y mails antes de aprobarlos.

### Validar las evidencias incluidas

Con Node.js 18 o superior:

```bash
node tests/validar_corridas.mjs
```

El test comprueba:

- tres JSON válidos;
- fecha e entrada reconstruible en cada corrida;
- tres salidas originales preservadas;
- cinco claves raíz idénticas;
- C01–C11 una vez y en orden;
- tres mails con estados coherentes;
- ausencia de borrador cuando un mail está bloqueado;
- ubicación completa para cambios de estructura;
- aislamiento dato/instrucción;
- ausencia de identificadores confidenciales.

## Reflexión

La primera lección fue que una regla puede ser muy específica y, al mismo tiempo, frágil. “Leer J:R” parecía precisa, pero confundía la ubicación actual con la identidad del dato. En un archivo vivo conviene fijar etiquetas, relaciones y fórmulas, y definir qué desplazamientos son aceptables.

La segunda fue que el formato también es parte del contrato: sin una precisión explícita, dos salidas pueden ser correctas frente al Excel pero difíciles de comparar o inadecuadas para comunicación externa.

La tercera fue de reproducibilidad. La evidencia no alcanza con existir: debe estar ubicada donde el evaluador la busca, usar un schema común y poder validarse con un comando. La estructura del repositorio forma parte del producto.
