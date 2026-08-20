"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import * as XLSX from "xlsx";

type FundKey = "FONDO_A" | "FONDO_B1" | "FONDO_B2" | "FONDO_B3" | "FONDO_B4";

type FundData = {
  key: FundKey;
  row: number;
  funds: number;
  cp: number;
  monthly: number;
  ytd: number;
  grain: number;
  provinceValues: number[];
  physicalHeads: number;
  controlHeads: number;
};

type ParsedReport = {
  fileName: string;
  reportDate: Date;
  publicationDate: Date;
  auditDate: Date;
  funds: Record<FundKey, FundData>;
  warnings: string[];
};

type MailKey = "ganadero" | "proteina" | "protein-en";

const FUND_KEYS: FundKey[] = ["FONDO_A", "FONDO_B1", "FONDO_B2", "FONDO_B3", "FONDO_B4"];
const FUND_ROWS: Record<FundKey, number> = {
  FONDO_A: 6,
  FONDO_B1: 8,
  FONDO_B2: 9,
  FONDO_B3: 10,
  FONDO_B4: 11,
};
const FUND_NAMES_ES: Record<FundKey, string> = {
  FONDO_A: "Fondo A – Ganadero",
  FONDO_B1: "Fondo B – Serie I",
  FONDO_B2: "Fondo B – Serie II",
  FONDO_B3: "Fondo B – Serie III",
  FONDO_B4: "Fondo B – Serie IV",
};
const FUND_NAMES_EN: Record<Exclude<FundKey, "FONDO_A">, string> = {
  FONDO_B1: "Fund B – Series I",
  FONDO_B2: "Fund B – Series II",
  FONDO_B3: "Fund B – Series III",
  FONDO_B4: "Fund B – Series IV",
};
const PROVINCES = [
  "Salta",
  "Corrientes",
  "Córdoba",
  "Santa Fe",
  "Entre Ríos",
  "San Luis",
  "Santiago del Estero",
  "La Pampa",
  "Buenos Aires",
];
const PROVINCE_COLS = ["J", "K", "L", "M", "N", "O", "P", "Q", "R"];

const SAMPLE_REPORT: ParsedReport = {
  fileName: "AGO_2026_Datos_Demostracion.xlsx",
  reportDate: new Date(2026, 6, 31),
  publicationDate: new Date(2026, 7, 10),
  auditDate: new Date(2026, 2, 31),
  warnings: [],
  funds: {
    FONDO_A: sampleFund("FONDO_A", 6, 1250000000, 5.123, 0.0123, 0.0834, 0, [0, 0, 120, 0, 340, 0, 180, 95, 865], 1600),
    FONDO_B1: sampleFund("FONDO_B1", 8, 2400000000, 6.234, 0.0098, 0.0542, 1250.5, [0, 0, 0, 0, 450, 0, 250, 0, 900], 1600),
    FONDO_B2: sampleFund("FONDO_B2", 9, 3750000000, 4.875, 0.0115, 0.0621, 2800, [0, 320, 140, 250, 600, 90, 180, 120, 800], 2500),
    FONDO_B3: sampleFund("FONDO_B3", 10, 1900000000, 3.456, 0.0107, 0.0475, 975.4, [200, 75, 300, 150, 225, 0, 0, 0, 1050], 2000),
    FONDO_B4: sampleFund("FONDO_B4", 11, 4200000000, 7.012, 0.0131, 0.0718, 1500, [250, 300, 180, 270, 120, 80, 300, 0, 1000], 2500),
  },
};

function sampleFund(
  key: FundKey,
  row: number,
  funds: number,
  cp: number,
  monthly: number,
  ytd: number,
  grain: number,
  provinceValues: number[],
  controlHeads: number,
): FundData {
  return {
    key,
    row,
    funds,
    cp,
    monthly,
    ytd,
    grain,
    provinceValues,
    physicalHeads: provinceValues.reduce((sum, value) => sum + value, 0),
    controlHeads,
  };
}

function excelDate(value: unknown): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d);
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  throw new Error("No se pudo leer la fecha de cierre en RESUMEN TOTAL!A18.");
}

function numericCell(sheet: XLSX.WorkSheet, address: string): number {
  const value = sheet[address]?.v;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  throw new Error(`La celda ${address} no contiene un valor numérico válido.`);
}

function findFundRow(sheet: XLSX.WorkSheet, key: FundKey): number {
  return FUND_ROWS[key];
}

function publicationFromReport(reportDate: Date): Date {
  return new Date(reportDate.getFullYear(), reportDate.getMonth() + 1, 10);
}

