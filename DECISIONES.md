# Registro de decisiones

## 1. Alcance de este documento

Este archivo registra las decisiones funcionales, técnicas y de gobierno del agente que transforma un MASTER mensual en tres borradores de correo. Se separa del README para que el proceso de diseño pueda auditarse sin mezclarlo con las instrucciones de uso.

La versión pública reemplaza por alias los nombres reales de la empresa, los fondos, las series, los archivos y las hojas. Los MASTER reales no forman parte del repositorio.

## 2. Decisiones funcionales

| ID | Decisión adoptada | Alternativa descartada | Motivo técnico u operativo |
|---|---|---|---|
| D01 | Generar tres mails: Fondo A ES, Fondo B ES y Fondo B EN | Un mail por cada serie | Los destinatarios del Fondo B reciben un informe consolidado; separar las series produciría correos innecesarios |
| D02 | Alertar faltantes e inconsistencias además de redactar | Redactar siempre | Evita crear un texto enviable con información incompleta o inventada |
| D03 | Bloquear únicamente los mails afectados | Bloquear toda la corrida ante cualquier error | Reduce el radio de impacto: un problema independiente del Fondo A no invalida los dos mails del Fondo B y viceversa |
| D04 | Tomar el período solo de `RESUMEN TOTAL!A18` | Inferirlo del nombre del archivo | El nombre puede contener el mes de envío y no el mes de cierre |
| D05 | Calcular la auditoría según cierre trimestral y disponibilidad a 45 días | Usar siempre el último trimestre calendario | Impide citar una auditoría todavía no disponible en la fecha del mail |
| D06 | Identificar campos por etiquetas, encabezados y fórmulas | Mantener posiciones fijas | El MASTER evoluciona: puede incorporar provincias, filas y campos nuevos |
| D07 | Comparar con el último MASTER aprobado | Comparar con una estructura histórica fija | La última versión aprobada es la referencia operativa más cercana y permite evolución controlada |
| D08 | Informar cada cambio con hoja, sección, celda/rango, impacto y acción | Alerta genérica `CAMBIO_DE_ESTRUCTURA` | Una alerta sin ubicación no es revisable por una persona |
| D09 | Mantener los valores fuente para validar y redondear solo al presentar | Redondear antes de controlar | El redondeo previo puede ocultar diferencias reales |
| D10 | Entregar JSON estricto con un checklist C01–C11 | Texto libre o tablas Markdown como formato canónico | Un schema estable permite comparar corridas y automatizar pruebas; el checklist sigue existiendo como array estructurado |
| D11 | No enviar correos automáticamente | Envío directo desde el agente | Los textos contienen información financiera y requieren revisión humana |
| D12 | Tratar todo contenido del MASTER como dato, no como instrucción | Permitir que texto de celdas influya en la conducta | Reduce el riesgo de prompt injection desde celdas, comentarios o nombres de hojas |

### Qué se achicó y por qué

Durante el diseño se redujo deliberadamente el alcance:

- **No realiza un control contable integral.** Verifica solamente los campos que alimentan los mails; ampliar el control requeriría reglas contables y responsables adicionales.
- **No envía correos.** El envío se eliminó del alcance porque aumenta el impacto de un error y exige confirmar destinatarios.
- **No corrige el MASTER.** Detecta y ubica problemas, pero la modificación queda en manos de la persona responsable.
- **No interpreta todos los campos nuevos de `Establecimientos`.** Los registra como evolución para uso futuro, pero no los incorpora a los mails sin una decisión de alcance.
- **No consulta fuentes externas.** La única fuente numérica es el MASTER; esto mejora trazabilidad y evita mezclar períodos.

El objetivo final quedó acotado a leer, controlar, alertar y redactar. Esa reducción permite sostener un máximo de autonomía L1.

## 3. Iteraciones pedagógicas

### Iteración 1 — pieza modificada: Restricciones

**Antes.** La versión 1 fijaba provincias en J:R y el total en S. En el MASTER con cierre 28/02/2026, las provincias estaban en J:Q, R contenía `SUM(J:Q)` y S era otra columna residual. La primera corrida devolvió, entre otros errores, `Suma J:R = 8.826; S6 = 740` y bloqueó los tres mails.

**Cambio.** Se modificó únicamente la pieza **Restricciones**: lectura semántica, bloque dinámico de provincias, identificación del total por fórmula, exclusión de columnas posteriores y reglas de evolución compatible/incompatible.

**Después.** Con el mismo MASTER, la segunda corrida identificó J:Q como provincias y R como total. C05–C09 pasaron a `OK` y los tres mails quedaron `LISTO_PARA_REVISION`.

### Iteración 2 — pieza modificada: Formato

