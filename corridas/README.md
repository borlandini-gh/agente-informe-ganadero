# Corridas reales

Las tres corridas usan el mismo MASTER real de cierre 31/07/2026 para aislar el efecto de cada cambio:

1. `corrida_01_v1.json`: salida `.xlsx` rechazada por Canva.
2. `corrida_02_v2.json`: CSV aceptado, pero template con tablas incompatible con los vínculos.
3. `corrida_03_v3.json`: template corregido, 126 campos, PDF de ocho páginas y mail listos para revisión.

Los archivos de `originales/` conservan los mensajes y observaciones tal como aparecieron durante la prueba. Los identificadores se anonimizaron y los archivos confidenciales no forman parte del repositorio público.

Cada JSON registra `timestamp`, `request`, `response` y `usage`. Los parámetros y variables mantienen los nombres literales de `prompts/user_prompt.md`. El flujo principal es determinístico: no invoca un modelo y por eso registra cero tokens de entrada y salida.
