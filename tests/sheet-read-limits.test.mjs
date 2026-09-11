import assert from "node:assert/strict";
import test from "node:test";
import { boundedSheetRange, SHEET_READ_LIMITS } from "../lib/ganadero-agent.mjs";

const XLSX = {
  utils: {
    decode_range(reference) {
      if (reference === "A1:U1048573") return { s: { r: 0, c: 0 }, e: { r: 1_048_572, c: 20 } };
      if (reference === "A1:DL200") return { s: { r: 0, c: 0 }, e: { r: 199, c: 115 } };
      throw new Error(`Referencia de prueba inesperada: ${reference}`);
    },
  },
};

test("acota una hoja extendida por formato sin recortar sus columnas útiles", () => {
  const range = boundedSheetRange(XLSX, { "!ref": "A1:U1048573" });
  assert.deepEqual(range, {
    s: { r: 0, c: 0 },
    e: { r: SHEET_READ_LIMITS.maxRows - 1, c: 20 },
  });
});

test("conserva el rango completo cuando está dentro del límite", () => {
  assert.deepEqual(boundedSheetRange(XLSX, { "!ref": "A1:DL200" }), {
    s: { r: 0, c: 0 },
    e: { r: 199, c: 115 },
  });
});

test("mantiene compatibilidad con adaptadores sin referencia de hoja", () => {
  assert.equal(boundedSheetRange(XLSX, {}), undefined);
});
