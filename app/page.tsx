"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import * as XLSX from "xlsx";
import { mailAsText, parseGanaderoWorkbook, toCanvaCsv } from "@/lib/ganadero-agent.mjs";

type Control = {
  id: string;
  control: string;
  estado: "OK" | "ERROR";
  evidencia: string;
  accion: string;
};

type AgentResult = {
  identificacion: {
    archivo_procesado: string;
    periodo_informado: string;
    informacion_auditada_hasta: string;
    version_contrato: string;
  };
  checklist: Control[];
  alertas: Array<{ tipo: string; control_id: string; detalle: string; accion_requerida: string }>;
  artefactos: {
    canva: {
      estado: "LISTO_PARA_REVISION" | "BLOQUEADO";
      cantidad_campos: number;
      campos: Record<string, string> | null;
      controles_bloqueantes: string[];
    };
    mail_ganadero: {
      estado: "LISTO_PARA_REVISION" | "BLOQUEADO";
      asunto: string | null;
      cuerpo: string[] | null;
      controles_bloqueantes: string[];
    };
  };
  supervision: {
    nivel_maximo: string;
    cati: string;
    cachu: string;
  };
};

function downloadText(contents: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function monthLabel(period: string) {
  const [year, month] = period.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}

export default function Home() {
  const [result, setResult] = useState<AgentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    setCopied(false);
    try {
      if (file.size > 50 * 1024 * 1024) throw new Error("El MASTER supera el límite de 50 MB.");
      const parsed = parseGanaderoWorkbook(XLSX, file.name, await file.arrayBuffer()) as AgentResult;
      setResult(parsed);
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "No se pudo procesar el MASTER.");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  function downloadCsv() {
    if (!result) return;
    downloadText(toCanvaCsv(result), `carga_canva_ganadero_${result.identificacion.periodo_informado}.csv`, "text/csv;charset=utf-8");
  }

  async function copyMail() {
    if (!result) return;
    await navigator.clipboard.writeText(mailAsText(result));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const ready = result?.artefactos.canva.estado === "LISTO_PARA_REVISION";
  const passed = result?.checklist.filter((item) => item.estado === "OK").length ?? 0;

  return (
    <main className="min-h-screen bg-[#f3f5ef] text-[#173529]">
      <header className="border-b border-[#dfe3d7] bg-[#fafbf7]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#194d39] text-sm font-bold text-white">IG</div>
            <div>
              <p className="text-sm font-semibold">Informe Ganadero</p>
              <p className="text-xs text-[#64756b]">MASTER → Canva → mail</p>
            </div>
          </div>
          <span className="rounded-full border border-[#cdd8ce] bg-white px-3 py-1.5 text-xs font-semibold text-[#436453]">L1 · revisión humana</span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-9 sm:px-8">
        <section className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#718172]">Agente de preparación y control</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-[#183b2d] sm:text-4xl">Un solo archivo para reducir los errores de traspaso.</h1>
          <p className="mt-4 text-sm leading-6 text-[#607066]">Cargá el MASTER consensuado. El agente extrae y reconcilia los datos del fondo Ganadero, prepara el CSV de “Crear en lote” y redacta el mail. No modifica el Excel ni envía comunicaciones.</p>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.2fr]">
          <div className="space-y-5">
            <label className="block cursor-pointer rounded-2xl border border-dashed border-[#9daf9e] bg-white p-5 transition hover:border-[#2f6a4b] hover:bg-[#fbfdf9]">
              <input className="sr-only" type="file" accept=".xlsx,.xls" onChange={onFile} />
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#e7efe6] text-xl text-[#285c42]">↑</div>
                <div>
                  <p className="font-semibold text-[#244b39]">{loading ? "Procesando MASTER…" : "Cargar MASTER mensual"}</p>
                  <p className="mt-1 text-xs text-[#718077]">.xlsx o .xls · máximo 50 MB</p>
                </div>
              </div>
            </label>

            {error && <div role="alert" className="rounded-2xl border border-[#efc6bd] bg-[#fff4f0] p-4 text-sm leading-6 text-[#8b3326]">{error}</div>}

            <div className="rounded-2xl border border-[#dce2d8] bg-white p-5">
              <h2 className="text-sm font-semibold">Responsabilidades</h2>
              <div className="mt-4 space-y-4 text-sm leading-6 text-[#53665b]">
                <div><strong className="text-[#254b39]">Cati:</strong> {result?.supervision.cati ?? "carga el resultado en Canva, cambia la foto y revisa el diseño contra el MASTER."}</div>
                <div><strong className="text-[#254b39]">Cachu:</strong> {result?.supervision.cachu ?? "hace la corrección fina, aprueba el informe y envía el mail manualmente."}</div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#d8dfd5] bg-white p-5 shadow-[0_22px_60px_rgba(25,62,43,0.08)] sm:p-7">
            {!result ? (
              <div className="grid min-h-[520px] place-items-center text-center">
                <div className="max-w-sm">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#eef3ea] text-2xl">✓</div>
                  <h2 className="mt-5 text-lg font-semibold">Esperando el MASTER</h2>
                  <p className="mt-2 text-sm leading-6 text-[#708078]">Los resultados aparecerán acá. La descarga se habilita solamente si los controles bloqueantes pasan.</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e6eae3] pb-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#829080]">{result.identificacion.archivo_procesado}</p>
                    <h2 className="mt-2 text-xl font-semibold capitalize">{monthLabel(result.identificacion.periodo_informado)}</h2>
                    <p className="mt-1 text-xs text-[#718077]">Auditoría: {result.identificacion.informacion_auditada_hasta}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${ready ? "bg-[#e4f2e8] text-[#287345]" : "bg-[#fff0e8] text-[#9b492e]"}`}>
                    {passed}/{result.checklist.length} OK
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={downloadCsv} disabled={!ready} className="rounded-xl bg-[#194d39] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#113e2d] disabled:cursor-not-allowed disabled:bg-[#aab5ae]">Descargar CSV para Canva</button>
                  <button type="button" onClick={copyMail} disabled={!ready} className="rounded-xl border border-[#abc0b2] bg-white px-4 py-3 text-sm font-bold text-[#25523b] transition hover:bg-[#f4f7f1] disabled:cursor-not-allowed disabled:text-[#aab5ae]">{copied ? "Mail copiado ✓" : "Copiar borrador de mail"}</button>
                </div>

                <div className="mt-6 space-y-2.5">
                  {result.checklist.map((item) => (
                    <details key={item.id} className={`rounded-xl border px-4 py-3 ${item.estado === "OK" ? "border-[#e0e7dd] bg-[#f8faf6]" : "border-[#f0cabf] bg-[#fff6f2]"}`}>
                      <summary className="cursor-pointer list-none text-sm font-semibold">
                        <span className="mr-2 text-xs text-[#718077]">{item.id}</span>{item.control}
                        <span className={`float-right text-xs ${item.estado === "OK" ? "text-[#2c7a49]" : "text-[#a14931]"}`}>{item.estado}</span>
                      </summary>
                      <p className="mt-2 text-xs leading-5 text-[#66766d]">{item.evidencia}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
