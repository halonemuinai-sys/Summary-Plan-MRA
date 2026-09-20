import { BrandRowData } from './types';

export const revenueSeries = {
  segment: [['Retail', '#25303e'], ['F&B', '#ffa515'], ['Media', '#a8b0bb']],
  retail: [['Bulgari', '#25303e'], ['Omega', '#ffa515'], ["L’OREAL", '#ffda31'], ['Wiggle Wiggle', '#59a88c'], ['Atmos', '#f44336'], ['Metrox', '#b7aaa2'], ['New Business', '#f3b5e6']],
  fnb: [['Haagendazs', '#ffa515'], ['New Business', '#a8b0bb'], ['Hard Rock Bali', '#25303e']],
  media: [['Publisher', '#ffa515']],
} as const;
export type RevenuePanel = keyof typeof revenueSeries;
export type RevenuePoint = { year: string; total: number } & Record<string, string | number>;

/** Share of each panel's annual total; a zero-total year has no percentage mix. */
export function revenuePercentage(rows: RevenuePoint[]): RevenuePoint[] {
  return rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [
    key, typeof value === 'number' ? (row.total > 0 ? value / row.total * 100 : 0) : value,
  ])) as RevenuePoint);
}

function group(row: BrandRowData): { panel: Exclude<RevenuePanel, 'segment'>; label: string } | null {
  if (['total', 'header_fnb', 'header_retail'].includes(row.category)) return null;
  const known: Record<string, { panel: Exclude<RevenuePanel, 'segment'>; label: string }> = {
    brand_97: { panel: 'retail', label: 'Bulgari' },
    brand_98: { panel: 'retail', label: 'Omega' },
    brand_99: { panel: 'retail', label: 'L’OREAL' },
    brand_100: { panel: 'retail', label: 'Wiggle Wiggle' },
    brand_101: { panel: 'fnb', label: 'Haagendazs' },
    brand_102: { panel: 'media', label: 'Publisher' },
    brand_103: { panel: 'retail', label: 'Atmos' },
    brand_104: { panel: 'retail', label: 'Metrox' },
    brand_109: { panel: 'fnb', label: 'Hard Rock Bali' },
  };
  return known[row.id] ?? (row.category === 'retail_new' ? { panel: 'retail', label: 'New Business' }
    : row.category === 'fnb_new' ? { panel: 'fnb', label: 'New Business' } : null);
}

/** All panels share one source, excluding heading rows and the precomputed total. */
export function buildRevenueBreakdown(brands: BrandRowData[]) {
  const inputs = brands.filter(b => !['total', 'header_fnb', 'header_retail'].includes(b.category));
  const unmapped = inputs.filter(b => !group(b)).map(b => b.name);
  const years = Array.from(new Set(inputs.flatMap(b => [...Object.keys(b.valuesBn), ...Object.keys(b.valuesIdr)])))
    .filter(y => inputs.every(b => Number.isFinite(b.valuesIdr[y]) || Number.isFinite(b.valuesBn[y])))
    .sort((a, b) => Number(a) - Number(b));
  const panels: Record<RevenuePanel, RevenuePoint[]> = { segment: [], retail: [], fnb: [], media: [] };
  for (const year of years) {
    const points = Object.fromEntries(Object.entries(revenueSeries).map(([panel, series]) =>
      [panel, { year, total: 0, ...Object.fromEntries(series.map(([name]) => [name, 0])) }])) as Record<RevenuePanel, RevenuePoint>;
    for (const row of inputs) {
      const mapped = group(row);
      if (!mapped) continue;
      const value = Number.isFinite(row.valuesIdr[year]) ? row.valuesIdr[year] / 1e9 : row.valuesBn[year];
      points[mapped.panel][mapped.label] = Number(points[mapped.panel][mapped.label]) + value;
      points[mapped.panel].total += value;
    }
    points.segment.Retail = points.retail.total;
    points.segment['F&B'] = points.fnb.total;
    points.segment.Media = points.media.total;
    points.segment.total = points.retail.total + points.fnb.total + points.media.total;
    for (const panel of Object.keys(panels) as RevenuePanel[]) panels[panel].push(points[panel]);
  }
  return { years, panels, unmapped };
}
