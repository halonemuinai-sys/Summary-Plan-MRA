import { FinancialRowData } from './types';
import { getRowValue, hasRow, isInputRow } from './formula-engine';
import { GrowthField, YearField, growthField, yearField } from './grid-fields';

export type GridRowStyle = 'line' | 'total' | 'ratio';

export type GridRow = {
  key: string;
  label: string;
  hint?: string;
  section: boolean;
  style: GridRowStyle;
  /** The few rows the deck is built on: shown larger, with their growth over the previous year */
  headline: boolean;
  indent: 0 | 1;
  unit: 'bn' | 'pct';
  editable: boolean;
} & { [year in YearField]?: number } & { [field in GrowthField]?: number | null };

interface LayoutSection {
  section: string;
}

interface LayoutLine {
  key: string;
  label: string;
  style?: GridRowStyle;
  headline?: boolean;
  indent?: 0 | 1;
  unit?: 'bn' | 'pct';
  hint?: string;
}

/**
 * Growth over the previous calendar year, in %, or null when there is nothing to compare with.
 * The year before the first one on screen is still in the data, so 2024 has a figure too.
 */
function yearOnYear(items: Record<string, FinancialRowData>, key: string, year: string): number | null {
  const values = items[key]?.values;
  const previousYear = String(Number(year) - 1);
  if (!values || !(previousYear in values)) return null;
  const previous = values[previousYear];
  if (!(previous > 0)) return null;
  return Math.round((((values[year] ?? 0) - previous) / previous) * 1000) / 10;
}

/**
 * Display order of the P&L, top to bottom. Rows are stored in a PostgreSQL JSONB column, which does not
 * keep key order, so the grid must never rely on the order of `items`.
 * Which rows are editable comes from the formula engine (isInputRow), not from here.
 */
const LAYOUT: Array<LayoutSection | LayoutLine> = [
  { section: 'Revenue' },
  { key: 'rev_publisher', label: 'Publisher Media', indent: 1 },
  { key: 'rev_retail', label: 'Retail', indent: 1 },
  { key: 'rev_fnb', label: 'Food & Beverages', indent: 1 },
  {
    key: 'rev_new_business',
    label: 'New Business & Acquisitions',
    indent: 1,
    hint: 'Retail-NEW, F&B-NEW and newly acquired brands (see Brand Revenue Matrix). Shown as Total Revenue minus the three divisions above; editing it changes Total Revenue.',
  },
  {
    key: 'total_revenue',
    label: 'TOTAL REVENUE (NET)',
    style: 'total',
    headline: true,
    hint: 'Calculated automatically: sum of the four revenue lines above.',
  },

  { section: 'Cost of Goods Sold' },
  { key: 'cogs_publisher', label: 'Publisher Media', indent: 1 },
  { key: 'cogs_retail', label: 'Retail', indent: 1 },
  { key: 'cogs_fnb', label: 'Food & Beverages', indent: 1 },
  {
    key: 'cogs_new_business',
    label: 'New Business & Acquisitions',
    indent: 1,
    hint: 'COGS of Retail-NEW, F&B-NEW and newly acquired brands. Shown as Total COGS minus the three divisions above; editing it changes Total COGS.',
  },
  {
    key: 'cogs',
    label: 'TOTAL COGS',
    style: 'total',
    hint: 'Calculated automatically: sum of the four COGS lines above.',
  },
  {
    key: 'gross_profit',
    label: 'GROSS PROFIT',
    style: 'total',
    headline: true,
    hint: 'Calculated automatically: Total Revenue minus Total COGS.',
  },
  { key: 'gp_margin', label: 'GP %', style: 'ratio', unit: 'pct', hint: 'Gross Profit divided by Total Revenue.' },

  { section: 'Operating Expenses' },
  { key: 'personnel', label: 'Personnel Expenses', indent: 1 },
  { key: 'marketing', label: 'Marketing Expense', indent: 1 },
  { key: 'ga_expenses', label: 'General & Administrative Expenses', indent: 1 },
  {
    key: 'constant_expenses',
    label: 'Constant Expenses (Depr & Amort)',
    indent: 1,
    hint: 'Non-cash depreciation and amortization. It is added back when calculating EBITDA.',
  },
  {
    key: 'total_opex',
    label: 'TOTAL OPERATING EXPENSES',
    style: 'total',
    hint: 'Calculated automatically: Personnel + Marketing + G&A + Constant Expenses.',
  },
  { key: 'opex_margin', label: 'OPEX %', style: 'ratio', unit: 'pct', hint: 'Total Operating Expenses divided by Total Revenue.' },
  {
    key: 'operating_profit',
    label: 'OPERATING PROFIT (EBIT)',
    style: 'total',
    headline: true,
    hint: 'Calculated automatically: Gross Profit minus Total Operating Expenses.',
  },

  { section: 'Other Expenses, Tax & Net Profit' },
  {
    key: 'other_expenses',
    label: 'Other Expenses / (Income), net',
    hint: 'Franchise & royalties, forex, interest and other items, net. Negative means income.',
  },
  {
    key: 'interest_expense',
    label: 'of which: Interest Expense',
    indent: 1,
    hint: 'Already part of Other Expenses above. Added back when calculating EBITDA.',
  },
  {
    key: 'npbt',
    label: 'NET PROFIT BEFORE TAX',
    style: 'total',
    hint: 'Calculated automatically: Operating Profit minus Other Expenses.',
  },
  {
    key: 'income_tax',
    label: 'Provision for Income Tax',
    hint: 'Typed in by hand. It does not change on its own when profit changes.',
  },
  {
    key: 'holding_assoc_net',
    label: 'Less: Holding Costs & Associates (net)',
    hint: 'Subholding/holding cost less profit from associates, kept as in the workbook. Not editable here.',
  },
  {
    key: 'npat',
    label: 'NET PROFIT AFTER TAX',
    style: 'total',
    headline: true,
    hint: 'Calculated automatically: Profit Before Tax minus Tax minus Holding Costs & Associates.',
  },

  { section: 'EBITDA' },
  {
    key: 'depr_amort',
    label: 'Depreciation & Amortization',
    hint: 'Same figure as Constant Expenses above; edit it there.',
  },
  {
    key: 'ebitda_after_holding',
    label: 'EBITDA AFTER HOLDING COST',
    style: 'total',
    headline: true,
    hint: 'Calculated automatically. Follows changes in revenue, COGS and operating expenses; depreciation, interest and tax are added back.',
  },
  {
    key: 'ebitda_before_holding',
    label: 'EBITDA BEFORE HOLDING COST',
    style: 'total',
    hint: 'Calculated automatically: EBITDA after holding cost plus the holding cost.',
  },
];

