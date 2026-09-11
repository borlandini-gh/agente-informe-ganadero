import assert from "node:assert/strict";
import test from "node:test";
import { reviewMailWithModel } from "../lib/model-reviewer.mjs";

function response(status, body = {}, retryAfter = null) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => (name.toLowerCase() === "retry-after" ? retryAfter : null) },
    json: async () => body,
  };
}

test("reintenta 429/503 con límite y devuelve JSON estructurado", async () => {
  const calls = [];
  const waits = [];
  const queue = [
    response(429, {}, "0"),
    response(503),
    response(200, {
      status: "completed",
      output: [{ content: [{ type: "output_text", text: JSON.stringify({
        estado: "APROBADO",
        observaciones: [],
        mail_propuesto: "Borrador controlado",
        nota_para_cachu: "Revisar y aprobar antes del envío.",
      }) }] }],
      usage: { input_tokens: 500, output_tokens: 80 },
    }),
  ];

  const result = await reviewMailWithModel({
    sourceData: { mail: "Borrador", cifras: { total: "4.954" } },
    apiKey: "test-key",
    fetchImpl: async (url, options) => {
      calls.push({ url, body: JSON.parse(options.body) });
      return queue.shift();
    },
    sleep: async (milliseconds) => waits.push(milliseconds),
    random: () => 0,
  });

  assert.equal(calls.length, 3);
  assert.equal(waits.length, 2);
  assert.equal(calls[0].body.max_output_tokens, 1000);
  assert.equal(calls[0].body.text.format.type, "json_schema");
  assert.equal(calls[0].body.text.format.strict, true);
  assert.equal(result.revision.estado, "APROBADO");
  assert.equal(result.telemetria.intentos_http, 3);
  assert.equal(result.telemetria.max_iteraciones_modelo, 1);
});

test("no reintenta errores no recuperables", async () => {
  let calls = 0;
  await assert.rejects(
    reviewMailWithModel({
      sourceData: { mail: "Borrador" },
      apiKey: "test-key",
      fetchImpl: async () => {
        calls += 1;
        return response(400);
      },
    }),
    /HTTP 400.*1 intento/,
  );
  assert.equal(calls, 1);
});

test("bloquea entradas por encima del límite", async () => {
  await assert.rejects(
    reviewMailWithModel({
      sourceData: { mail: "x".repeat(2_000) },
      apiKey: "test-key",
      maxInputChars: 1_000,
      fetchImpl: async () => response(200),
    }),
    /supera el límite/,
  );
});
