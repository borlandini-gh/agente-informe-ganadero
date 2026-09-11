# Versión 2 — CSV correcto, template incompatible

## Pieza modificada después: Restricciones del template

El agente entregaba un CSV plano y Canva reconocía los campos, pero el template original contenía tablas. La función Crear en lote no permitía vincular de manera estable cada celda: algunos valores desaparecían y solo 9 de 85 campos coincidieron automáticamente.

La siguiente versión exigió que los datos variables se vincularan a cuadros de texto independientes. Las filas históricas verdes quedaron fijas y fuera de la automatización.