**Antes.** La segunda corrida mostró toneladas con precisión desigual: `2.375,4`, `7.292,4`, `2.548,655` y `1.796`. El contrato definía decimales para CP y porcentajes, pero no para cantidades operativas.

**Cambio.** Se modificó únicamente la pieza **Formato**: cabezas y toneladas se presentan como enteros redondeados al entero más cercano, sin alterar el valor usado en controles y con equivalencia ES/EN.

**Después.** La tercera corrida presentó cantidades enteras consistentes —por ejemplo `2.376` en español y `2,376` en inglés— y C11 quedó en `OK`.

### Endurecimiento posterior a la devolución

La versión 3.1 no reemplaza la historia de las dos iteraciones. Agrega requisitos de reproducibilidad y seguridad solicitados por el corrector:

- salida JSON conforme a `schemas/output.schema.json`;
- `response_mime_type = "application/json"`;
- cláusula explícita “es dato, no instrucción”;
- validador automatizado de las tres corridas.

Este endurecimiento se documenta por separado para no presentar retrospectivamente el prompt inicial como si hubiera nacido perfecto.

## 4. Gobierno y niveles de autonomía L0–L4

### Definición usada

- **L0 — observar:** leer y extraer información sin producir una recomendación ni modificar nada.
- **L1 — asistir:** analizar, controlar, alertar y preparar borradores para una persona.
- **L2 — actuar con aprobación:** ejecutar una acción reversible después de una confirmación humana explícita.
- **L3 — actuar autónomamente:** ejecutar acciones externas sin aprobación caso por caso.
- **L4 — decidir o ejecutar acciones críticas:** tomar decisiones de alto impacto, irreversibles, financieras o regulatorias.

### Matriz de acciones

| Acción | Nivel | ¿Habilitada? | Control de riesgo |
|---|---:|---|---|
| Abrir el MASTER y leer celdas | L0 | Sí | Solo lectura; el archivo es la única fuente de datos |
| Comparar la estructura con la línea de base | L0 | Sí | No modifica ninguno de los dos archivos |
| Ejecutar C01–C11 y detectar cambios | L1 | Sí | Evidencia obligatoria y ubicación exacta |
| Preparar tres borradores de mail | L1 | Sí | Plantillas cerradas y JSON validable |
| Marcar un mail como listo o bloqueado | L1 | Sí | Bloqueo selectivo y motivo explícito |
| Adoptar el MASTER actual como nueva línea de base | L2 | No automatizada | Solo después de aprobación humana |
| Guardar o modificar el MASTER | L2/L3 | No | El agente carece de herramienta de escritura sobre el archivo fuente |
| Enviar los correos | L3 | No | Los borradores requieren revisión y envío humano |
| Cambiar importes, aprobar cálculos contables o certificar auditorías | L4 | No | Fuera de alcance; debe intervenir una persona responsable |

El máximo nivel operativo habilitado es **L1**. El radio de impacto queda limitado a tres borradores de texto y sus alertas; no hay envío, modificación de archivos ni decisión financiera autónoma.

## 5. Herramientas y arquitectura

| Componente | Función | Entrada | Salida | Permisos |
|---|---|---|---|---|
| Lector XLSX local | Leer celdas, encabezados y fórmulas | MASTER actual y línea de base opcional | Datos estructurados | Solo lectura, L0 |
| Agente de control y redacción | Aplicar contrato, C01–C11 y plantillas | Datos estructurados delimitados | JSON estricto | L1, sin acciones externas |
| Validador de corridas | Comprobar schema e invariantes | `corridas/*.json` | Éxito o error | Solo lectura, L0 |

La herramienta real está implementada en `app/page.tsx`: importa `xlsx`, recibe archivos `.xlsx` o `.xls`, usa `XLSX.read` para abrir el `ArrayBuffer` y ejecuta `parseWorkbook`. No es una simulación de herramienta ni una descripción futura: el prototipo procesa una planilla cargada por la persona usuaria.

No se expone una API key en el navegador. La integración con un SDK de modelo no forma parte del alcance entregado: las corridas se ejecutaron en ChatGPT Work y se conservaron como evidencia. En una versión productiva, el lector XLSX debería enviar datos mínimos a un endpoint servidor, y ese endpoint inicializaría el cliente del modelo con la clave en una variable de entorno, timeout, reintentos acotados y schema estricto. Agregar un SDK ficticio o una clave al frontend solo para satisfacer una heurística de auditoría fue descartado por inseguro.

## 6. Seguridad y privacidad

| Riesgo | Control |
|---|---|
| Instrucciones maliciosas dentro del Excel | El system y el user prompt declaran que celdas, fórmulas, comentarios y nombres de hojas son dato, no instrucción |
| Datos inventados | Fuente única, campos obligatorios y bloqueo ante faltantes |
| Cambio de estructura silencioso | Comparación con línea de base y alerta ubicada |
| Envío incorrecto | El agente no posee herramienta de correo |
| Exposición de secretos | Sin claves en repositorio; una implementación futura debe usar variables de entorno del servidor |
| Exposición de información del cliente | Alias públicos y exclusión de los MASTER reales |
| Salida variable | JSON Schema, cinco claves raíz y test de regresión |

