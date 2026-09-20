/**
 * Number display and parsing for the P&L grid and the Brand Revenue Matrix.
 * Display follows the browser locale (like the rest of the admin UI), except full-rupiah figures, which
 * always use Indonesian grouping as elsewhere in the app. The parser also accepts the other convention,
 * so figures pasted from Excel work with either "1,234.56" or "1.234,56".
 */

const bnFormat = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pctFormat = new Intl.NumberFormat(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const editFormat = new Intl.NumberFormat(undefined, { useGrouping: false, maximumFractionDigits: 4 });
const rupiahFormat = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

const LOCALE_DECIMAL =
  new Intl.NumberFormat(undefined).formatToParts(1.1).find((part) => part.type === 'decimal')?.value ?? '.';

/** IDR Billion figure as shown in a cell: 1,234.56 / (12.30) for negatives / – for zero */
export function formatBn(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  if (Math.abs(value) < 0.005) return '–';
  const text = bnFormat.format(Math.abs(value));
  return value < 0 ? `(${text})` : text;
}

export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  return `${pctFormat.format(value)}%`;
}

/** Year-on-year growth as shown in a cell: +20.0% / -100.0% / – when there is no previous year to compare with */
export function formatGrowth(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '–';
  return `${value > 0 ? '+' : ''}${pctFormat.format(value)}%`;
}

/** Plain figure shown while a cell is being edited, and put on the clipboard when copying */
export function formatForEdit(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  return value === 0 ? '0' : editFormat.format(value);
}

/** Full-rupiah figure as shown in a cell: 312.195.489.682 / – for zero */
export function formatRupiah(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  if (Math.abs(value) < 0.5) return '–';
  const text = rupiahFormat.format(Math.abs(Math.round(value)));
  return value < 0 ? `(${text})` : text;
}

/** Whole rupiah without any separators, shown while editing and put on the clipboard: 312195489682 */
export function formatRupiahForEdit(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  return String(Math.round(value));
}

/**
 * Turns what the user typed or pasted into a number.
 * Empty input means 0 (clearing a cell); text that is not a number returns null so the edit is ignored.
 * For whole-number amounts (rupiah) a single mark followed by exactly 3 digits is always thousands grouping.
 */
export function parseNumberInput(raw: string, options: { wholeNumber?: boolean } = {}): number | null {
  let text = raw.replace(/[\s ]/g, '').replace(/^Rp\.?/i, '').replace(/%$/, '');
  if (text === '') return 0;

  let negative = false;
  if (/^\(.*\)$/.test(text)) {
    negative = true;
    text = text.slice(1, -1);
  }
  if (text.startsWith('-') || text.startsWith('−')) {
    negative = true;
    text = text.slice(1);
  } else if (text.startsWith('+')) {
    text = text.slice(1);
  }
  if (!/^[\d.,]+$/.test(text) || !/\d/.test(text)) return null;

  const lastDot = text.lastIndexOf('.');
  const lastComma = text.lastIndexOf(',');
  let decimal: '.' | ',' | null = null;

  if (lastDot >= 0 && lastComma >= 0) {
    // Both present: whichever comes last is the decimal mark
    decimal = lastDot > lastComma ? '.' : ',';
  } else if (lastDot >= 0 || lastComma >= 0) {
    const mark = lastDot >= 0 ? '.' : ',';
    const parts = text.split(mark);
    // Thousands grouping looks like 1.234 or 12.345.678: 1-3 leading digits (not 0), then groups of exactly 3
    const isGroupingShape = /^[1-9]\d{0,2}$/.test(parts[0]) && parts.slice(1).every((part) => part.length === 3);
    if (parts.length > 2) {
      if (!isGroupingShape) return null;
      decimal = null;
    } else {
      // A single mark is only read as grouping when the browser locale uses the other mark for decimals
      // (or when the amount is known to be a whole number)
      decimal = isGroupingShape && (options.wholeNumber || mark !== LOCALE_DECIMAL) ? null : mark;
    }
  }

  const normalized = decimal
    ? text.replace(decimal === '.' ? /,/g : /\./g, '').replace(decimal, '.')
    : text.replace(/[.,]/g, '');
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}
