import { ScenarioDataset } from './types';
import { buildChartData, getRowValue } from './formula-engine';

export function buildCockpitData(dataset: ScenarioDataset, years: string[]) {
  return buildChartData(dataset.items, years).map(point => {
    const share = (value: number) => point.revenue > 0 ? value / point.revenue * 100 : null;
    // The remainder includes other income/expenses, tax, holding and associates.
    const other = point.revenue - point.cogs - point.opex - point.npat;
    return { ...point, other, revenueShare: share(point.revenue), profitShare: share(point.npat),
      ebitdaShare: share(point.ebitda), cogsShare: share(point.cogs), opexShare: share(point.opex), otherShare: share(other) };
  });
}

export interface WaterfallStep {
  name: string;
  detail: string;
  amount: number;
  range: [number, number];
  kind: 'total' | 'increase' | 'decrease';
}

export function buildProfitBridge(dataset: ScenarioDataset, year: string): WaterfallStep[] {
  const value = (key: string) => getRowValue(dataset.items, key, year);
  const revenue = value('total_revenue');
  const profit = value('npat');
  let balance = revenue;
  const rows: WaterfallStep[] = [{ name: 'Revenue', detail: 'Total net revenue', amount: revenue, range: [0, revenue], kind: 'total' }];
  const changes: [string, string, number][] = [
    ['COGS', 'Cost of goods sold', -value('cogs')],
    ['OPEX', 'All operating expenses, including depreciation and amortization', -value('total_opex')],
    ['Other', 'Other expenses / income, net', -value('other_expenses')],
    ['Tax', 'Provision for income tax', -value('income_tax')],
    ['Holding', 'Holding costs less share of associates', -value('holding_assoc_net')],
  ];
  for (const [name, detail, amount] of changes) {
    const next = balance + amount;
    rows.push({ name, detail, amount, range: [Math.min(balance, next), Math.max(balance, next)], kind: amount > 0 ? 'increase' : 'decrease' });
    balance = next;
  }
  // Preserve stored workbook totals and disclose any unreconciled residual explicitly.
  if (Math.abs(profit - balance) > 0.02) {
    const amount = profit - balance;
    rows.push({ name: 'Adjustment', detail: 'Difference between the stored P&L total and the listed components', amount, range: [Math.min(balance, profit), Math.max(balance, profit)], kind: amount > 0 ? 'increase' : 'decrease' });
  }
  rows.push({ name: 'Net profit', detail: 'Net profit after tax and holding costs', amount: profit, range: [Math.min(0, profit), Math.max(0, profit)], kind: 'total' });
  return rows;
}
