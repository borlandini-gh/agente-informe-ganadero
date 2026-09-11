const MONTH_TAGS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MONTH_LABELS = ["ENE", "FEB", "MAR", "ABR", "MAYO", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

export const SHEET_READ_LIMITS = Object.freeze({
  maxRows: 5_000,
  maxColumns: 256,
});

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function toDate(value, XLSX) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d);
  }
  if (typeof value === "string") {
    const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function sameDate(left, right) {
  return left && right && dateKey(left) === dateKey(right);
}

export function boundedSheetRange(XLSX, sheet) {
  const reference = sheet?.["!ref"];
  if (!reference || typeof XLSX?.utils?.decode_range !== "function") return undefined;

  const decoded = XLSX.utils.decode_range(reference);
  return {
    s: { r: 0, c: 0 },
    e: {
      r: Math.min(decoded.e.r, SHEET_READ_LIMITS.maxRows - 1),
      c: Math.min(decoded.e.c, SHEET_READ_LIMITS.maxColumns - 1),
    },
  };
}

function matrix(XLSX, sheet) {
  const range = boundedSheetRange(XLSX, sheet);
  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: null,
    ...(range ? { range } : {}),
  });
}

function findColumn(row, predicate) {
  return row.findIndex((value) => predicate(normalize(value), value));
}

function findHeaderRow(rows, required) {
  return rows.findIndex((row) => required.every((term) => row.some((value) => normalize(value).includes(term))));
}

function getNumber(rows, rowIndex, columnIndex, label) {
  const value = rows[rowIndex]?.[columnIndex];
  if (!isNumber(value)) throw new Error(`No se encontró un valor numérico válido para ${label}.`);
  return value;
}

function columnIndexFromLetters(letters) {
  return [...letters.toUpperCase()].reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function columnLetters(index) {
  let value = index + 1;
  let output = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    output = String.fromCharCode(65 + remainder) + output;
    value = Math.floor((value - 1) / 26);
  }
  return output;
}

function findAssociatedSheet(workbook, sourceName, suffix) {
  const prefix = normalize(sourceName).replace(/ rentabilidad$/, "");
  return workbook.SheetNames.find((name) => normalize(name) === `${prefix} ${normalize(suffix)}`) ?? null;
}

function findReportDate(rows, XLSX) {
  const candidates = [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < rows[rowIndex].length; columnIndex += 1) {
      const parsed = toDate(rows[rowIndex][columnIndex], XLSX);
      if (parsed && parsed.getFullYear() >= 2000 && parsed.getFullYear() <= 2100) {
        candidates.push({ date: parsed, rowIndex, columnIndex });
      }
    }
  }
  if (candidates.length === 0) throw new Error("No se encontró la fecha de cierre en la hoja de resumen.");
  candidates.sort((a, b) => b.date.getTime() - a.date.getTime());
  return candidates[0].date;
}

