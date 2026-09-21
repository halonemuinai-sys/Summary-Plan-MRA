import { FinancialHighlightsData } from './types';

export const INITIAL_HIGHLIGHTS_DATA: FinancialHighlightsData = {
  title: 'Financial Highlights',
  subtitle: 'Performance today. A stronger tomorrow.',
  kpis: {
    revenue: { value: 2763, unit: 'IDR Bn', yoyPct: 21.5, yoyText: 'vs FY29F' },
    ebitda: { value: 407, unit: 'IDR Bn', yoyPct: 20.8, yoyText: 'vs FY29F' },
    eat: { value: 187, unit: 'IDR Bn', yoyPct: 28.1, yoyText: 'vs FY29F' },
    gpm: { value: 49.5, unit: '%', yoyDiff: -0.2, yoyText: 'vs FY29F' },
  },
  revenueTrajectory: [
    { year: 'FY26F', value: 1193, isForecast: true },
    { year: 'FY27F', value: 1498, isForecast: true },
    { year: 'FY28F', value: 1861, isForecast: true },
    { year: 'FY29F', value: 2275, isForecast: true },
    { year: 'FY30F', value: 2763, isForecast: true },
  ],
  pnlTrajectory: [
    { year: 'FY26F', gp: 579, ebitda: 167, ebit: 103, eat: 54 },
    { year: 'FY27F', gp: 748, ebitda: 222, ebit: 139, eat: 83 },
    { year: 'FY28F', gp: 925, ebitda: 278, ebit: 179, eat: 112 },
    { year: 'FY29F', gp: 1129, ebitda: 337, ebit: 229, eat: 146 },
    { year: 'FY30F', gp: 1368, ebitda: 407, ebit: 290, eat: 187 },
  ],
  marginsTrajectory: [
    { year: 'FY26F', gpm: 48.5, ebitdam: 14.0, ebitm: 8.6, eatm: 4.5 },
    { year: 'FY27F', gpm: 49.9, ebitdam: 14.8, ebitm: 9.2, eatm: 5.6 },
    { year: 'FY28F', gpm: 49.7, ebitdam: 14.9, ebitm: 9.6, eatm: 6.0 },
    { year: 'FY29F', gpm: 49.7, ebitdam: 14.8, ebitm: 10.1, eatm: 6.4 },
    { year: 'FY30F', gpm: 49.5, ebitdam: 14.7, ebitm: 10.5, eatm: 6.8 },
  ],
  cashflowTrajectory: [
    { year: 'FY26F', cfo: -78, cfi: -119, cff: 214 },
    { year: 'FY27F', cfo: 89, cfi: -189, cff: 160 },
    { year: 'FY28F', cfo: 179, cfi: -156, cff: 18 },
    { year: 'FY29F', cfo: 259, cfi: -237, cff: 74 },
    { year: 'FY30F', cfo: 248, cfi: -153, cff: 1 },
  ],
  footerNote: 'Notes: 2025 Figures is Management Numbers',
  confidentialText: 'Strictly Private and Confidential',
};
