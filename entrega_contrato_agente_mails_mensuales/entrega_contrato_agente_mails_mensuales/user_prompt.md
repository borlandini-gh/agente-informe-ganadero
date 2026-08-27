# User prompt

Procesá el Excel MASTER adjunto correspondiente al cierre mensual.

Ejecutá íntegramente la tarea, los controles y las reglas definidos en el system prompt. Identificá el período desde la celda `RESUMEN TOTAL!A18`; no lo deduzcas del nombre del archivo.

Generá los tres mails y devolvé únicamente las cinco secciones del formato estructurado obligatorio:

1. Identificación.
2. Checklist de controles C01–C11.
3. Alertas.
4. Estado de los mails.
5. Mails generados.

Utilizá el Excel adjunto como única fuente. Compará su estructura con el último MASTER aprobado que se adjunte como línea de base. Si la línea de base no está disponible, declará `COMPARACIÓN_NO_DISPONIBLE`.

Si el archivo no puede abrirse, un dato obligatorio falta o es inconsistente, o un cambio estructural impide ubicar un campo de forma inequívoca, no inventes ni completes información. Registrá el problema con ubicación exacta y bloqueá solamente los mails afectados según las reglas del system prompt.