function findFundSummary(XLSX, workbook) {
  const sheetName = workbook.SheetNames.find((name) => normalize(name) === "resumen total");
  if (!sheetName) throw new Error('El MASTER no contiene la hoja "RESUMEN TOTAL".');
  const sheet = workbook.Sheets[sheetName];
  const rows = matrix(XLSX, sheet);
  const headerRowIndex = findHeaderRow(rows, ["fondo", "fondos fideicomitidos", "valor cp"]);
  if (headerRowIndex < 0) throw new Error("No se encontraron los encabezados del fondo en RESUMEN TOTAL.");

  const header = rows[headerRowIndex];
  const fundColumn = findColumn(header, (label) => label === "fondo");
  const fundsColumn = findColumn(header, (label) => label.includes("fondos fideicomitidos"));
  const cpColumn = findColumn(header, (label) => label.includes("valor cp"));
  const returnsColumn = findColumn(header, (label) => label.includes("rendimientos"));
  const headsColumn = findColumn(header, (label) => label === "hacienda");
  const grainColumn = findColumn(header, (label) => label === "granos");
  if ([fundColumn, fundsColumn, cpColumn, returnsColumn, headsColumn].some((column) => column < 0)) {
    throw new Error("La estructura de indicadores principales no coincide con el contrato.");
  }

  let fundRowIndex = -1;
  for (let rowIndex = headerRowIndex + 1; rowIndex < Math.min(rows.length, headerRowIndex + 15); rowIndex += 1) {
    const label = normalize(rows[rowIndex]?.[fundColumn]);
    if (!label || label.includes("resumen") || label.includes("total")) continue;
    if ([fundsColumn, cpColumn, returnsColumn, returnsColumn + 1, headsColumn].every((column) => isNumber(rows[rowIndex]?.[column]))) {
      fundRowIndex = rowIndex;
      break;
    }
  }
  if (fundRowIndex < 0) throw new Error("No se pudo identificar semánticamente la fila del fondo Ganadero.");

  let provinceRange = null;
  for (let columnIndex = 0; columnIndex < rows[fundRowIndex].length; columnIndex += 1) {
    const address = `${columnLetters(columnIndex)}${fundRowIndex + 1}`;
    const formula = sheet[address]?.f;
    const match = typeof formula === "string" ? formula.match(/SUM\(\$?([A-Z]+)\$?\d+:\$?([A-Z]+)\$?\d+\)/i) : null;
    if (match) {
      const start = columnIndexFromLetters(match[1]);
      const end = columnIndexFromLetters(match[2]);
      if (start > headsColumn && end >= start) {
        provinceRange = { start, end, total: columnIndex };
        break;
      }
    }
  }
  if (!provinceRange) throw new Error("No se encontró la fórmula que totaliza el bloque dinámico de provincias.");

  const provinces = [];
  for (let columnIndex = provinceRange.start; columnIndex <= provinceRange.end; columnIndex += 1) {
    const name = String(header[columnIndex] ?? "").trim();
    const value = getNumber(rows, fundRowIndex, columnIndex, `provincia ${name || columnLetters(columnIndex)}`);
    provinces.push({ name, value, cell: `${columnLetters(columnIndex)}${fundRowIndex + 1}` });
  }

  const physicalHeads = provinces.reduce((sum, item) => sum + item.value, 0);
  const reportedPhysicalHeads = getNumber(rows, fundRowIndex, provinceRange.total, "total físico provincial");
  const totalHeads = getNumber(rows, fundRowIndex, headsColumn, "hacienda total");
  const purchasesAtTerm = totalHeads - reportedPhysicalHeads;
  const reportDate = findReportDate(rows, XLSX);

  return {
    sheetName,
    rows,
    reportDate,
    fundRowIndex,
    fundLabel: String(rows[fundRowIndex][fundColumn]),
    funds: getNumber(rows, fundRowIndex, fundsColumn, "fondos fideicomitidos"),
    cp: getNumber(rows, fundRowIndex, cpColumn, "valor CP"),
    monthlyReturn: getNumber(rows, fundRowIndex, returnsColumn, "rendimiento mensual"),
    ytdReturn: getNumber(rows, fundRowIndex, returnsColumn + 1, "rendimiento anual"),
    totalHeads,
    grain: grainColumn >= 0 && isNumber(rows[fundRowIndex][grainColumn]) ? rows[fundRowIndex][grainColumn] : 0,
    provinces,
    physicalHeads,
    reportedPhysicalHeads,
    purchasesAtTerm,
    sourceCells: {
      reportDate: "fecha detectada semánticamente en RESUMEN TOTAL",
      fundRow: `${fundRowIndex + 1}`,
      provinceRange: `${columnLetters(provinceRange.start)}${fundRowIndex + 1}:${columnLetters(provinceRange.end)}${fundRowIndex + 1}`,
      physicalTotal: `${columnLetters(provinceRange.total)}${fundRowIndex + 1}`,
      totalHeads: `${columnLetters(headsColumn)}${fundRowIndex + 1}`,
    },
  };
}

function findRentability(XLSX, workbook, summary) {
  for (const sheetName of workbook.SheetNames.filter((name) => normalize(name).includes("rentabilidad"))) {
    const rows = matrix(XLSX, workbook.Sheets[sheetName]);
    const headerRowIndex = findHeaderRow(rows, ["fecha", "total", "certificados participacion", "valor unitario"]);
    if (headerRowIndex < 0) continue;
    const header = rows[headerRowIndex];
    const dateColumn = findColumn(header, (label) => label === "fecha");
    const totalColumn = findColumn(header, (label) => label === "total");
    const certificateColumn = findColumn(header, (label) => label.includes("certificados participacion"));
    const cpColumn = findColumn(header, (label) => label.includes("valor unitario"));
    const monthlyColumn = findColumn(header, (label) => label.includes("rentabilidad mensual"));
    const ytdColumn = findColumn(header, (label) => label.includes("rentabilidad acumulada por ano"));
    if ([dateColumn, totalColumn, certificateColumn, cpColumn, monthlyColumn, ytdColumn].some((column) => column < 0)) continue;

    const datedRows = [];
    for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
      const date = toDate(rows[rowIndex]?.[dateColumn], XLSX);
      if (!date) continue;
      datedRows.push({
        date,
        total: rows[rowIndex][totalColumn],
        certificates: rows[rowIndex][certificateColumn],
        cp: rows[rowIndex][cpColumn],
        monthly: rows[rowIndex][monthlyColumn],
        ytd: rows[rowIndex][ytdColumn],
        rowIndex,
      });
    }
    const reportRow = datedRows.find((row) => sameDate(row.date, summary.reportDate) && isNumber(row.total));
    if (!reportRow) continue;
    const tolerance = Math.max(1, Math.abs(summary.funds) * 0.000001);
    if (Math.abs(reportRow.total - summary.funds) > tolerance) continue;
    return { sheetName, rows, reportRow, datedRows, headerRowIndex };
  }
  throw new Error("No se encontró la serie de rentabilidad correspondiente al fondo Ganadero.");
}