function latestAudit(publicationDate: Date): Date {
  const year = publicationDate.getFullYear();
  const candidates: Array<{ close: Date; available: Date }> = [];
  for (let y = year - 2; y <= year + 1; y += 1) {
    candidates.push(
      { close: new Date(y, 2, 31), available: new Date(y, 4, 15) },
      { close: new Date(y, 5, 30), available: new Date(y, 7, 15) },
      { close: new Date(y, 8, 30), available: new Date(y, 10, 15) },
      { close: new Date(y, 11, 31), available: new Date(y + 1, 1, 15) },
    );
  }
  const eligible = candidates
    .filter((candidate) => candidate.available.getTime() <= publicationDate.getTime())
    .sort((a, b) => b.close.getTime() - a.close.getTime());
  if (!eligible[0]) throw new Error("No se pudo determinar la última auditoría disponible.");
  return eligible[0].close;
}

function parseWorkbook(fileName: string, buffer: ArrayBuffer): ParsedReport {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = workbook.Sheets["RESUMEN TOTAL"];
  if (!sheet) throw new Error('El archivo no contiene la hoja "RESUMEN TOTAL".');

  const reportDate = excelDate(sheet.A18?.v);
  const publicationDate = publicationFromReport(reportDate);
  const warnings: string[] = [];
  const funds = {} as Record<FundKey, FundData>;

  for (const key of FUND_KEYS) {
    const row = findFundRow(sheet, key);
    const provinceValues = PROVINCE_COLS.map((column) => numericCell(sheet, `${column}${row}`));
    if (provinceValues.some((value) => value < 0)) {
      throw new Error(`${key}: se encontraron cantidades negativas entre J${row}:R${row}.`);
    }
    const physicalHeads = provinceValues.reduce((sum, value) => sum + value, 0);
    const controlHeads = numericCell(sheet, `S${row}`);
    if (Math.abs(physicalHeads - controlHeads) > 0.001) {
      warnings.push(`${key}: la suma J:R (${physicalHeads}) no coincide con S${row} (${controlHeads}).`);
    }
    const data: FundData = {
      key,
      row,
      funds: numericCell(sheet, `B${row}`),
      cp: numericCell(sheet, `C${row}`),
      monthly: numericCell(sheet, `D${row}`),
      ytd: numericCell(sheet, `E${row}`),
      grain: numericCell(sheet, `H${row}`),
      provinceValues,
      physicalHeads,
      controlHeads,
    };
    if ([data.funds, data.cp, data.grain].some((value) => value < 0)) {
      throw new Error(`${key}: se encontró un valor negativo en los indicadores principales.`);
    }
    funds[key] = data;
  }

  return {
    fileName,
    reportDate,
    publicationDate,
    auditDate: latestAudit(publicationDate),
    funds,
    warnings,
  };
}

function esInt(value: number) {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(value));
}

function enInt(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(value));
}

