import { BrandRowData } from './types';

/**
 * Every series a panel can draw, in stacking order, with the colour that belongs to that brand.
 * The named brands come first and New Business last, so the bar reads from the business that exists
 * today up to the one still being built.
 *
 * A brand keeps its colour whether or not it is on screen: `panelSeries` only decides what is drawn,
 * it never hands a colour to a different brand. Chronologie's blue and Boucheron's violet were checked
 * against the colours they sit next to - colour-blind and normal-vision separation both clear the gates.
 *
 * Atmos and Metrox are deliberately not here. They are acquisitions rather than brands the slide names,
 * so whatever they earn is counted inside New Business; they never get a segment of their own.
 */
export const revenueSeries = {
  segment: [['Retail', '#25303e'], ['F&B', '#ffa515'], ['Media', '#a8b0bb']],
  retail: [['Bulgari', '#25303e'], ['Omega', '#ffa515'], ["L’OREAL", '#ffda31'], ['Wiggle Wiggle', '#59a88c'], ['Chronologie', '#2a78d6'], ['Boucheron', '#4a3aa7'], ['New Business', '#f3b5e6']],
  fnb: [['Haagendazs', '#ffa515'], ['Jamba Juice', '#1baf7a'], ['Hard Rock Bali', '#25303e'], ['New Business', '#a8b0bb']],
  media: [['Ads', '#25303e'], ['Events', '#ffa515'], ['Digital', '#2a78d6']],
} as const;
export type RevenuePanel = keyof typeof revenueSeries;
export type RevenuePoint = { year: string; total: number } & Record<string, string | number>;

/**
 * The series a panel actually draws: the ones carrying revenue in at least one year on screen. A brand
 * planned but not yet earning - the new Hard Rock in Bali, say - would otherwise take a colour and a
 * place in the legend for a segment nobody can see.
 */
export function panelSeries(panel: RevenuePanel, rows: RevenuePoint[]): ReadonlyArray<readonly [string, string]> {
  return revenueSeries[panel].filter(([name]) => rows.some((row) => Math.abs(Number(row[name]) || 0) > 0.005));
}

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
    // Media used to be one line called Publisher; it is now the three lines that make it up
    brand_118: { panel: 'media', label: 'Ads' },
    brand_119: { panel: 'media', label: 'Events' },
    brand_120: { panel: 'media', label: 'Digital' },
    // Counted, never named: an acquisition belongs to New Business on this slide
    brand_103: { panel: 'retail', label: 'New Business' },
    brand_104: { panel: 'retail', label: 'New Business' },
    // Broken out of New Business: these three carry enough of the plan to be named on the slide
    brand_106: { panel: 'fnb', label: 'Jamba Juice' },
    brand_109: { panel: 'fnb', label: 'Hard Rock Bali' },
    brand_111: { panel: 'retail', label: 'Chronologie' },
    brand_112: { panel: 'retail', label: 'Boucheron' },
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