function findExactDateRow(rows, XLSX, reportDate, preferredColumn = 0) {
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const preferred = toDate(rows[rowIndex]?.[preferredColumn], XLSX);
    if (sameDate(preferred, reportDate)) return rowIndex;
  }
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    if (rows[rowIndex].some((value) => sameDate(toDate(value, XLSX), reportDate))) return rowIndex;
  }
  return -1;
}

function parsePortfolio(XLSX, workbook, sheetName, reportDate) {
  if (!sheetName) throw new Error("No se encontró la hoja de composición del portfolio.");
  const rows = matrix(XLSX, workbook.Sheets[sheetName]);
  const headerRowIndex = findHeaderRow(rows, ["caja y bancos", "inversiones financieras", "hacienda bovina"]);
  if (headerRowIndex < 0) throw new Error("No se encontraron los encabezados del portfolio.");
  const header = rows[headerRowIndex];
  const reportRowIndex = findExactDateRow(rows, XLSX, reportDate, 0);
  if (reportRowIndex < 0) throw new Error("El portfolio no contiene el período del informe.");
  const output = {};
  for (let columnIndex = 0; columnIndex < header.length; columnIndex += 1) {
    const label = normalize(header[columnIndex]);
    if (label && isNumber(rows[reportRowIndex]?.[columnIndex])) output[label] = rows[reportRowIndex][columnIndex];
  }
  return { sheetName, rowIndex: reportRowIndex, values: output };
}

function parseEstablishments(XLSX, workbook, sheetName, reportDate, totalHeads) {
  if (!sheetName) throw new Error("No se encontró la hoja de establecimientos.");
  const sheet = workbook.Sheets[sheetName];
  const rows = matrix(XLSX, sheet);
  let dateColumn = -1;
  for (let rowIndex = 0; rowIndex < Math.min(rows.length, 12); rowIndex += 1) {
    const columnIndex = rows[rowIndex].findIndex((value) => sameDate(toDate(value, XLSX), reportDate));
    if (columnIndex >= 0) {
      dateColumn = columnIndex;
      break;
    }
  }
  if (dateColumn < 0) throw new Error("La hoja de establecimientos no contiene el período del informe.");

  const quantityRow = rows.findIndex((row) => normalize(row[0]).includes("cantidad de cabezas"));
  const subtotalRow = rows.findIndex((row, index) => index > quantityRow && normalize(row[0]) === "subtotal");
  if (quantityRow < 0 || subtotalRow < 0) throw new Error("No se pudo delimitar la lista de establecimientos.");
  const establishments = [];
  for (let rowIndex = quantityRow + 1; rowIndex < subtotalRow; rowIndex += 1) {
    const rawName = String(rows[rowIndex]?.[0] ?? "").trim();
    const stock = rows[rowIndex]?.[dateColumn];
    const normalizedName = normalize(rawName);
    if (
      !rawName
      || !isNumber(stock)
      || stock <= 0
      || normalizedName.includes("valuacion estimada")
      || normalizedName.includes("cuentas por pagar")
    ) continue;
    const delimiter = rawName.includes(" - ") ? " - " : rawName.includes("-") ? "-" : ",";
    const splitAt = rawName.indexOf(delimiter);
    const name = rawName.slice(0, splitAt).trim();
    const location = rawName.slice(splitAt + delimiter.length).trim().replace(/\.$/, "");
    establishments.push({ name, location, stock, row: rowIndex + 1 });
  }

  const valuationRow = rows.findIndex((row) => normalize(row[0]).includes("valuacion estimada a precio de mercado"));
  const maleRow = rows.findIndex((row) => normalize(row[0]) === "macho");
  const femaleRow = rows.findIndex((row) => normalize(row[0]) === "hembra");
  const valuation = getNumber(rows, valuationRow, dateColumn, "valuación de hacienda");
  const males = getNumber(rows, maleRow, dateColumn, "hacienda macho");
  const females = getNumber(rows, femaleRow, dateColumn, "hacienda hembra");
  if (Math.abs(males + females - totalHeads) > 0.001) {
    throw new Error(`La composición por sexo (${males + females}) no coincide con las cabezas totales (${totalHeads}).`);
  }
  return { sheetName, dateColumn, establishments, valuation, males, females };
}

