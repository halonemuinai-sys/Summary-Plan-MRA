import { BrandRowData } from './types';

/** Years shown in the Brand Revenue Matrix */
export const BRAND_YEARS = ['2026', '2027', '2028', '2029', '2030', '2031'];

/** One edited brand cell. `value` is in IDR Billion when unit is 'bn' and in whole rupiah when unit is 'idr'. */
export interface BrandEdit {
  id: string;
  year: string;
  value: number;
  unit: 'bn' | 'idr';
}

// Brand rows the user types into. The two "New Business" headings and the TOTAL are not inputs.
const INPUT_CATEGORIES: BrandRowData['category'][] = ['existing', 'acquisition', 'fnb_new', 'retail_new'];
const HEADING_CATEGORIES: BrandRowData['category'][] = ['header_fnb', 'header_retail'];

export const isBrandInputRow = (row: BrandRowData) => INPUT_CATEGORIES.includes(row.category);
export const isBrandHeadingRow = (row: BrandRowData) => HEADING_CATEGORIES.includes(row.category);

const round1 = (n: number) => Math.round(n * 10) / 10;
const round4 = (n: number) => Math.round(n * 1e4) / 1e4;

/**
 * Year-on-year growth in %, or null when there is no base to compare with.
 * It is worked out from full rupiah: the stored IDR Billion figures are rounded to 2 decimals and give
 * noticeably different percentages for small brands (Jamba Juice 2027: 3,281% vs 3,255.9%).
 */
export function yoyGrowth(currentIdr: number, previousIdr: number): number | null {
  return previousIdr > 0 ? round1(((currentIdr - previousIdr) / previousIdr) * 100) : null;
}

function growthByYear(row: BrandRowData, years: string[]): Record<string, number | null> {
  const growth: Record<string, number | null> = {};
  for (let i = 1; i < years.length; i++) {
    growth[years[i]] = yoyGrowth(row.valuesIdr[years[i]] ?? 0, row.valuesIdr[years[i - 1]] ?? 0);
  }
  return growth;
}

const sameGrowth = (stored: BrandRowData['growthPct'], computed: Record<string, number | null>, years: string[]) =>
  years.slice(1).every((year) => (stored?.[year] ?? null) === computed[year]);

/**
 * Applies edits made in the Brand Revenue Matrix. The TOTAL moves by exactly the change that was made, so it
 * stays the exact sum of the brands (and matches the workbook) instead of being re-added from rounded figures.
 * Returns the same array when nothing effectively changed.
 */
export function applyBrandEdits(brands: BrandRowData[], edits: BrandEdit[], years: string[] = BRAND_YEARS): BrandRowData[] {
  const next = [...brands];
  const rowIndex = new Map(brands.map((row, index) => [row.id, index]));
  const totalIndex = brands.findIndex((row) => row.category === 'total');
  const cloned = new Set<number>();
  let changed = false;

  // Rows are copied the first time they are touched; untouched rows keep their identity
  const withOwnValues = (index: number) => {
    if (!cloned.has(index)) {
      next[index] = { ...next[index], valuesBn: { ...next[index].valuesBn }, valuesIdr: { ...next[index].valuesIdr } };
      cloned.add(index);
    }
    return next[index];
  };

  for (const edit of edits) {
    const index = rowIndex.get(edit.id);
    if (index === undefined || !years.includes(edit.year) || !Number.isFinite(edit.value)) continue;
    if (!isBrandInputRow(brands[index])) continue;

    const current = next[index];
    const before = current.valuesIdr[edit.year] ?? (current.valuesBn[edit.year] ?? 0) * 1e9;
    const after = Math.round(edit.unit === 'idr' ? edit.value : edit.value * 1e9);
    const delta = after - before;
    // Less than one rupiah is display rounding (the cell shows whole rupiah), not an edit
    if (Math.abs(delta) < 0.5) continue;

    const row = withOwnValues(index);
    row.valuesIdr[edit.year] = after;
    row.valuesBn[edit.year] = round4(after / 1e9);

    if (totalIndex >= 0) {
      const total = withOwnValues(totalIndex);
      total.valuesIdr[edit.year] = (total.valuesIdr[edit.year] ?? 0) + delta;
      total.valuesBn[edit.year] = round4(total.valuesIdr[edit.year] / 1e9);
    }
    changed = true;
  }

  if (!changed) return brands;

  // Growth follows from the rupiah figures. It is filled in for every row, so the presentation deck stays
  // complete; rows whose growth did not change keep their identity (and their values object).
  return next.map((row) => {
    if (isBrandHeadingRow(row)) return row;
    const growth = growthByYear(row, years);
    return sameGrowth(row.growthPct, growth, years) ? row : { ...row, growthPct: growth };
  });
}
