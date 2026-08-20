# Generador de mails mensuales

## Qué construí
Construí una aplicación web para una agencia de comunicación que transforma el Excel mensual de un cliente en tres cuerpos de email listos para revisar y copiar: Fondo A en español, Fondo B en español y Fondo B en inglés. La herramienta automatiza la extracción y la redacción, pero conserva una revisión humana antes del envío. Para esta entrega pública reemplacé los nombres y valores del cliente por datos ficticios.

## Cómo se lo pedí
Los siguientes prompts mantienen las instrucciones originales, pero usan nombres genéricos para no identificar al cliente.

```text
Te cuento mi contexto: tengo una agencia de comunicación donde para un cliente tengo que armar un informe mensual que esta diseñado en Canva y donde saco los datos de un excel que me pasan todos los meses.
Me gustaría automatizar el proceso manual de actualización de información manteniendo el mismo formato.
Dame 10 ideas de cosas que podría construir con IA para eso,
de la más obvia a la más rara. Para cada una: qué haría falta,
qué me ahorraría, y por dónde empezaría hoy.
```

```text
me encanta, pero como tengo que entregar algo "chico" para el jueves, vamos a mepezar con la segunda fase de este proyecto.
Tengo que tomar datos del excel para actualizar el cuerpo de texto de los mails donde se mandan los informes. Para eso, tengo que tomar ciertos datos del excel y detallarlos por escrito.
Dame 10 ideas de cosas que podría construir con IA para eso, de la más obvia a la más rara. Para cada una: qué haría falta, qué me ahorraría, y por dónde empezaría hoy.
```

```text
Las provincias son las listadas desde la columna J hasta la R. En casos que el número sea 0, en el texto del mail no se incluye el nombre de la provincia. Sí debe incluirse a partir de 1 ejemplar por provincia.

El total de cabezas del cuerpo del mail deberá ser el total físico ubicadas en establecimiento, no incluyendo las compras a término.

La información auditada es trimestral y está disponible 45 días después del cierre. Los informes se publican de manera mensual los días 10 de cada mes. Los cierres son el 31/12, el 31/3, el último día de junio y el 30/9.
```

```text
Antes de hacer eso tenemos que hacer una versión del Fondo B en inglés. Te paso el mail modelo que venimos usando, ¿podés sugerir ediciones?
```

Durante la iteración revisé la redacción inglesa y dejé aprobados, entre otros, los términos “Total funds held in trust”, “Participation Certificate (CP) unit value”, “Monthly return”, “YTD return” y “metric tons of grain”.

## Qué funciona
- Permite cargar un archivo `.xlsx` desde el navegador. El archivo se procesa localmente y no se incluye en este repositorio.
- Lee la hoja `RESUMEN TOTAL`, toma la fecha de cierre desde `A18` y extrae cinco fondos desde las filas configuradas.
- Extrae fondos fideicomitidos, valor unitario del CP, variación mensual, YTD y toneladas de granos.
- Calcula las cabezas físicas sumando las columnas `J:R`, por lo que excluye las compras a término.
- Incluye una provincia solamente cuando tiene al menos una cabeza y conserva el orden del Excel.
- Compara el total físico `J:R` contra la columna de control `S` para los cinco fondos.
- Calcula automáticamente la publicación del día 10 y la auditoría trimestral más reciente que ya lleva 45 días disponible.
- Agrega la frase de granos solamente cuando el fondo tiene toneladas informadas.
- Genera tres emails: Fondo A en español, Fondo B en español y Fondo B en inglés.
- Adapta los separadores numéricos al idioma y permite copiar cada email.
- Lo probé con un archivo mensual y los cinco controles dieron OK.

Para usarlo, se abre la aplicación, se carga el Excel mensual, se revisan los controles y se copia el mail correspondiente. La herramienta no envía emails automáticamente. Los valores visibles al abrirla son ficticios y sirven únicamente como demostración.

## Qué falta o qué falló
- El primer cálculo de cabezas incluía compras a término porque tomaba el total general. Lo corregí usando exclusivamente la suma de las columnas provinciales `J:R` y validándola contra `S`.
- La fecha auditada no podía ser simplemente la última fecha de cierre: debía considerar los 45 días de disponibilidad. Agregué esa regla junto con el calendario de publicación.
- Los rendimientos mensuales y YTD pueden ser negativos. Corregí el control para que no los marque como datos inválidos.
- La herramienta depende de que el Excel conserve la hoja y las columnas acordadas. Si cambia la estructura, habrá que adaptar el lector.
- No envía los emails ni adjunta los informes: genera el contenido para revisión y copiado manual.
- No incluí el Excel real ni valores reales porque el repositorio es público.
- La primera versión de la entrega contenía identificadores del cliente. La volví privada y preparé esta versión anónima con nombres y cifras ficticias.

## Qué aprendí
Aprendí que para trabajar bien con un agente primero tengo que explicar el proceso real y después convertirlo en reglas concretas y verificables. Entendí que automatizar no es solamente generar texto: también hay que controlar fechas, fuentes, excepciones y formatos. Vi que revisar los resultados con un archivo real permite detectar supuestos incorrectos, como usar compras a término o una auditoría todavía no disponible. También aprendí que una entrega pública necesita anonimizar tanto la documentación como el código y los datos de demostración.