function parseCategories(XLSX, workbook, sheetName, reportDate) {
  if (!sheetName) throw new Error("No se encontró la hoja de composición de hacienda.");
  const rows = matrix(XLSX, workbook.Sheets[sheetName]);
  const headerRowIndex = findHeaderRow(rows, ["terneros as", "vaquillonas", "novillos", "total"]);
  if (headerRowIndex < 0) throw new Error("No se encontraron los encabezados de composición de hacienda.");
  const header = rows[headerRowIndex];
  const reportRowIndex = findExactDateRow(rows, XLSX, reportDate, 6);
  if (reportRowIndex < 0) throw new Error("La composición de hacienda no contiene el período del informe.");
  const exactColumn = (term) => {
    const matches = [];
    header.forEach((value, index) => {
      if (normalize(value) === term) matches.push(index);
    });
    return matches.at(-1) ?? -1;
  };
  return {
    sheetName,
    rowIndex: reportRowIndex,
    calves: getNumber(rows, reportRowIndex, exactColumn("terneros as"), "terneros/as"),
    heifers: getNumber(rows, reportRowIndex, exactColumn("vaquillonas"), "vaquillonas"),
    steers: getNumber(rows, reportRowIndex, exactColumn("novillos"), "novillos"),
    feedlotHeifers: getNumber(rows, reportRowIndex, exactColumn("vaquillonas feedlot"), "vaquillonas feedlot"),
    feedlotSteers: getNumber(rows, reportRowIndex, exactColumn("novillos feedlot"), "novillos feedlot"),
    purchasesAtTerm: getNumber(rows, reportRowIndex, exactColumn("a termino"), "compras a término"),
    total: getNumber(rows, reportRowIndex, exactColumn("total"), "total de composición"),
  };
}

function parsePrices(XLSX, workbook, reportDate) {
  const sheetName = workbook.SheetNames.find((name) => normalize(name) === "precios");
  if (!sheetName) throw new Error("No se encontró la hoja de precios.");
  const rows = matrix(XLSX, workbook.Sheets[sheetName]);
  let dateRowIndex = -1;
  let dateColumn = -1;
  for (let rowIndex = 0; rowIndex < Math.min(rows.length, 15); rowIndex += 1) {
    const columnIndex = rows[rowIndex].findIndex((value) => sameDate(toDate(value, XLSX), reportDate));
    if (columnIndex >= 0) {
      dateRowIndex = rowIndex;
      dateColumn = columnIndex;
      break;
    }
  }
  if (dateColumn < 0) throw new Error("La hoja de precios no contiene el período del informe.");
  const marketRowIndex = rows.findIndex((row) => normalize(row[0]).includes("mercado de liniers"));
  const grainRowIndex = rows.findIndex((row) => normalize(row[0]) === "granos");
  if (marketRowIndex < 0 || grainRowIndex < 0) throw new Error("No se pudieron delimitar las secciones de precios.");

  const invernada = [];
  for (let rowIndex = dateRowIndex + 1; rowIndex < marketRowIndex; rowIndex += 1) {
    if (isNumber(rows[rowIndex]?.[dateColumn])) invernada.push(rows[rowIndex][dateColumn]);
  }
  const gordo = [];
  for (let rowIndex = marketRowIndex; rowIndex < grainRowIndex; rowIndex += 1) {
    if (isNumber(rows[rowIndex]?.[dateColumn])) gordo.push(rows[rowIndex][dateColumn]);
  }
  const grainTerms = ["precio maiz pizarra", "precio soja pizarra", "precio maiz futuro dic 26", "precio soja futuro dic 26"];
  const grains = grainTerms.map((term) => {
    const rowIndex = rows.findIndex((row) => normalize(row[1]) === term);
    return getNumber(rows, rowIndex, dateColumn, term);
  });
  return { sheetName, dateColumn, invernada, gordo, grains };
}

function previousQuarterEnd(reportDate) {
  const year = reportDate.getFullYear();
  const month = reportDate.getMonth();
  if (month <= 2) return new Date(year - 1, 11, 31);
  if (month <= 5) return new Date(year, 2, 31);
  if (month <= 8) return new Date(year, 5, 30);
  return new Date(year, 8, 30);
}

function publicationMonth(reportDate) {
  return new Date(reportDate.getFullYear(), reportDate.getMonth() + 1, 1);
}

