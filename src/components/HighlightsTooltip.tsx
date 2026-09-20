import { FinancialHighlightsData } from '@/lib/types';

type Variant = 'revenue' | 'pnl' | 'margins' | 'cashflow';
interface Entry { dataKey?: string | number; name?: string; value?: number | string; color?: string }
const labels: Record<string, string> = {
  displayValue: 'Total revenue', gp: 'Gross profit', ebitda: 'EBITDA', ebit: 'Operating profit (EBIT)', eat: 'Net profit (EAT)',
  gpm: 'Gross profit margin', ebitdam: 'EBITDA margin', ebitm: 'Operating profit margin', eatm: 'Net profit margin',
  cfo: 'Operating activities', cfi: 'Investing activities', cff: 'Financing activities',
};
const titles = { revenue: 'Revenue', pnl: 'Profitability', margins: 'Profit margins', cashflow: 'Cash flow' };

export default function HighlightsTooltip({ active, payload, label, variant, unit, light, trajectory }: {
  active?: boolean; payload?: Entry[]; label?: string | number; variant: Variant; unit: string; light: boolean;
  trajectory: FinancialHighlightsData['revenueTrajectory'];
}) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter(row => row.value !== null && row.value !== undefined && Number.isFinite(Number(row.value)));
  if (!rows.length) return null;
  const year = String(label ?? '');
  const period = trajectory.find(point => point.year === year);
  const percent = variant === 'margins';
  const format = (value: number) => {
    const figure = Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return `${value < 0 ? '(' : ''}${figure}${percent ? '%' : ''}${value < 0 ? ')' : ''}`;
  };
  const netCash = rows.reduce((sum, row) => sum + Number(row.value), 0);
  return <div className="highlights-tooltip" data-theme={light ? 'light' : 'dark'} role="tooltip">
    <div className="highlights-tooltip-header"><div><span>{titles[variant]}</span><strong>{/^FY/i.test(year) ? year : `FY${year}`}</strong></div>{period && <span className={`highlights-tooltip-status${period.isForecast ? ' is-forecast' : ''}`}>{period.isForecast ? 'Forecast' : 'Actual'}</span>}</div>
    <div className="highlights-tooltip-unit">{percent ? 'Share of revenue (%)' : `Amounts in ${unit}`}</div>
    <dl>{rows.map(row => <div key={String(row.dataKey ?? row.name)}><dt><i style={{ backgroundColor: row.color ?? '#0d9488' }} />{labels[String(row.dataKey)] ?? row.name}</dt><dd className={Number(row.value) < 0 ? 'is-negative' : undefined}>{format(Number(row.value))}</dd></div>)}</dl>
    {variant === 'cashflow' && rows.length === 3 && <div className="highlights-tooltip-total"><span>Net cash movement</span><strong className={netCash < 0 ? 'is-negative' : undefined}>{format(netCash)}</strong></div>}
    {rows.some(row => Number(row.value) < 0) && <p className="highlights-tooltip-note">Parentheses indicate negative values.</p>}
  </div>;
}
