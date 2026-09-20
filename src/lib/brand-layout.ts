import { BrandRowData } from './types';
import { isBrandHeadingRow, yoyGrowth } from './brand-engine';
import { GrowthField, YearField, growthField, yearField } from './grid-fields';

/** What the matrix shows: IDR Billion, full rupiah (both editable) or year-on-year growth (view only) */
export type BrandGridMode = 'bn' | 'full' | 'growth';

/** Coloured tag after a brand name, as in the original matrix */
export interface BrandBadge {
  label: string;
  tone: 'core' | 'fnb' | 'retail';
}

export type BrandGridRow = {
  key: string;
  label: string;
  hint?: string;
  section: boolean;
  total: boolean;
  badge?: BrandBadge;
  indent: 0 | 1;
  editable: boolean;
} & { [field in YearField]?: number } & { [field in GrowthField]?: number | null };

const CATEGORY_BADGE: Partial<Record<BrandRowData['category'], BrandBadge>> = {
  existing: { label: 'Core', tone: 'core' },
  fnb_new: { label: 'New F&B', tone: 'fnb' },
  retail_new: { label: 'New Retail', tone: 'retail' },
};

// The six existing brands make up the P&L division lines: Retail = Bulgari + Omega + L'OREAL + Wiggle Wiggle,
// F&B = Haagendazs, Media = MRA Media - Publisher. Checked against the division rows of the P&L for 2026-2031.
const EXISTING_BRAND_DIVISION: Record<string, string> = {
  brand_97: 'Retail',
  brand_98: 'Retail',
  brand_99: 'Retail',
  brand_100: 'Retail',
  brand_101: 'Food & Beverages',
  brand_102: 'Publisher Media',
};

/**
 * Turns the stored brand rows into grid rows with section headings, in the order they are stored.
 * Existing brands and acquisitions have no heading row in the data, so those two headings are added here.
 */
export function buildBrandGridRows(brands: BrandRowData[], years: string[], mode: BrandGridMode): BrandGridRow[] {
  const rows: BrandGridRow[] = [];
  let group = '';

  const sectionRow = (key: string, label: string): BrandGridRow => ({
    key,
    label,
    section: true,
    total: false,
    indent: 0,
    editable: false,
  });

  const figureRow = (brand: BrandRowData, isTotal: boolean): BrandGridRow => {
    const division = EXISTING_BRAND_DIVISION[brand.id];
    const row: BrandGridRow = {
      key: brand.id,
      label: isTotal ? 'TOTAL REVENUE' : brand.name,
      hint: isTotal
        ? 'Calculated automatically: sum of all brands above.'
        : division
        ? `Part of the ${division} division in the P&L.`
        : undefined,
      section: false,
      total: isTotal,
      badge: isTotal ? undefined : CATEGORY_BADGE[brand.category],
      indent: isTotal ? 0 : 1,
      editable: !isTotal && mode !== 'growth',
    };
    years.forEach((year, index) => {
      row[yearField(year)] = (mode === 'full' ? brand.valuesIdr[year] : brand.valuesBn[year]) ?? 0;
      // No growth for the first year (nothing before it to compare with)
      row[growthField(year)] =
        index === 0 ? null : yoyGrowth(brand.valuesIdr[year] ?? 0, brand.valuesIdr[years[index - 1]] ?? 0);
    });
    return row;
  };

  for (const brand of brands) {
    if (isBrandHeadingRow(brand)) {
      rows.push(sectionRow(`section:${brand.id}`, brand.name));
      group = brand.category;
    } else if (brand.category === 'total') {
      rows.push(figureRow(brand, true));
    } else {
      if (brand.category === 'existing' && group !== 'existing') {
        rows.push(sectionRow('section:existing', 'Existing Brands'));
        group = 'existing';
      } else if (brand.category === 'acquisition' && group !== 'acquisition') {
        rows.push(sectionRow('section:acquisition', 'Acquisitions'));
        group = 'acquisition';
      }
      rows.push(figureRow(brand, false));
    }
  }

  return rows;
}