function esInteger(value) {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(value));
}

function esDecimal(value, digits = 3) {
  return new Intl.NumberFormat("es-AR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

function esPercent(value) {
  return new Intl.NumberFormat("es-AR", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function esPercentInteger(value) {
  return new Intl.NumberFormat("es-AR", { style: "percent", maximumFractionDigits: 0 }).format(value);
}

function esMonthYear(date) {
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(date).toLowerCase().replace(" de ", " ");
}

function esLongDate(date, trailingPeriod = false) {
  const month = new Intl.DateTimeFormat("es-AR", { month: "long" }).format(date);
  const capitalized = month.charAt(0).toUpperCase() + month.slice(1);
  return `${date.getDate()} de ${capitalized} de ${date.getFullYear()}${trailingPeriod ? "." : ""}`;
}

function shortDate(date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

function endOfMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0);
}

function provinceValue(provinces, target) {
  const match = provinces.find((item) => normalize(item.name) === normalize(target));
  return match?.value ?? 0;
}

function canonicalProvinceName(value) {
  const names = {
    "bs as": "Buenos Aires",
    "s del estero": "Santiago del Estero",
    cordoba: "Córdoba",
    "entre rios": "Entre Ríos",
    "la pampa": "La Pampa",
    "san luis": "San Luis",
    "santa fe": "Santa Fe",
    corrientes: "Corrientes",
    salta: "Salta",
  };
  return names[normalize(value)] ?? String(value).trim();
}

function portfolioValue(portfolio, target) {
  const exact = portfolio.values[normalize(target)];
  if (isNumber(exact)) return exact;
  const key = Object.keys(portfolio.values).find((item) => item.includes(normalize(target)));
  return key ? portfolio.values[key] : 0;
}

function normalizeLocation(value) {
  return value
    .replace(/\bCordoba\b/g, "Córdoba")
    .replace(/\bJunin\b/g, "Junín");
}

function buildCanvaFields(data) {
  const { summary, rentability, portfolio, establishments, categories, prices, auditDate } = data;
  const reportDate = summary.reportDate;
  const publication = publicationMonth(reportDate);
  const auditNotes = [
    `1. Información auditada hasta el ${esLongDate(auditDate, true)}`,
    ...Array.from({ length: Math.max(0, reportDate.getFullYear() - 2021) }, (_, index) => `${index + 2}. Información al 31 de diciembre de ${2021 + index}.`),
  ];
  const fields = {
    fecha_informacion_portada: `Información al ${shortDate(reportDate)}`,
    fecha_corte_al: `Al ${shortDate(reportDate)}`,
    mes_publicacion: esMonthYear(publication),
    anio_informe: String(reportDate.getFullYear()),
    nota_auditoria_resumen: esLongDate(auditDate, true),
    nota_auditoria_rentabilidad: `${auditNotes.slice(0, 3).join(" | ")}\n${auditNotes.slice(3).join(" | ")}`,
    fondos_fideicomitidos: `$ ${esInteger(summary.funds)}`,
    valor_cp: esDecimal(summary.cp),
    rendimiento_mensual: esPercent(summary.monthlyReturn),
    rendimiento_anual: esPercent(summary.ytdReturn),
    total_cabezas: esInteger(summary.totalHeads),
    hacienda_santiago_del_estero: esInteger(provinceValue(summary.provinces, "S. del ESTERO")),
    hacienda_la_pampa: esInteger(provinceValue(summary.provinces, "LA PAMPA")),
    hacienda_entre_rios: esInteger(provinceValue(summary.provinces, "ENTRE RÍOS")),
    hacienda_cordoba: esInteger(provinceValue(summary.provinces, "CORDOBA")),
    hacienda_buenos_aires: esInteger(provinceValue(summary.provinces, "BS AS")),
  };

  const currentYearRows = new Map(
    rentability.datedRows
      .filter((row) => row.date.getFullYear() === reportDate.getFullYear())
      .map((row) => [row.date.getMonth(), row]),
  );
  for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
    const tag = MONTH_TAGS[monthIndex];
    const periodDate = endOfMonth(reportDate.getFullYear(), monthIndex);
    const row = currentYearRows.get(monthIndex);
    const isReported = periodDate.getTime() <= reportDate.getTime() && row && [row.total, row.certificates, row.cp, row.monthly].every(isNumber);
    fields[`tabla_${reportDate.getFullYear()}_${tag}_fecha`] = `${String(periodDate.getDate()).padStart(2, "0")} ${MONTH_LABELS[monthIndex]} ${reportDate.getFullYear()}`;
    fields[`tabla_${reportDate.getFullYear()}_${tag}_total`] = isReported ? `$ ${esInteger(row.total)}` : "";
    fields[`tabla_${reportDate.getFullYear()}_${tag}_certificados`] = isReported ? esInteger(row.certificates) : "";
    fields[`tabla_${reportDate.getFullYear()}_${tag}_valor_cp`] = isReported ? esDecimal(row.cp) : "";
    fields[`tabla_${reportDate.getFullYear()}_${tag}_variacion`] = isReported ? esPercent(row.monthly) : "";
  }

  fields.callout_fondos_vm = `$ ${esDecimal(summary.funds / 1_000_000, 1)}\nVM: ${esPercent(summary.monthlyReturn)}`;
  fields.portfolio_caja_bancos = esPercent(portfolioValue(portfolio, "Caja y Bancos"));
  fields.portfolio_inversiones = esPercent(portfolioValue(portfolio, "Inversiones financieras"));
  fields.portfolio_creditos_ventas = esPercent(portfolioValue(portfolio, "Créditos por ventas"));
  fields.portfolio_creditos_impositivos = esPercent(portfolioValue(portfolio, "Créditos impositivos, netos"));
  fields.portfolio_hacienda = esPercent(portfolioValue(portfolio, "Hacienda Bovina"));
  fields.portfolio_granos = esPercent(portfolioValue(portfolio, "Granos"));
  fields.portfolio_bienes_uso = esPercent(portfolioValue(portfolio, "Bienes de Uso"));
  fields.portfolio_activos_intangibles = esPercent(portfolioValue(portfolio, "Activos Intangibles"));
  fields.portfolio_cuentas_pagar = `(${esPercent(Math.abs(portfolioValue(portfolio, "Cuentas por Pagar")))})`;
  fields.portfolio_total = "100%";
  fields.machos_porcentaje = esPercentInteger(establishments.males / summary.totalHeads);
  fields.hembras_porcentaje = esPercentInteger(establishments.females / summary.totalHeads);
  fields.machos_cabezas = esInteger(establishments.males);
  fields.hembras_cabezas = esInteger(establishments.females);
  fields.categoria_terneros_as = esInteger(categories.calves);
  fields.categoria_vaquillonas = esInteger(categories.heifers);
  fields.categoria_novillos = esInteger(categories.steers);
  fields.categoria_vaquillonas_feedlot = esInteger(categories.feedlotHeifers);
  fields.categoria_novillos_feedlot = esInteger(categories.feedlotSteers);
  fields.categoria_compras_termino = esInteger(categories.purchasesAtTerm);
  fields.lista_establecimientos = establishments.establishments.map((item) => item.name).join("\n");
  fields.lista_ubicaciones = establishments.establishments.map((item) => normalizeLocation(item.location)).join("\n");
  fields.lista_stocks = establishments.establishments.map((item) => esInteger(item.stock)).join("\n");
  fields.compras_termino = esInteger(summary.purchasesAtTerm);
  fields.valuacion_mercado = `$ ${esInteger(establishments.valuation)}`;
  fields.precios_invernada = prices.invernada.map(esInteger).join("\n");
  fields.precios_gordo = prices.gordo.map(esInteger).join("\n");
  fields.precios_granos = prices.grains.map(esInteger).join("\n");

  fields.jun_total = fields[`tabla_${reportDate.getFullYear()}_jun_total`];
  for (let monthIndex = 7; monthIndex < 12; monthIndex += 1) {
    const tag = MONTH_TAGS[monthIndex];
    const sourcePrefix = `tabla_${reportDate.getFullYear()}_${tag}`;
    fields[`${tag}_total`] = fields[`${sourcePrefix}_total`] || "";
    fields[`${tag}_certificados`] = fields[`${sourcePrefix}_certificados`] || "";
    fields[`${tag}_valorcp`] = fields[`${sourcePrefix}_valor_cp`] || "";
    fields[`${tag}_var`] = fields[`${sourcePrefix}_variacion`] || "";
  }
  return fields;
}

function buildMail(data) {
  const { summary, auditDate } = data;
  const month = esMonthYear(summary.reportDate);
  const included = summary.provinces.filter((item) => item.value >= 1).map((item) => canonicalProvinceName(item.name));
  const provinceText = included.length <= 1
    ? included[0] ?? "sin provincias informadas"
    : `${included.slice(0, -1).join(", ")} y ${included[included.length - 1]}`;
  const subject = `Informe mensual de gestión | Fondo Ganadero | ${month}`;
  const body = [
    "Estimados:",
    "",
    `Adjuntamos el Informe Mensual de Gestión del Fondo Ganadero correspondiente a ${month}, con información auditada hasta el ${esLongDate(auditDate)}.`,
    "",
    "Algunos datos de interés del informe adjunto:",
    "",
    `- Fondos fideicomitidos: $ ${esInteger(summary.funds)}`,
    `- Valor unitario del CP: ${esDecimal(summary.cp)}`,
    `- Rendimiento mensual: ${esPercent(summary.monthlyReturn)}`,
    `- Rendimiento acumulado del año: ${esPercent(summary.ytdReturn)}`,
    `- Hacienda total: ${esInteger(summary.totalHeads)} cabezas. Incluye ${esInteger(summary.reportedPhysicalHeads)} cabezas físicas distribuidas en ${provinceText} y ${esInteger(summary.purchasesAtTerm)} compras a término.`,
    "",
    "Cualquier duda, pueden acercarnos sus comentarios.",
    "",
    "Saludos,",
    "El equipo de Gestión",
  ];
  return { subject, body };
}

function buildChecklist(data) {
  const { summary, rentability, portfolio, establishments, categories, prices, auditDate } = data;
  const difference = Math.abs(summary.physicalHeads - summary.reportedPhysicalHeads);
  const totalDifference = Math.abs(summary.reportedPhysicalHeads + summary.purchasesAtTerm - summary.totalHeads);
  const checks = [
    ["C01", "MASTER legible", "OK", `Se abrió el archivo y se detectó ${summary.sheetName}.`],
    ["C02", "Período identificado", "OK", `${dateKey(summary.reportDate)} detectado sin usar el nombre del archivo.`],
    ["C03", "Fondo Ganadero identificado", "OK", `Fila semántica ${summary.fundRowIndex + 1}.`],
    ["C04", "Indicadores financieros completos", "OK", "Fondos, CP y rendimientos son numéricos."],
    ["C05", "Total provincial reconciliado", difference <= 0.001 ? "OK" : "ERROR", `${summary.sourceCells.provinceRange} suma ${summary.physicalHeads}; total informado ${summary.reportedPhysicalHeads}.`],
    ["C06", "Cabezas físicas más compras a término", totalDifference <= 0.001 ? "OK" : "ERROR", `${summary.reportedPhysicalHeads} + ${summary.purchasesAtTerm} = ${summary.totalHeads}.`],
    ["C07", "Serie mensual disponible", rentability.reportRow ? "OK" : "ERROR", `${rentability.sheetName}, fila ${rentability.reportRow.rowIndex + 1}.`],
    ["C08", "Portfolio disponible", portfolio ? "OK" : "ERROR", `${portfolio.sheetName}, fila ${portfolio.rowIndex + 1}.`],
    ["C09", "Hacienda y establecimientos conciliados", categories.total === summary.totalHeads ? "OK" : "ERROR", `${establishments.establishments.length} establecimientos; ${categories.total} cabezas por categoría.`],
    ["C10", "Precios del período disponibles", prices.invernada.length === 11 && prices.gordo.length === 5 && prices.grains.length === 4 ? "OK" : "ERROR", `${prices.invernada.length} precios de invernada, ${prices.gordo.length} de gordo y ${prices.grains.length} de granos.`],
    ["C11", "Fecha de auditoría y formato Canva", auditDate <= summary.reportDate ? "OK" : "ERROR", `Auditoría ${dateKey(auditDate)}; salida plana de una fila.`],
  ];
  return checks.map(([id, control, status, evidence]) => ({
    id,
    control,
    estado: status,
    evidencia: evidence,
    accion: status === "OK" ? "Sin acción." : "Cati debe contrastar el dato con el MASTER antes de continuar.",
  }));
}

export function parseGanaderoWorkbook(XLSX, fileName, input, options = {}) {
  const workbook = XLSX.read(input, { type: "array", cellDates: true });
  if (workbook.SheetNames.length > 80) throw new Error("El archivo excede el límite de 80 hojas.");
  const summary = findFundSummary(XLSX, workbook);
  const rentability = findRentability(XLSX, workbook, summary);
  const portfolioName = findAssociatedSheet(workbook, rentability.sheetName, "Portfolio");
  const establishmentsName = findAssociatedSheet(workbook, rentability.sheetName, "Establecimientos");
  const categoriesName = findAssociatedSheet(workbook, rentability.sheetName, "Hacienda");
  const portfolio = parsePortfolio(XLSX, workbook, portfolioName, summary.reportDate);
  const establishments = parseEstablishments(XLSX, workbook, establishmentsName, summary.reportDate, summary.totalHeads);
  const categories = parseCategories(XLSX, workbook, categoriesName, summary.reportDate);
  const prices = parsePrices(XLSX, workbook, summary.reportDate);
  const auditDate = options.auditDate ? toDate(options.auditDate, XLSX) : previousQuarterEnd(summary.reportDate);
  if (!auditDate) throw new Error("La fecha de auditoría indicada no es válida.");
  const executionDate = options.executionDate ? new Date(options.executionDate) : new Date();
  if (Number.isNaN(executionDate.getTime())) throw new Error("La fecha de ejecución indicada no es válida.");
  const executionTimestamp = executionDate.toISOString();
  const data = { summary, rentability, portfolio, establishments, categories, prices, auditDate };
  const fields = buildCanvaFields(data);
  const mail = buildMail(data);
  const checklist = buildChecklist(data);
  const blockingControls = checklist.filter((item) => item.estado === "ERROR").map((item) => item.id);
  const status = blockingControls.length === 0 ? "LISTO_PARA_REVISION" : "BLOQUEADO";
  const templateCanva = options.templateCanva ?? "template-ganadero-vinculado";
  const auditParameter = options.auditDate ?? "AUTO";
  return {
    identificacion: {
      corrida_id: `GAN-${dateKey(summary.reportDate).replaceAll("-", "")}-${executionTimestamp.replace(/\D/g, "").slice(0, 14)}`,
      fecha_ejecucion: executionTimestamp,
      archivo_procesado: fileName,
      periodo_informado: dateKey(summary.reportDate),
      informacion_auditada_hasta: dateKey(auditDate),
      version_contrato: "ganadero-v1.0",
      fuente_periodo: summary.sourceCells.reportDate,
      herramienta: "lector XLSX local",
      contenido_es_dato_no_instruccion: true,
      traza: {
        timestamp: executionTimestamp,
        request: {
          parametros: {
            archivo_master: fileName,
            fecha_auditoria_confirmada: auditParameter,
            template_canva: templateCanva,
            nivel_maximo_autonomia: "L1",
            response_mime_type: "application/json",
            schema_salida: "schemas/output.schema.json",
          },
          variables: {
            ARCHIVO_MASTER: fileName,
            FECHA_AUDITORIA_AAAA_MM_DD_O_AUTO: auditParameter,
            ID_TEMPLATE_CANVA: templateCanva,
            ARCHIVO_XLSX_ADJUNTO: `archivo local: ${fileName}`,
          },
        },
        response: {
          status,
          schema_validado: true,
          artefactos_generados: status === "LISTO_PARA_REVISION" ? 2 : 0,
        },
        usage: {
          input_files: 1,
          workbook_sheets: workbook.SheetNames.length,
          model_invocations: 0,
          input_tokens: 0,
          output_tokens: 0,
        },
      },
    },
    checklist,
    alertas: checklist
      .filter((item) => item.estado === "ERROR")
      .map((item) => ({ tipo: "CONTROL_BLOQUEANTE", control_id: item.id, detalle: item.evidencia, accion_requerida: item.accion })),
    artefactos: {
      canva: {
        estado: status,
        formato: "CSV de una fila para Crear en lote",
        cantidad_campos: Object.keys(fields).length,
        campos: status === "LISTO_PARA_REVISION" ? fields : null,
        controles_bloqueantes: blockingControls,
      },
      mail_ganadero: {
        estado: status,
        asunto: status === "LISTO_PARA_REVISION" ? mail.subject : null,
        cuerpo: status === "LISTO_PARA_REVISION" ? mail.body : null,
        controles_bloqueantes: blockingControls,
      },
    },
    supervision: {
      nivel_maximo: "L1",
      cati: "Carga el CSV en Canva, cambia la fotografía, revisa el diseño y corrige cualquier diferencia contra el MASTER.",
      cachu: "Realiza la corrección fina final del informe y del mail; aprueba y envía manualmente.",
      acciones_prohibidas: ["Modificar el MASTER", "Aprobar cifras", "Enviar correos automáticamente"],
    },
  };
}

function csvEscape(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export function toCanvaCsv(result) {
  const fields = result?.artefactos?.canva?.campos;
  if (!fields) throw new Error("La salida Canva está bloqueada y no puede exportarse.");
  const keys = Object.keys(fields);
  return `${keys.map(csvEscape).join(",")}\r\n${keys.map((key) => csvEscape(fields[key])).join(",")}\r\n`;
}

export function mailAsText(result) {
  const mail = result?.artefactos?.mail_ganadero;
  if (!mail?.asunto || !mail?.cuerpo) throw new Error("El mail está bloqueado y no puede exportarse.");
  return `Asunto: ${mail.asunto}\n\n${mail.cuerpo.join("\n")}\n`;
}
