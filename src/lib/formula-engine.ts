import { FinancialRowData, ChartDataPoint } from './types';

type Items = Record<string, FinancialRowData>;

/** One edited input cell, e.g. { key: 'personnel', year: '2027', value: 120.5 } */
export interface CellEdit {
  key: string;
  year: string;
  value: number;
}

const round4 = (n: number) => Math.round(n * 1e4) / 1e4;
const round2 = (n: number) => Math.round(n * 1e2) / 1e2;
const valueAt = (items: Items, key: string, year: string) => items[key]?.values[year] ?? 0;

/** What is left of a stored total once the stored lines under it are taken out (ignores rounding noise) */
const remainder = (total: number, parts: number[]) => {
  const diff = round4(total - parts.reduce((sum, part) => sum + part, 0));
  return Math.abs(diff) < 0.015 ? 0 : diff;
};

/**
 * Lines that the workbook adds into a total but that are not stored as their own row.
 * Their value is the leftover of the stored total, so they stay put unless the user edits them.
 */
const VIRTUAL_ROWS: Record<string, { requires: string[]; value: (items: Items, year: string) => number }> = {
  // TOTAL REVENUE also includes Retail-NEW, F&B-NEW and newly acquired brands (workbook rows 14-16)
  rev_new_business: {
    requires: ['total_revenue'],
    value: (items, year) =>
      remainder(valueAt(items, 'total_revenue', year), [
        valueAt(items, 'rev_publisher', year),
        valueAt(items, 'rev_retail', year),
        valueAt(items, 'rev_fnb', year),
      ]),
  },
  // Same for COGS (workbook rows 23-25)
  cogs_new_business: {
    requires: ['cogs'],
    value: (items, year) =>
      remainder(valueAt(items, 'cogs', year), [
        valueAt(items, 'cogs_publisher', year),
        valueAt(items, 'cogs_retail', year),
        valueAt(items, 'cogs_fnb', year),
      ]),
  },
  // NPAT = NPBT - tax - subholding/holding cost + share of associates (workbook row 65)
  holding_assoc_net: {
    requires: ['npbt', 'npat'],
    value: (items, year) =>
      round4(valueAt(items, 'npbt', year) - valueAt(items, 'income_tax', year) - valueAt(items, 'npat', year)),
  },
};

// How much each calculated row moves when an input row goes up by 1. This mirrors the formulas in
// workbook sheet "PL MRA Group+Holding (Combine)". Rows not stored here (subholding costs, associates,
// other P&L lines) keep their value, which is why edits are applied as changes and not recomputed from scratch.
const REVENUE_CHAIN = {
  total_revenue: 1,
  gross_profit: 1,
  operating_profit: 1,
  npbt: 1,
  npat: 1,
  ebitda_after_holding: 1,
  ebitda_before_holding: 1,
};
const COGS_CHAIN = {
  cogs: 1,
  gross_profit: -1,
  operating_profit: -1,
  npbt: -1,
  npat: -1,
  ebitda_after_holding: -1,
  ebitda_before_holding: -1,
};
const OPEX_CHAIN = {
  total_opex: 1,
  operating_profit: -1,
  npbt: -1,
  npat: -1,
  ebitda_after_holding: -1,
  ebitda_before_holding: -1,
};

const INPUT_EFFECTS: Record<string, Record<string, number>> = {
  rev_publisher: REVENUE_CHAIN,
  rev_retail: REVENUE_CHAIN,
  rev_fnb: REVENUE_CHAIN,
  rev_new_business: REVENUE_CHAIN,
  cogs_publisher: COGS_CHAIN,
  cogs_retail: COGS_CHAIN,
  cogs_fnb: COGS_CHAIN,
  cogs_new_business: COGS_CHAIN,
  personnel: OPEX_CHAIN,
  marketing: OPEX_CHAIN,
  ga_expenses: OPEX_CHAIN,
  // Constant expenses are depreciation & amortization: EBITDA adds them back, so EBITDA does not move
  constant_expenses: { total_opex: 1, depr_amort: 1, operating_profit: -1, npbt: -1, npat: -1 },
  other_expenses: { npbt: -1, npat: -1, ebitda_after_holding: -1, ebitda_before_holding: -1 },
  // Interest is part of other expenses, but EBITDA adds it back
  interest_expense: { other_expenses: 1, npbt: -1, npat: -1 },
  // Tax is added back in EBITDA too
  income_tax: { npat: -1 },
};

