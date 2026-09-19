export interface FinancialRowData {
  key?: string;
  category?: 'revenue' | 'cogs' | 'gp' | 'opex' | 'ebit' | 'other' | 'tax' | 'npat' | 'ebitda' | string;
  description: string;
  isFormula?: boolean;
  indent?: boolean;
  values: Record<string, number>; // e.g. { '2025': 482.5, '2026': 520.0, ... }
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
