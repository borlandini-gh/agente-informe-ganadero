import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import * as XLSX from "xlsx";
import { mailAsText, parseGanaderoWorkbook, toCanvaCsv } from "../lib/ganadero-agent.mjs";

function parseArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith("--")) continue;
    if (argument === "--revisar-con-modelo") {
      options.revisarConModelo = true;
      continue;
    }
    options[argument.slice(2)] = argv[index + 1];
    index += 1;
  }
  if (!options.master) {
    throw new Error("Uso: npm run generar -- --master archivo.xlsx [--salida carpeta] [--auditoria AAAA-MM-DD] [--revisar-con-modelo]");
  }
  return options;
}

const options = parseArguments(process.argv.slice(2));
const masterPath = resolve(options.master);
const outputDir = resolve(options.salida ?? "salidas/ultima-corrida");
const input = await readFile(masterPath);
if (input.byteLength > 50 * 1024 * 1024) throw new Error("El MASTER supera el límite de 50 MB.");

const startedAt = performance.now();
const executionDate = new Date();
const result = parseGanaderoWorkbook(XLSX, basename(masterPath), input, { auditDate: options.auditoria, executionDate });
result.identificacion.sha256_entrada = createHash("sha256").update(input).digest("hex");
result.identificacion.latencia_ms = Math.round(performance.now() - startedAt);

let modelReview = null;
if (options.revisarConModelo) {
  if (result.artefactos.mail_ganadero.estado !== "LISTO_PARA_REVISION") {
    throw new Error("El mail está bloqueado por controles; no se envía al modelo.");
  }
  const { reviewMailWithModel } = await import("../lib/model-reviewer.mjs");
  const fields = result.artefactos.canva.campos;
  modelReview = await reviewMailWithModel({
    sourceData: {
      periodo_informado: result.identificacion.periodo_informado,
      informacion_auditada_hasta: result.identificacion.informacion_auditada_hasta,
      checklist: result.checklist,
      alertas: result.alertas,
      datos_para_mail: {
        fondos_fideicomitidos: fields.fondos_fideicomitidos,
        valor_cp: fields.valor_cp,
        rendimiento_mensual: fields.rendimiento_mensual,
        rendimiento_anual: fields.rendimiento_anual,
        total_cabezas: fields.total_cabezas,
        compras_termino: fields.compras_termino,
        hacienda_santiago_del_estero: fields.hacienda_santiago_del_estero,
        hacienda_la_pampa: fields.hacienda_la_pampa,
        hacienda_entre_rios: fields.hacienda_entre_rios,
        hacienda_cordoba: fields.hacienda_cordoba,
        hacienda_buenos_aires: fields.hacienda_buenos_aires,
      },
      mail_ganadero: result.artefactos.mail_ganadero,
    },
  });
}

await mkdir(outputDir, { recursive: true });
const outputs = [
  writeFile(resolve(outputDir, "resultado.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8"),
  writeFile(resolve(outputDir, "carga_canva_ganadero.csv"), toCanvaCsv(result), "utf8"),
  writeFile(resolve(outputDir, "mail_ganadero.txt"), mailAsText(result), "utf8"),
];
if (modelReview) {
  outputs.push(writeFile(resolve(outputDir, "revision_modelo.json"), `${JSON.stringify(modelReview, null, 2)}\n`, "utf8"));
}
await Promise.all(outputs);

console.log(`OK: ${result.identificacion.periodo_informado}`);
console.log(`Controles: ${result.checklist.filter((item) => item.estado === "OK").length}/${result.checklist.length} OK`);
if (modelReview) console.log(`Revisión opcional: ${modelReview.revision.estado}`);
console.log(`Salida: ${outputDir}`);
