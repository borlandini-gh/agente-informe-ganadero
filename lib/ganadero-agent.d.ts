export const SHEET_READ_LIMITS: Readonly<{
  maxRows: number;
  maxColumns: number;
}>;

export function boundedSheetRange(
  xlsx: unknown,
  sheet: unknown,
): { s: { r: number; c: number }; e: { r: number; c: number } } | undefined;

export function parseGanaderoWorkbook(
  xlsx: unknown,
  fileName: string,
  input: ArrayBuffer | Uint8Array,
  options?: { auditDate?: string; executionDate?: string; templateCanva?: string },
): unknown;

export function toCanvaCsv(result: unknown): string;
export function mailAsText(result: unknown): string;
