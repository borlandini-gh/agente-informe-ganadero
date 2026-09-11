import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const corridasDir = resolve(root, "corridas");
const expectedTopLevel = ["identificacion", "checklist", "alertas", "artefactos", "supervision"].sort();
const expectedControls = Array.from({ length: 11 }, (_, index) => `C${String(index + 1).padStart(2, "0")}`);
const expectedParameters = ["archivo_master", "fecha_auditoria_confirmada", "template_canva", "nivel_maximo_autonomia", "response_mime_type", "schema_salida"].sort();
const expectedVariables = ["ARCHIVO_MASTER", "FECHA_AUDITORIA_AAAA_MM_DD_O_AUTO", "ID_TEMPLATE_CANVA", "ARCHIVO_XLSX_ADJUNTO"].sort();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const files = (await readdir(corridasDir)).filter((name) => name.endsWith(".json")).sort();
assert(files.length === 3, `Se esperaban 3 corridas JSON y se encontraron ${files.length}.`);
const originals = (await readdir(resolve(corridasDir, "originales"))).filter((name) => name.endsWith(".md")).sort();
assert(originals.length === 3, `Se esperaban 3 salidas originales y se encontraron ${originals.length}.`);

const schema = JSON.parse(await readFile(resolve(root, "schemas", "output.schema.json"), "utf8"));
assert(JSON.stringify([...schema.required].sort()) === JSON.stringify(expectedTopLevel), "El schema no coincide con las cinco claves raíz.");
assert(schema.properties.identificacion.additionalProperties === false, "El schema de identificación permite claves abiertas.");
assert(schema.properties.alertas.items.additionalProperties === false, "El schema de alertas permite claves abiertas.");
assert(Array.isArray(schema.properties.alertas.items.properties.tipo.enum), "Los tipos de alerta no están cerrados por enum.");

const runs = [];
for (const file of files) {
  const run = JSON.parse(await readFile(resolve(corridasDir, file), "utf8"));
  runs.push(run);
  assert(JSON.stringify(Object.keys(run).sort()) === JSON.stringify(expectedTopLevel), `${file}: claves raíz inesperadas.`);
  assert(/^\d{4}-\d{2}-\d{2}/.test(run.identificacion.fecha_ejecucion), `${file}: falta fecha de ejecución.`);
  assert(run.identificacion.periodo_informado === "2026-07-31", `${file}: período inesperado.`);
  assert(run.identificacion.informacion_auditada_hasta === "2026-06-30", `${file}: auditoría inesperada.`);
  assert(run.identificacion.contenido_es_dato_no_instruccion === true, `${file}: falta aislamiento de datos.`);
  assert(run.identificacion.entrada?.salida_original, `${file}: falta referencia a la salida original.`);
  const trace = run.identificacion.traza;
  assert(trace?.timestamp === run.identificacion.fecha_ejecucion, `${file}: timestamp de traza inconsistente.`);
  assert(JSON.stringify(Object.keys(trace.request.parametros).sort()) === JSON.stringify(expectedParameters), `${file}: parámetros del prompt incompletos.`);
  assert(JSON.stringify(Object.keys(trace.request.variables).sort()) === JSON.stringify(expectedVariables), `${file}: variables del prompt incompletas.`);
  assert(trace.response.schema_validado === true, `${file}: respuesta sin validación de schema.`);
  assert(trace.usage.input_files === 1 && trace.usage.workbook_sheets > 0, `${file}: uso de herramientas no trazado.`);
  assert(trace.usage.model_invocations === 0 && trace.usage.input_tokens === 0 && trace.usage.output_tokens === 0, `${file}: tokens incompatibles con el runner determinístico.`);
  assert(run.checklist.length === 11, `${file}: el checklist debe contener C01–C11.`);
  assert(JSON.stringify(run.checklist.map((item) => item.id)) === JSON.stringify(expectedControls), `${file}: controles fuera de orden.`);
  for (const item of run.checklist) {
    assert(["OK", "ERROR"].includes(item.estado), `${file}: estado inválido en ${item.id}.`);
    assert(item.evidencia?.length > 0 && item.accion?.length > 0, `${file}: falta evidencia o acción en ${item.id}.`);
  }
  assert(run.supervision.nivel_maximo === "L1", `${file}: autonomía superior a L1.`);
  assert(run.supervision.cati.toLowerCase().includes("canva"), `${file}: falta la revisión de Cati.`);
  assert(run.supervision.cachu.toLowerCase().includes("envía"), `${file}: falta la aprobación y envío de Cachu.`);

  for (const artifact of Object.values(run.artefactos)) {
    assert(["LISTO_PARA_REVISION", "BLOQUEADO"].includes(artifact.estado), `${file}: estado de artefacto inválido.`);
    if (artifact.estado === "BLOQUEADO") {
      assert(artifact.controles_bloqueantes.length > 0, `${file}: artefacto bloqueado sin control bloqueante.`);
    } else {
      assert(artifact.controles_bloqueantes.length === 0, `${file}: artefacto listo con bloqueos.`);
    }
  }
}