/** True for rows the user can type into; every other row is calculated */
export const isInputRow = (key: string) => key in INPUT_EFFECTS;

/** Whether the dataset has what this row needs (stored rows: the row itself; virtual rows: their parents) */
export function hasRow(items: Items, key: string): boolean {
  const virtual = VIRTUAL_ROWS[key];
  return virtual ? virtual.requires.every((required) => required in items) : key in items;
}

/** Value of a row for one year, including the virtual rows that are not stored */
export function getRowValue(items: Items, key: string, year: string): number {
  const virtual = VIRTUAL_ROWS[key];
  return virtual ? virtual.value(items, year) : valueAt(items, key, year);
}

/**
 * Applies edits made in the Admin Grid and updates every calculated row they affect.
 * Returns the same object when nothing effectively changed, so callers can skip saving/re-rendering.
 */
export function applyInputEdits(items: Items, edits: CellEdit[]): Items {
  const next: Items = { ...items };
  const cloned = new Set<string>();
  const touchedYears = new Set<string>();
  let changed = false;

  const write = (key: string, year: string, value: number) => {
    if (!next[key]) return;
    if (!cloned.has(key)) {
      next[key] = { ...next[key], values: { ...next[key].values } };
      cloned.add(key);
    }
    next[key].values[year] = round4(value);
  };

  for (const { key, year, value } of edits) {
    const effects = INPUT_EFFECTS[key];
    if (!effects || !Number.isFinite(value) || !hasRow(next, key)) continue;

    const delta = value - getRowValue(next, key, year);
    if (Math.abs(delta) < 1e-9) continue;

    // Virtual rows have nothing to store: they only move the totals they belong to
    if (!(key in VIRTUAL_ROWS)) write(key, year, value);
    for (const [target, weight] of Object.entries(effects)) {
      write(target, year, valueAt(next, target, year) + weight * delta);
    }
    touchedYears.add(year);
    changed = true;
  }

  if (!changed) return items;

  touchedYears.forEach((year) => {
    const revenue = valueAt(next, 'total_revenue', year);
    const percentOfRevenue = (amount: number) => (revenue > 0 ? round2((amount / revenue) * 100) : 0);
    write('gp_margin', year, percentOfRevenue(valueAt(next, 'gross_profit', year)));
    write('opex_margin', year, percentOfRevenue(valueAt(next, 'total_opex', year)));
  });

  return next;
}

/**
 * Transforms raw item rows into unified format for Recharts presentation charts
 */
export function buildChartData(
  items: Record<string, FinancialRowData>,
  years: string[]
): ChartDataPoint[] {
  return years.map((year) => {
    const revenue = items['total_revenue']?.values[year] ?? 0;
    const cogs = items['cogs']?.values[year] ?? 0;
    const grossProfit = items['gross_profit']?.values[year] ?? (revenue - cogs);
    const gpMargin = revenue > 0 ? Number(((grossProfit / revenue) * 100).toFixed(1)) : 0;
    const opex = items['total_opex']?.values[year] ?? 0;
    const ebitda = items['ebitda_after_holding']?.values[year] ?? 0;
    const ebitdaMargin = revenue > 0 ? Number(((ebitda / revenue) * 100).toFixed(1)) : 0;
    const npat = items['npat']?.values[year] ?? 0;
    const npatMargin = revenue > 0 ? Number(((npat / revenue) * 100).toFixed(1)) : 0;

    return {
      year,
      revenue,
      cogs,
      grossProfit,
      gpMargin,
      opex,
      ebitda,
      ebitdaMargin,
      npat,
      npatMargin
    };
  });
}
