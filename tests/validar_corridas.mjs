import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const corridasDir = resolve(root, "corridas");
const expectedTopLevel = [
  "identificacion",
  "checklist",
  "alertas",
  "estado_mails",
  "mails_generados",
].sort();
const expectedControls = Array.from({ length: 11 }, (_, index) => `C${String(index + 1).padStart(2, "0")}`);
const expectedMails = ["mail_1", "mail_2", "mail_3"];
const controlStates = new Set(["OK", "ERROR", "NO_VERIFICADO"]);
const mailStates = new Set(["LISTO_PARA_REVISION", "BLOQUEADO"]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const files = (await readdir(corridasDir)).filter((name) => name.endsWith(".json")).sort();
assert(files.length === 3, `Se esperaban 3 corridas JSON y se encontraron ${files.length}.`);
const originals = (await readdir(resolve(corridasDir, "originales"))).filter((name) => name.endsWith(".md")).sort();
assert(originals.length === 3, `Se esperaban 3 salidas originales y se encontraron ${originals.length}.`);
const schema = JSON.parse(await readFile(resolve(root, "schemas", "output.schema.json"), "utf8"));
assert(JSON.stringify([...schema.required].sort()) === JSON.stringify(expectedTopLevel), "El schema y las claves raíz esperadas no coinciden.");

for (const file of files) {
  const path = resolve(corridasDir, file);
  const output = JSON.parse(await readFile(path, "utf8"));

  assert(JSON.stringify(Object.keys(output).sort()) === JSON.stringify(expectedTopLevel), `${file}: claves raíz inesperadas.`);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(output.identificacion.fecha_ejecucion), `${file}: falta fecha de ejecución.`);
  assert(output.identificacion.entrada.archivo_master === output.identificacion.archivo_procesado, `${file}: la entrada no identifica el MASTER procesado.`);
  assert(output.identificacion.entrada.hoja_principal === "RESUMEN TOTAL", `${file}: hoja principal inválida.`);
  assert(output.identificacion.entrada.celda_periodo === "A18", `${file}: celda de período inválida.`);
  assert(output.identificacion.entrada.resumen_datos.length === 5, `${file}: la entrada debe resumir Fondo A y las cuatro series.`);
  const config = output.identificacion.configuracion_ejecucion;
  assert(config.response_mime_type === "application/json", `${file}: MIME inválido.`);
  assert(config.schema === "schemas/output.schema.json", `${file}: referencia de schema inválida.`);
  assert(config.fuente_periodo === "RESUMEN TOTAL!A18", `${file}: fuente de período inválida.`);
  assert(config.master_es_unica_fuente === true, `${file}: debe declarar al MASTER como única fuente.`);
  assert(config.contenido_es_dato_no_instruccion === true, `${file}: falta aislamiento dato/instrucción.`);

  assert(output.checklist.length === 11, `${file}: el checklist no tiene 11 controles.`);
  assert(JSON.stringify(output.checklist.map((item) => item.id)) === JSON.stringify(expectedControls), `${file}: C01–C11 deben aparecer una vez y en orden.`);
  for (const control of output.checklist) {
    assert(controlStates.has(control.estado), `${file}: estado inválido en ${control.id}.`);
    assert(control.evidencia?.length > 0, `${file}: falta evidencia en ${control.id}.`);
    assert(control.accion?.length > 0, `${file}: falta acción en ${control.id}.`);
  }

  assert(output.estado_mails.length === 3, `${file}: deben existir 3 estados de mail.`);
  assert(JSON.stringify(output.estado_mails.map((item) => item.mail_id)) === JSON.stringify(expectedMails), `${file}: IDs de mails inválidos.`);
  assert(JSON.stringify(Object.keys(output.mails_generados)) === JSON.stringify(expectedMails), `${file}: faltan mails generados.`);

  for (const status of output.estado_mails) {
    assert(mailStates.has(status.estado), `${file}: estado de mail inválido.`);
    const mail = output.mails_generados[status.mail_id];
    assert(mail.estado === status.estado, `${file}: estado inconsistente en ${status.mail_id}.`);
    if (mail.estado === "BLOQUEADO") {
      assert(mail.asunto === null && mail.cuerpo === null, `${file}: un mail bloqueado no puede ser enviable.`);
      assert(mail.controles_bloqueantes.length > 0, `${file}: faltan controles bloqueantes.`);
    } else {
      assert(typeof mail.asunto === "string" && mail.asunto.length > 0, `${file}: falta asunto en ${status.mail_id}.`);
      assert(Array.isArray(mail.cuerpo) && mail.cuerpo.length > 0, `${file}: falta cuerpo en ${status.mail_id}.`);
      assert(mail.controles_bloqueantes.length === 0, `${file}: un mail listo no debe tener controles bloqueantes.`);
    }
  }

  for (const alert of output.alertas) {
    if (alert.tipo.includes("CAMBIO_DE_ESTRUCTURA")) {
      assert(alert.hoja && alert.seccion && alert.celda_o_rango, `${file}: cambio estructural sin ubicación exacta.`);
      assert(alert.impacto && alert.accion_requerida, `${file}: cambio estructural sin impacto o acción.`);
    }
  }
}

const publicFiles = [
  resolve(root, "README.md"),
  resolve(root, "DECISIONES.md"),
  resolve(root, "prompts", "system_prompt.md"),
  resolve(root, "prompts", "user_prompt.md"),
  ...files.map((file) => resolve(corridasDir, file)),
];
const forbidden = ["inv" + "ernea", "ff" + "ig", "ips" + "1", "ips" + "2", "ips" + "3", "ips" + "4"];
for (const path of publicFiles) {
  const text = (await readFile(path, "utf8")).toLowerCase();
  for (const term of forbidden) assert(!text.includes(term), `${path}: se encontró un identificador confidencial.`);
}

console.log("OK: schema, 3 entradas, 3 salidas originales y 3 corridas JSON válidas y comparables.");