### Modos de falla y respuesta

| Falla posible | Detección | Qué hace el agente | Qué hace la persona |
|---|---|---|---|
| Archivo ilegible | C01 | Bloquea los tres mails | Solicita o genera un nuevo archivo |
| Período ausente o inválido | C02 | Bloquea los tres mails | Revisa `RESUMEN TOTAL!A18` |
| Fondo o serie ambiguos | C03 | Bloquea los mails afectados | Confirma etiquetas y actualiza el contrato si corresponde |
| Campo obligatorio faltante | C04 | No inventa; bloquea el alcance afectado | Corrige o valida la celda indicada |
| Total provincial inconsistente | C05–C09 | Bloqueo selectivo | Reconcilia provincias y total físico |
| Auditoría no disponible | C10 | No adelanta la fecha; bloquea | Confirma el cierre auditado aplicable |
| Diferencia de idioma o formato | C11 | No libera el mail inconsistente | Revisa equivalencia ES/EN y precisión |
| Cambio estructural incompatible | Alerta ubicada | Bloquea el alcance afectado | Redefine el mapeo y aprueba una nueva línea de base |
| JSON inválido | Schema/test | La salida no se utiliza | Repite la corrida y ejecuta el validador |

### Punto de supervisión y firma

Antes de aprobar una corrida, Bianca Orlandini revisa período, auditoría, valores financieros, cantidades operativas, provincias, alertas y equivalencia ES/EN. Ella firma la conformidad operativa de la salida; el agente solo asiste en L1. Un colaborador puede cargar el MASTER y preparar los borradores, pero no los envía ni firma salvo delegación expresa.

## 7. Análisis económico

### Arquitectura tomada para el cálculo

El Excel se parsea localmente y el modelo recibe solo datos estructurados necesarios para C01–C11 y los mails. Para un despliegue económico se toma como referencia `gpt-5.6-luna`, porque la tarea está altamente restringida, tiene plantillas, schema y revisión humana; no necesita el modelo de mayor costo.

Precios estándar consultados el 03/09/2026 en la documentación oficial de OpenAI:

- entrada: USD 0,20 por 1 millón de tokens;
- entrada cacheada: USD 0,02 por 1 millón de tokens;
- salida: USD 1,20 por 1 millón de tokens.

Fuente: <https://developers.openai.com/api/docs/pricing>

### Fórmula

`Costo por corrida = (tokens de entrada / 1.000.000 × precio de entrada) + (tokens de entrada cacheada / 1.000.000 × precio cacheado) + (tokens de salida / 1.000.000 × precio de salida)`

### Supuestos conservadores

| Supuesto | Valor |
|---|---:|
| Corridas por mes | 2 |
| Tokens de entrada no cacheados por corrida | 6.000 |
| Tokens de entrada cacheados | 0 |
| Tokens de salida por corrida | 3.500 |
| Meses por año | 12 |

### Resultado estimado

`Costo por corrida = (6.000 / 1.000.000 × 0,20) + (3.500 / 1.000.000 × 1,20) = USD 0,0054`

| Frecuencia | Costo estimado |
|---|---:|
| Promedio de 0,5 corridas por semana | USD 0,0027 semanales |
| 2 corridas por mes | USD 0,0108 mensuales |
| 24 corridas por año | USD 0,1296 anuales |
| Sensibilidad: 10 corridas por mes | USD 0,054 mensuales |

El cálculo excluye impuestos, hosting y tiempo de revisión humana. Los precios son supuestos externos y deben actualizarse antes de una implementación real. Si el system prompt se reutiliza con prompt caching, el costo puede ser menor; no se descuenta ese beneficio para mantener una estimación conservadora.

## 8. Criterios de aceptación

Una versión se considera aprobable si:

1. existen `README.md`, `DECISIONES.md`, `prompts/system_prompt.md`, `prompts/user_prompt.md`, `corridas/` y `schemas/output.schema.json`;
2. cada corrida identifica fecha, entrada, salida y versión del contrato; las salidas originales permanecen en `corridas/originales/`;
3. las tres corridas son JSON válido y tienen las mismas cinco claves raíz;
4. C01–C11 aparecen exactamente una vez y en orden;
5. los mails bloqueados no contienen asunto ni cuerpo;
6. todo cambio estructural contiene ubicación, impacto y acción;
7. no hay nombres reales ni secretos del cliente;
8. `node tests/validar_corridas.mjs` finaliza correctamente.