function esDecimal(value: number, digits: number) {
  return new Intl.NumberFormat("es-AR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

function enDecimal(value: number, digits: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

function esPercent(value: number) {
  return new Intl.NumberFormat("es-AR", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function enPercent(value: number) {
  return new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function esLongDate(date: Date) {
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function enLongDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date);
}

function esMonthYear(date: Date) {
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(date);
}

function enMonthYear(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

function shortDate(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function provinceList(fund: FundData, locale: "es" | "en") {
  const names = PROVINCES.filter((_, index) => fund.provinceValues[index] >= 1);
  if (names.length === 0) return locale === "es" ? "sin provincias informadas" : "no reported provinces";
  const conjunction = locale === "es" ? " y " : ", and ";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]}${locale === "es" ? " y " : " and "}${names[1]}`;
  return `${names.slice(0, -1).join(", ")}${conjunction}${names[names.length - 1]}`;
}

function spanishFundBlock(fund: FundData) {
  const grain = fund.grain > 0 ? `, y ${esInt(fund.grain)} toneladas de granos` : "";
  return `${FUND_NAMES_ES[fund.key]}

- Fondos fideicomitidos totales: $ ${esInt(fund.funds)}
- Valor unitario del CP: ${esDecimal(fund.cp, 3)}
- Variación mensual del Fondo: ${esPercent(fund.monthly)}
- YTD al {{YTD_DATE}}: ${esPercent(fund.ytd)}

Al cierre del mes tenemos ${esInt(fund.physicalHeads)} cabezas de hacienda distribuidas en establecimientos productivos en ${provinceList(fund, "es")}${grain}.`;
}

function englishFundBlock(fund: FundData) {
  if (fund.key === "FONDO_A") return "";
  const grain = fund.grain > 0 ? `, as well as ${enInt(fund.grain)} metric tons of grain` : "";
  return `${FUND_NAMES_EN[fund.key]}

- Total funds held in trust: ARS ${enInt(fund.funds)}
- Participation Certificate (CP) unit value: ${enDecimal(fund.cp, 3)}
- Monthly return: ${enPercent(fund.monthly)}
- YTD return as of {{YTD_LONG}}: ${enPercent(fund.ytd)}

As of month-end, the trust held ${enInt(fund.physicalHeads)} head of cattle across production farms in ${provinceList(fund, "en")}${grain}.`;
}

function buildMails(report: ParsedReport) {
  const monthEs = esMonthYear(report.reportDate);
  const monthEn = enMonthYear(report.reportDate);
  const ytdShort = shortDate(report.reportDate);
  const ytdLong = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" }).format(report.reportDate);
  const auditEs = esLongDate(report.auditDate);
  const auditEn = enLongDate(report.auditDate);
  const withDates = (value: string) => value.replaceAll("{{YTD_DATE}}", ytdShort).replaceAll("{{YTD_LONG}}", ytdLong);

  const ganadero = `Estimados:

Adjuntamos al presente el Informe Mensual de Gestión del Fondo A, correspondiente al mes de ${monthEs} (información auditada hasta el ${auditEs}).

Algunos datos de interés del informe adjunto:

${withDates(spanishFundBlock(report.funds.FONDO_A))}

Cualquier duda, pueden acercarnos sus comentarios.

Saludos,

El equipo de Gestión`;

  const proteinaBlocks = (["FONDO_B1", "FONDO_B2", "FONDO_B3", "FONDO_B4"] as const)
    .map((key) => withDates(spanishFundBlock(report.funds[key])))
    .join("\n\n");
  const proteina = `Estimados:

Les acercamos nuestros Informes de Gestión del Fondo B correspondientes al mes de ${monthEs} (información auditada hasta el ${auditEs}).

Algunos datos de interés de los informes adjuntos:

${proteinaBlocks}

Cualquier duda, pueden acercarnos sus comentarios.

Saludos,

El equipo de Gestión`;

  const englishBlocks = (["FONDO_B1", "FONDO_B2", "FONDO_B3", "FONDO_B4"] as const)
    .map((key) => withDates(englishFundBlock(report.funds[key])))
    .join("\n\n");
  const english = `Dear Investment Team,

Please find attached the Fund B Business and Financial Report for ${monthEn}, which includes audited information as of ${auditEn}.

Below are some key highlights from the report:

${englishBlocks}

Please let us know if you have any questions or comments.

Best regards,
Fund Management Team`;

  return { ganadero, proteina, "protein-en": english };
}

const MAIL_LABELS: Record<MailKey, string> = {
  ganadero: "Fondo A · ES",
  proteina: "Fondo B · ES",
  "protein-en": "Fund B · EN",
};

export default function Home() {
  const [report, setReport] = useState<ParsedReport>(SAMPLE_REPORT);
  const [activeMail, setActiveMail] = useState<MailKey>("ganadero");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const mails = useMemo(() => buildMails(report), [report]);
  const allChecksPass = report.warnings.length === 0;

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    setCopied(false);
    try {
      const parsed = parseWorkbook(file.name, await file.arrayBuffer());
      setReport(parsed);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo procesar el archivo.");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  async function copyMail() {
    await navigator.clipboard.writeText(mails[activeMail]);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="min-h-screen bg-[#f4f5ef] text-[#173529]">
      <header className="border-b border-[#dfe3d7] bg-[#f9faf5]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#194d39] text-sm font-bold text-white">DM</div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Datos Mensuales</p>
              <p className="text-xs text-[#64756b]">Generador de mails mensuales</p>
            </div>
          </div>
          <span className="rounded-full border border-[#cdd8ce] bg-white px-3 py-1.5 text-xs font-semibold text-[#436453]">MVP · revisión humana</span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
        <section className="grid gap-7 lg:grid-cols-[0.86fr_1.4fr]">
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#7a8b77]">Excel → controles → mails</p>
              <h1 className="max-w-xl text-3xl font-semibold tracking-[-0.035em] text-[#183b2d] sm:text-4xl">Tres mails listos para revisar y copiar.</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#607066]">La herramienta toma los datos de “RESUMEN TOTAL”, excluye compras a término y aplica la última auditoría disponible.</p>
            </div>

            <label className="group block cursor-pointer rounded-2xl border border-dashed border-[#9daf9e] bg-white p-5 transition hover:border-[#2f6a4b] hover:bg-[#fbfdf9]">
              <input className="sr-only" type="file" accept=".xlsx,.xls" onChange={onFile} />
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#e7efe6] text-xl text-[#285c42]">↑</div>
                <div>
                  <p className="font-semibold text-[#244b39]">{loading ? "Procesando archivo…" : "Cargar Excel mensual"}</p>
                  <p className="mt-1 text-xs text-[#718077]">Formato .xlsx · no se envía ningún mail</p>
                </div>
              </div>
            </label>

            {error && <div role="alert" className="rounded-2xl border border-[#efc6bd] bg-[#fff4f0] p-4 text-sm leading-6 text-[#8b3326]">{error}</div>}

            <div className="rounded-2xl border border-[#dce2d8] bg-white p-5 shadow-[0_12px_35px_rgba(30,61,44,0.05)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#829080]">Archivo procesado</p>
                  <p className="mt-2 break-words text-sm font-semibold text-[#294f3d]">{report.fileName}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${allChecksPass ? "bg-[#e4f2e8] text-[#287345]" : "bg-[#fff2d7] text-[#8c6415]"}`}>
                  {allChecksPass ? "5/5 OK" : "Revisar"}
                </span>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3">
                <Info label="Período" value={esMonthYear(report.reportDate)} />
                <Info label="Publicación" value={esLongDate(report.publicationDate)} />
                <Info label="Auditoría aplicada" value={esLongDate(report.auditDate)} wide />
              </dl>
            </div>

            <div className="rounded-2xl border border-[#dce2d8] bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Controles automáticos</h2>
                <span className="text-xs text-[#77857c]">J:R vs. S</span>
              </div>
              <div className="mt-4 space-y-2.5">
                {FUND_KEYS.map((key) => {
                  const fund = report.funds[key];
                  const ok = Math.abs(fund.physicalHeads - fund.controlHeads) <= 0.001;
                  return (
                    <div key={key} className="flex items-center justify-between rounded-xl bg-[#f6f8f3] px-3 py-2.5 text-xs">
                      <span className="font-semibold text-[#3e594b]">{key}</span>
                      <span className="text-[#65756b]">{esInt(fund.physicalHeads)} cabezas</span>
                      <span className={`font-bold ${ok ? "text-[#2c7a49]" : "text-[#a15920]"}`}>{ok ? "OK" : "Alerta"}</span>
                    </div>
                  );
                })}
              </div>
              {report.warnings.length > 0 && (
                <ul className="mt-4 space-y-2 rounded-xl bg-[#fff6df] p-3 text-xs leading-5 text-[#825b16]">
                  {report.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                </ul>
              )}
            </div>
          </div>

          <div className="min-w-0 rounded-[1.5rem] border border-[#d8dfd5] bg-white shadow-[0_22px_60px_rgba(25,62,43,0.08)]">
            <div className="flex flex-col gap-3 border-b border-[#e3e7df] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex gap-1 rounded-xl bg-[#eef1ea] p-1">
                {(Object.keys(MAIL_LABELS) as MailKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setActiveMail(key); setCopied(false); }}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${activeMail === key ? "bg-white text-[#24543b] shadow-sm" : "text-[#728077] hover:text-[#315f46]"}`}
                  >
                    {MAIL_LABELS[key]}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={copyMail}
                disabled={!allChecksPass}
                className="rounded-xl bg-[#194d39] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#113e2d] disabled:cursor-not-allowed disabled:bg-[#aab5ae]"
              >
                {copied ? "Copiado ✓" : "Copiar mail"}
              </button>
            </div>

            <div className="border-b border-[#edf0ea] bg-[#fbfcf9] px-6 py-3 text-xs text-[#6c7b72]">
              {activeMail === "ganadero" && `Asunto: Informe Mensual de Gestión | Fondo A | ${esMonthYear(report.reportDate)}`}
              {activeMail === "proteina" && `Asunto: Informes Mensuales de Gestión | Fondo B | ${esMonthYear(report.reportDate)}`}
              {activeMail === "protein-en" && `Subject: Fund B | ${enMonthYear(report.reportDate)} Business and Financial Report`}
            </div>

            <pre className="max-h-[920px] min-h-[690px] overflow-auto whitespace-pre-wrap p-6 font-sans text-[13px] leading-6 text-[#30483c] sm:p-8">{mails[activeMail]}</pre>
          </div>
        </section>
      </div>
    </main>
  );
}

function Info({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-xl bg-[#f3f6ef] px-3 py-3 ${wide ? "col-span-2" : ""}`}>
      <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#849083]">{label}</dt>
      <dd className="mt-1 text-xs font-semibold capitalize text-[#3b5949]">{value}</dd>
    </div>
  );
}
