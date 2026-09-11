# Registro de decisiones

## 1. Alcance final

El proyecto anterior preparaba tres mails. Para el trabajo final se eligió un problema más completo y acotado: preparar y controlar el informe mensual Ganadero desde el MASTER hasta Canva, más el borrador de su mail.

La reducción a un solo informe permitió ejecutar el flujo con archivos reales, identificar fallas de integración y conservar evidencia. No se presentan como terminadas las variantes de otros productos.

## 2. Decisiones funcionales y técnicas

| ID | Decisión | Alternativa descartada | Motivo |
|---|---|---|---|
| D01 | Automatizar solamente Ganadero | incluir todos los informes | un flujo completo y probado aporta más evidencia que tres flujos parciales |
| D02 | MASTER como única fuente numérica | corregir desde el PDF anterior | evita copiar un error histórico o mezclar períodos |
| D03 | Detectar el período dentro del libro | inferirlo del nombre del archivo | el nombre puede indicar el mes de publicación y no el cierre |
| D04 | Identificar el fondo por encabezados y datos | fijar una sigla o un número de fila | mantiene el repositorio anonimizado y tolera desplazamientos |
| D05 | Encontrar las provincias desde la fórmula de total | fijar letras de columna | el MASTER incorpora columnas y provincias con el tiempo |
| D06 | Separar cabezas físicas y compras a término | comparar provincias contra el total general | son conceptos distintos; la conciliación correcta es físicas + término = total |
| D07 | Generar CSV UTF-8 de una fila | subir directamente `.xlsx` | Canva Crear en lote rechazó el XLSX en la primera prueba |
| D08 | Usar cuadros de texto para datos variables | vincular celdas dentro de tablas | los vínculos en tablas no funcionaron de manera estable |
| D09 | Mantener fijas las filas históricas verdes | actualizar toda la tabla | los cierres anuales no cambian; solo se completan meses del año corriente |
| D10 | Alias invisibles para meses futuros | colocar ceros o texto visible | Canva debe descubrir el tag sin mostrar información inexistente |
| D11 | Fotografía manual | seleccionar o posicionar una imagen automáticamente | la foto cambia cada mes y su elección es una decisión editorial de Cati |
| D12 | Mail con plantilla cerrada | texto libre | reduce variaciones y facilita la corrección de Cachu |
| D13 | Sin envío automático | integrar correo | el informe contiene información financiera y requiere aprobación humana |
| D14 | Dependencias JavaScript exactas | crear `requirements.txt` artificial | el proyecto usa Node; el equivalente correcto es `package.json` exacto y lockfile |
| D15 | Revisión generativa opcional y posterior a los controles | permitir que el modelo extraiga o decida cifras | las cifras requieren determinismo; el modelo solo revisa el borrador y Cachu mantiene la firma |
| D16 | Controles binarios con evidencia | inventar un puntaje de confianza numérico | las conciliaciones son verificables; una probabilidad subjetiva ocultaría un faltante en vez de bloquearlo |
| D17 | Acotar la lectura a 5.000 filas y 256 columnas por hoja | confiar ciegamente en el rango declarado por Excel | el MASTER siguiente tenía formato residual hasta la fila 1.048.573; el límite evita consumo excesivo sin afectar el rango operativo |

## 3. Iteraciones reales

### Iteración 1 — formato de intercambio

**Entrada.** MASTER real de cierre 31/07/2026.

**Salida.** Se preparó un `.xlsx` para cargar en Canva.

**Falla observada.** Canva mostró: `Error al subir el archivo. Asegurate de estar subiendo un archivo CSV y probá de nuevo.`

**Pieza modificada.** Formato.

**Cambio.** El agente pasó a generar CSV UTF-8 de una única fila.

**Métrica.** 0 campos detectados en v1.

### Iteración 2 — compatibilidad del template

**Entrada.** El mismo MASTER y el CSV corregido.

**Salida.** Canva reconoció campos, pero el template original usaba tablas.

**Falla observada.** `Coincidieron 9 de 85`; algunos números desaparecían al vincularlos.

**Pieza modificada.** Restricciones del template.

**Cambio.** Los datos variables se reconstruyeron como cuadros de texto independientes. Las filas históricas verdes quedaron fijas.

**Métrica.** 9 coincidencias automáticas sobre 85 campos disponibles.

### Iteración 3 — meses futuros y auditoría

**Entrada.** El mismo MASTER, CSV plano y template compatible.

**Fallas observadas.** Canva no mostraba tags con valor completamente vacío; la primera fecha de auditoría arrastraba el trimestre anterior.

**Pieza modificada.** Formato.

**Cambio.** Se añadieron alias con espacio de ancho cero para agosto–diciembre y se separó `nota_auditoria_resumen` de la nota extensa de rentabilidad.