assert(runs[0].identificacion.metricas.campos_detectados_canva === 0, "Corrida 1: métrica del rechazo XLSX inválida.");
assert(runs[1].identificacion.metricas.campos_coincidentes_automaticos === 9, "Corrida 2: no conserva 9 de 85 coincidencias.");
const finalRun = runs[2];
assert(finalRun.checklist.every((item) => item.estado === "OK"), "Corrida 3: todos los controles deben pasar.");
const canva = finalRun.artefactos.canva;
assert(canva.estado === "LISTO_PARA_REVISION", "Corrida 3: Canva no quedó listo.");
assert(canva.cantidad_campos === 126, "Corrida 3: se esperaban 126 campos.");
assert(Object.keys(canva.campos).length === canva.cantidad_campos, "Corrida 3: cantidad de campos inconsistente.");
assert(canva.campos.fondos_fideicomitidos === "$ 9.580.487.004", "Corrida 3: fondos incorrectos.");
assert(canva.campos.tabla_2026_jun_total === "$ 9.477.593.494", "Corrida 3: junio incorrecto.");
assert(canva.campos.total_cabezas === "4.954", "Corrida 3: cabezas totales incorrectas.");
assert(canva.campos.nota_auditoria_resumen === "30 de Junio de 2026.", "Corrida 3: auditoría incorrecta.");
for (const month of ["ago", "sep", "oct", "nov", "dic"]) {
  for (const suffix of ["total", "certificados", "valorcp", "var"]) {
    assert(canva.campos[`${month}_${suffix}`] === "", `Corrida 3: ${month}_${suffix} debe ser una cadena vacía.`);
  }
}
assert(finalRun.identificacion.metricas.diferencias_detectadas === 0, "Corrida 3: quedan diferencias contra el CSV aprobado.");
assert(finalRun.artefactos.mail_ganadero.estado === "LISTO_PARA_REVISION", "Corrida 3: mail bloqueado.");

const publicFiles = [
  resolve(root, "README.md"),
  resolve(root, "DECISIONES.md"),
  resolve(root, "prompts", "system_prompt.md"),
  resolve(root, "prompts", "user_prompt.md"),
  resolve(root, "validaciones", "validacion_2026_08.json"),
  ...files.map((file) => resolve(corridasDir, file)),
];
const forbidden = ["inv" + "ernea", "ff" + "ig", "ips" + "1", "ips" + "2", "ips" + "3", "ips" + "4"];
for (const path of publicFiles) {
  const contents = (await readFile(path, "utf8")).toLowerCase();
  for (const term of forbidden) assert(!contents.includes(term), `${path}: se encontró un identificador confidencial.`);
}

console.log("OK: 3 corridas reales con request/response/usage, parámetros trazables, C01–C11 y 126 campos Canva validados.");