const LAYOUT_KEYS = new Set(LAYOUT.flatMap((entry) => ('key' in entry ? [entry.key] : [])));

/** Turns the stored P&L rows into the rows shown in the grid, in P&L order with section headings */
export function buildGridRows(items: Record<string, FinancialRowData>, years: string[]): GridRow[] {
  const rows: GridRow[] = [];

  const sectionRow = (label: string): GridRow => ({
    key: `section:${label}`,
    label,
    section: true,
    style: 'line',
    headline: false,
    indent: 0,
    unit: 'bn',
    editable: false,
  });

  const lineRow = (line: LayoutLine): GridRow => {
    const row: GridRow = {
      key: line.key,
      label: line.label,
      hint: line.hint,
      section: false,
      style: line.style ?? 'line',
      headline: line.headline ?? false,
      indent: line.indent ?? 0,
      unit: line.unit ?? 'bn',
      editable: isInputRow(line.key),
    };
    for (const year of years) {
      row[yearField(year)] = getRowValue(items, line.key, year);
      if (row.headline) row[growthField(year)] = yearOnYear(items, line.key, year);
    }
    return row;
  };

  for (const entry of LAYOUT) {
    if ('section' in entry) {
      rows.push(sectionRow(entry.section));
    } else if (hasRow(items, entry.key)) {
      rows.push(lineRow(entry));
    }
  }

  // Rows that exist in the data but not in the layout still show up, read-only, so nothing is hidden
  const extras = Object.keys(items).filter((key) => !LAYOUT_KEYS.has(key));
  if (extras.length > 0) {
    rows.push(sectionRow('Other Lines'));
    for (const key of extras) {
      rows.push(lineRow({ key, label: items[key].description || key, hint: 'Not part of the P&L model, read only.' }));
    }
  }

  // Drop headings that ended up with no rows under them
  return rows.filter((row, index) => !row.section || (rows[index + 1] && !rows[index + 1].section));
}