**Resultado.** Se generó una copia de ocho páginas. La última versión pasó 126 de 126 comparaciones contra el CSV aprobado y C01–C11 quedaron en `OK`.

**Métricas.** 126 campos, 0 diferencias, 8 páginas revisadas.

### Validación fuera de muestra — mes siguiente

**Entrada.** Nuevo MASTER real, recibido después de cerrar las iteraciones, con cierre interno 31/08/2026 y publicación en septiembre.

**Resultado.** Sin modificar posiciones ni valores a mano, el agente obtuvo C01–C11 en `OK`, 126 campos Canva y los dos artefactos en `LISTO_PARA_REVISION`. Tomó el período desde el libro, mantuvo vacíos los meses futuros y trasladó revisiones retroactivas del año en curso.

**Falla estructural descubierta.** Una hoja declaraba contenido hasta la fila 1.048.573 por formato residual, aunque los datos útiles terminaban mucho antes.

**Cambio.** Se acotó la lectura por hoja y se agregó `tests/sheet-read-limits.test.mjs`. La evidencia pública anonimizada está en `validaciones/validacion_2026_08.json`.

## 4. Trazabilidad

| Elemento | Identificador |
|---|---|
| Entrada real usada en las tres corridas | SHA-256 `4b3e8c738a1ef8941b8155f392dbdd2282d6354193ce99112d340712d3c968ff` |
| Corrida 1 | `GAN-2026-07-01` |
| Corrida 2 | `GAN-2026-07-02` |
| Corrida 3 | `GAN-2026-07-03` |
| PDF final revisado | 8 páginas; hash conservado fuera del repositorio público |

Los hashes de Git de esta nueva versión se obtienen recién después de subir los archivos. No se inventa un SHA futuro. Cada corrida ya queda vinculada a su versión del contrato, su salida original y la misma entrada mediante el hash anterior.

## 5. Arquitectura

| Componente | Entrada | Salida | Permiso |
|---|---|---|---|
| `xlsx` | MASTER `.xlsx` o `.xls` | datos, fórmulas y fechas | solo lectura, L0 |
| `ganadero-agent.mjs` | libro abierto | C01–C11, campos y mail | análisis y borradores, L1 |
| `generar-ganadero.mjs` | ruta al MASTER | JSON, CSV y TXT | escritura solo en carpeta de salida |
| `model-reviewer.mjs`, opcional | datos ya controlados y borrador | revisión JSON cerrada | una iteración, L1 |
| Canva Crear en lote | CSV aprobado | copia del template | acción de Cati con revisión |
| `validar_corridas.mjs` | evidencia pública | éxito o error | solo lectura, L0 |
| `sheet-read-limits.test.mjs` | rangos de hoja extremos | éxito o error | solo lectura, L0 |

La extracción es determinística. El modelo no decide cifras ni celdas. Los prompts formalizan el contrato y el camino operativo mensual no necesita enviar el MASTER a una API. Si se activa la revisión opcional, solo se transmiten los datos estructurados necesarios y el borrador después de C01–C11.

El revisor usa salida estructurada estricta, `max_output_tokens=1000`, entrada máxima de 20.000 caracteres, una sola iteración, tres intentos HTTP, `timeout` y tope total. Ante 429/503 respeta `Retry-After` o aplica backoff exponencial con jitter; otros errores no se reintentan.

## 6. Autonomía L0–L4

### Definiciones

- **L0 — observar:** leer y extraer sin cambiar datos.
- **L1 — asistir:** controlar, alertar y preparar artefactos para una persona.
- **L2 — actuar con aprobación:** cambiar una referencia o estructura después de una autorización explícita.
- **L3 — actuar sin aprobación caso por caso:** modificar o enviar externamente.
- **L4 — decidir o certificar:** aprobar cifras, auditorías o decisiones financieras.

### Matriz

| Acción | Nivel | ¿Habilitada? | Responsable final |
|---|---:|---|---|
| abrir y leer el MASTER | L0 | sí | agente |
| detectar estructura y ejecutar C01–C11 | L1 | sí | agente; revisa Cati |
| generar CSV y mail | L1 | sí, si no hay bloqueos | revisan Cati y Cachu |
| ajustar diseño o fotografía | L2 | solo manual | Cati |
| adoptar nuevos tags o una nueva línea de base | L2 | solo con aprobación | responsable del proceso |
| modificar el MASTER | L3 | no | Administración |
| enviar el mail | L3 | no | Cachu |
| certificar la auditoría o aprobar cifras | L4 | no | responsables humanos |

El agente queda limitado a L1. Un `OK` habilita revisión, no publicación.

## 7. Segregación de funciones

| Momento | Responsable | Control |
|---|---|---|
| preparación del dato fuente | Administración | consensúa el MASTER antes de compartirlo |
| generación técnica | agente | extrae, reconcilia y bloquea |
| revisión visual | Cati | compara Canva contra el MASTER y cambia la foto |
| corrección fina y firma | Cachu | revisa PDF y mail; aprueba o devuelve |
| envío | Cachu | adjunta y envía manualmente |

