import {
  FinancialHighlightsData,
  FinancialRowData,
  HighlightsKpis,
  PnlTrajectoryPoint,
  RevenueTrajectoryPoint,
} from './types';
import { deriveMargins } from './highlights-margins';

/**
 * The Financial Highlights slide shows the same figures as the P&L Group + Holding table, so it reads
 * them from there instead of keeping a typed copy. A typed copy drifts: the deck was carrying FY30F
 * EBITDA of 407 against 713.10 in the P&L, and an FY22 net profit of +43 against -13.05, because the
 * P&L moved on and nobody retyped the slide.
 *
 * Only the figures are read off the P&L. What the slide says about them - its title, the Actual/Forecast
 * marking of each year, the comparison wording on the KPI cards - stays with the slide.
 */

/** Which P&L row each line of the slide is. "EBITDA" is the after-holding-cost line, as on the slide. */
export const PNL_SOURCE_ROWS = {
  revenue: 'total_revenue',
  gp: 'gross_profit',
  ebitda: 'ebitda_after_holding',
  ebit: 'operating_profit',
  eat: 'npat',
} as const;

/** The scenario holding the workbook sheet "PL MRA Group+Holding (Combine)" */
export const PNL_SOURCE_SLUG = 'mra-altius-base-2025-2031';

/** Label of the P&L table as it is named in the app, for the wording in the studio */
export const PNL_SOURCE_TITLE = 'P&L Group + Holding';

const round2 = (value: number) => Math.round(value * 100) / 100;
const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * The calendar year a slide label stands for: 'FY26F' and 'FY26' are both 2026.
 * Returns null for a label with no year in it, which is then left as it was.
 */
export function calendarYear(label: string): string | null {
  const found = label.match(/([0-9]{2,4})/);
  if (!found) return null;
  const digits = found[1];
  if (digits.length === 4) return digits;
  if (digits.length === 2) return `20${digits}`;
  return null;
}

/** The P&L figure for a row and year, or null when the P&L does not carry that year */
function pnlValue(
  items: Record<string, FinancialRowData>,
  key: string,
  year: string | null
): number | null {
  if (!year) return null;
  const value = items[key]?.values?.[year];
  return typeof value === 'number' && Number.isFinite(value) ? round2(value) : null;
}

/** Growth over the previous year, in %. Measured against the size of the previous figure, so a year
 *  that turned a loss into a profit reads as a rise rather than a fall. */
function growthPct(current: number, previous: number): number {
  if (!previous) return 0;
  return round1(((current - previous) / Math.abs(previous)) * 100);
}

/**
 * The slide's figures, read off the P&L. Years the P&L does not carry keep the figure they had,
 * so a slide can still show a year that was never in the workbook.
 */
export function deriveTrajectories(
  revenueTrajectory: RevenueTrajectoryPoint[],
  pnlTrajectory: PnlTrajectoryPoint[],
  items: Record<string, FinancialRowData>
): { revenueTrajectory: RevenueTrajectoryPoint[]; pnlTrajectory: PnlTrajectoryPoint[] } {
  const revenue = revenueTrajectory.map((point) => {
    const value = pnlValue(items, PNL_SOURCE_ROWS.revenue, calendarYear(point.year));
    return value === null ? point : { ...point, value };
  });

  const pnl = pnlTrajectory.map((point) => {
    const year = calendarYear(point.year);
    const line = (key: string, current: number) => pnlValue(items, key, year) ?? current;
    return {
      year: point.year,
      gp: line(PNL_SOURCE_ROWS.gp, point.gp),
      ebitda: line(PNL_SOURCE_ROWS.ebitda, point.ebitda),
      ebit: line(PNL_SOURCE_ROWS.ebit, point.ebit),
      eat: line(PNL_SOURCE_ROWS.eat, point.eat),
    };
  });

  return { revenueTrajectory: revenue, pnlTrajectory: pnl };
}

/**
 * The four cards across the top of the slide: the last year on the charts, against the year before it.
 * The unit and the comparison wording are the slide's own and are left alone.
 */
export function deriveKpis(
  current: HighlightsKpis,
  revenueTrajectory: RevenueTrajectoryPoint[],
  pnlTrajectory: PnlTrajectoryPoint[]
): HighlightsKpis {
  const margins = deriveMargins(revenueTrajectory, pnlTrajectory);
  const last = <T,>(list: T[]) => list[list.length - 1];
  const before = <T,>(list: T[]) => list[list.length - 2];

  const revenueNow = last(revenueTrajectory);
  const revenueWas = before(revenueTrajectory);
  const pnlNow = last(pnlTrajectory);
  const pnlWas = before(pnlTrajectory);
  const marginNow = last(margins);
  const marginWas = before(margins);
  if (!revenueNow || !pnlNow || !marginNow) return current;

  return {
    revenue: {
      ...current.revenue,
      value: round2(revenueNow.value),
      yoyPct: revenueWas ? growthPct(revenueNow.value, revenueWas.value) : current.revenue.yoyPct,
    },
    ebitda: {
      ...current.ebitda,
      value: round2(pnlNow.ebitda),
      yoyPct: pnlWas ? growthPct(pnlNow.ebitda, pnlWas.ebitda) : current.ebitda.yoyPct,
    },
    eat: {
      ...current.eat,
      value: round2(pnlNow.eat),
      yoyPct: pnlWas ? growthPct(pnlNow.eat, pnlWas.eat) : current.eat.yoyPct,
    },
    gpm: {
      ...current.gpm,
      value: marginNow.gpm,
      yoyDiff: marginWas ? round1(marginNow.gpm - marginWas.gpm) : current.gpm.yoyDiff,
    },
  };
}

/**
 * The whole slide with its figures read off the P&L: the two tables, the margins that follow from them
 * and the KPI cards. Everything else on the slide is kept as it was.
 */
export function applyPnlSource(
  highlights: FinancialHighlightsData,
  items: Record<string, FinancialRowData> | undefined
): FinancialHighlightsData {
  if (!items) return highlights;

  const { revenueTrajectory, pnlTrajectory } = deriveTrajectories(
    highlights.revenueTrajectory,
    highlights.pnlTrajectory,
    items
  );

  return {
    ...highlights,
    revenueTrajectory,
    pnlTrajectory,
    marginsTrajectory: deriveMargins(revenueTrajectory, pnlTrajectory),
    kpis: deriveKpis(highlights.kpis, revenueTrajectory, pnlTrajectory),
  };
}
