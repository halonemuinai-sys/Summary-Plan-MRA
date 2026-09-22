export interface FinancialRowData {
  key?: string;
  category?: 'revenue' | 'cogs' | 'gp' | 'opex' | 'ebit' | 'other' | 'tax' | 'npat' | 'ebitda' | string;
  description: string;
  isFormula?: boolean;
  indent?: boolean;
  values: Record<string, number>; // e.g. { '2025': 482.5, '2026': 520.0, ... }
}

export interface BrandRowData {
  id: string;
  name: string;
  category: 'existing' | 'acquisition' | 'header_fnb' | 'fnb_new' | 'header_retail' | 'retail_new' | 'total';
  valuesIdr: Record<string, number>; // Full Rupiah
  valuesBn: Record<string, number>;  // In IDR Billion
  growthPct?: Record<string, number | null>; // YoY %
}

export interface ScenarioDataset {
  id: string;
  slug: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  isLocked?: boolean;
  years: string[];
  items: Record<string, FinancialRowData>;
  brandBreakdown?: BrandRowData[];
}

export interface ChartDataPoint {
  year: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  gpMargin: number;
  opex: number;
  ebitda: number;
  ebitdaMargin: number;
  npat: number;
  npatMargin: number;
}

export interface HighlightsKpis {
  revenue: { value: number; unit: string; yoyPct: number; yoyText: string };
  ebitda: { value: number; unit: string; yoyPct: number; yoyText: string };
  eat: { value: number; unit: string; yoyPct: number; yoyText: string };
  gpm: { value: number; unit: string; yoyDiff: number; yoyText: string };
}

export interface RevenueTrajectoryPoint {
  year: string;
  value: number;
  isForecast: boolean;
}

export interface PnlTrajectoryPoint {
  year: string;
  gp: number;
  ebitda: number;
  ebit: number;
  eat: number;
}

export interface MarginsTrajectoryPoint {
  year: string;
  gpm: number;
  ebitdam: number;
  ebitm: number;
  eatm: number;
}

export interface CashflowTrajectoryPoint {
  year: string;
  cfo: number;
  cfi: number;
  cff: number;
}

/**
 * Figures typed into the Highlights studio that stand in for what the P&L says. A year only appears
 * here once someone has overruled it, so everything else keeps following the P&L on its own.
 */
export interface PnlOverrides {
  [year: string]: Partial<Pick<PnlTrajectoryPoint, 'gp' | 'ebitda' | 'ebit' | 'eat'>>;
}

/** Revenue figures typed into the Highlights studio that stand in for what the P&L says, by year */
export interface RevenueOverrides {
  [year: string]: number;
}

export interface FinancialHighlightsData {
  title: string;
  subtitle: string;
  kpis: HighlightsKpis;
  revenueTrajectory: RevenueTrajectoryPoint[];
  pnlTrajectory: PnlTrajectoryPoint[];
  /** Years and lines where a typed figure overrules the P&L */
  pnlOverrides?: PnlOverrides;
  revenueOverrides?: RevenueOverrides;
  marginsTrajectory: MarginsTrajectoryPoint[];
  cashflowTrajectory: CashflowTrajectoryPoint[];
  footerNote: string;
  confidentialText: string;
}