Cati corrige diferencias según el MASTER, pero no redefine cifras. Cachu no depende solamente del checklist: conserva el ojo fino final.

## 8. Modos de falla

| Falla | Detección | Respuesta del agente | Acción humana |
|---|---|---|---|
| archivo ilegible, mayor a 50 MB o datos requeridos fuera de 5.000 × 256 por hoja | C01 | bloquea CSV y mail | Administración genera otro archivo o normaliza la hoja |
| fecha ausente o ambigua | C02 | no infiere desde el nombre | Cati ubica el cierre correcto |
| fondo no identificable | C03 | bloquea | se revisan encabezados |
| falta CP, fondos o rentabilidad | C04 | no inventa | Administración corrige el MASTER |
| provincias no suman | C05 | informa rango y diferencia | Cati/Administración reconcilian |
| físicas + término no iguala total | C06 | bloquea | revisar clasificación |
| falta mes en rentabilidad | C07 | bloquea tabla y mail | completar o validar la serie |
| portfolio incompleto | C08 | bloquea el informe | revisar hoja y período |
| categorías/sexo/stock no concilian | C09 | bloquea | revisar hojas de hacienda |
| precios incompletos | C10 | bloquea | confirmar fuente del mismo período |
| auditoría posterior al cierre | C11 | bloquea | confirmar última auditoría válida |
| tag nuevo o provincia nueva | alerta estructural | no cambia Canva | Cati decide la adaptación |
| CSV fuera de formato | C11 | no entrega artefacto utilizable | repetir la corrida |
| 429/503 en revisión opcional | respuesta HTTP | reintento acotado con jitter; luego falla cerrado | Cachu revisa el borrador original |
| clave de API ausente | validación previa | no inicia la revisión opcional | usar el flujo determinístico o configurar el secreto |
| salida del modelo incompleta | estado/schema | descarta la revisión | Cachu revisa sin asistencia generativa |

## 9. Seguridad y privacidad

- El contenido del Excel es dato, no instrucción.
- No existen claves ni credenciales en el repositorio.
- `.env.example` enumera variables sin incluir valores secretos.
- El navegador procesa el archivo localmente.
- El MASTER y el PDF real quedan fuera del repositorio público.
- Los nombres de establecimientos se sustituyen por alias en las corridas.
- El hash de la entrada prueba identidad entre corridas sin revelar el archivo.
- El mail no tiene destinatarios ni capacidad de envío.
- La salida se bloquea si un control requerido falla.

## 10. Análisis económico

El runner determinístico tiene costo de tokens igual a cero. Usa recursos locales y una licencia de Canva ya disponible. Para la revisión generativa opcional implementada se eligió `gpt-5.6-luna` por ser suficiente para revisar un texto breve ya estructurado.

Supuesto: 3.000 tokens de entrada y 1.000 de salida. Precios estándar de contexto corto al 11/09/2026: USD 0,20/M de entrada y USD 1,20/M de salida. Fuente: <https://developers.openai.com/api/docs/pricing>.

`Costo = (3.000 / 1.000.000 × 0,20) + (1.000 / 1.000.000 × 1,20) = USD 0,0018 por revisión`

| Frecuencia | Costo |
|---|---:|
| semanal promedio, 0,5 revisiones | USD 0,0009 |
| mensual, 2 revisiones | USD 0,0036 |
| anual, 24 revisiones | USD 0,0432 |
| sensibilidad, 10 revisiones mensuales | USD 0,0180/mes |

No se cuantifica un ahorro de tiempo sin mediciones previas. El beneficio demostrado es la eliminación de diferencias entre el dataset generado y el CSV aprobado en la tercera corrida.

## 11. Alcance reducido

Quedan fuera:

- informes de otros productos e idiomas;
- extracción automática desde WhatsApp;
- selección y ubicación automática de fotografías;
- envío de mails;
- modificación del MASTER;
- aprobación contable o de auditoría;
- publicación con contraseña.

La página privada con contraseña es una evolución operativa posterior. Para la entrega, el sistema funciona localmente y tiene un comando mensual reproducible.

## 12. Criterios de aceptación

1. existen los cinco archivos/rutas obligatorios en la raíz;
2. `npm test` valida las tres corridas y salidas originales;
3. `package.json` y el lockfile fijan dependencias;
4. C01–C11 aparecen una vez y en orden;
5. un artefacto bloqueado no contiene salida utilizable;
6. la corrida final contiene 126 campos y 0 diferencias registradas;
7. Cati y Cachu aparecen como revisores con responsabilidades diferentes;
8. ningún identificador real ni secreto aparece en los archivos públicos.
9. los tests verifican límites y reintentos del revisor opcional sin requerir una clave ni realizar consumos.
