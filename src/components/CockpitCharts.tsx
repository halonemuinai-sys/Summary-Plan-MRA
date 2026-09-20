'use client';

import { ReactNode, useState } from 'react';
import { BarChart, Bar, Cell, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LabelList, ReferenceArea } from 'recharts';
import { Maximize2, Minimize2, ArrowUpRight, Building2 } from 'lucide-react';
import { ScenarioDataset } from '@/lib/types';
import { buildCockpitData, buildProfitBridge } from '@/lib/cockpit-data';

const colors = { revenue: '#456b92', profit: '#11977b', ebitda: '#c49039', margin: '#4274ac', cogs: '#456b92', opex: '#b6c4d3', other: '#d6b77b', loss: '#ce7870' };
const number = (v: number, digits = 0) => v.toLocaleString('en-US', { maximumFractionDigits: digits });
const fiscalYear = (y: string) => `FY${y.slice(-2)}${Number(y) > 2025 ? 'F' : 'A'}`;
const brands = [['Bulgari', '#456b92'], ['Haagendazs', '#c49039'], ['Lulu Lemon', '#809780'], ['Invincible', '#11977b'], ['Omega', '#8b8bab'], ['Media', '#ac8b82'], ['Others', '#b6c4d3']] as const;

function Legend({ entries }: { entries: ReadonlyArray<readonly [string, string]> }) {
  return <div className="cockpit-legend">{entries.map(([label, color]) => <span key={label}><i style={{ backgroundColor: color }} />{label}</span>)}</div>;
}

function Panel({ id, title, caption, metric, children, controls, zoom, setZoom }: {
  id: number; title: string; caption: string; metric?: string; children: ReactNode; controls?: ReactNode; zoom: number | null; setZoom: (id: number | null) => void;
}) {
  return <section className="cockpit-panel" aria-label={title}>
    <div className="cockpit-panel-heading"><div><p className="cockpit-eyebrow">0{id} / {caption}</p><h2>{title}</h2></div><div className="cockpit-panel-controls">{controls}<button className="cockpit-icon-button" onClick={() => setZoom(zoom === id ? null : id)} aria-label={zoom === id ? `Restore ${title}` : `Expand ${title}`} title={zoom === id ? 'Restore overview (Esc)' : 'Expand chart'}>{zoom === id ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button></div></div>
    {metric && <p className="cockpit-panel-metric">{metric}</p>}
    {children}
  </section>;
}

export default function CockpitCharts({ dataset, isLightMode, percentage, zoom, setZoom, onOpenBrands, brandData }: {
  dataset: ScenarioDataset; isLightMode: boolean; percentage: boolean; zoom: number | null; setZoom: (id: number | null) => void;
  onOpenBrands: () => void; brandData: Record<string, string | number>[];
}) {
  const years = dataset.years.filter(y => Number(y) >= 2024);
  const data = buildCockpitData(dataset, years);
  const [bridgeYear, setBridgeYear] = useState('2026');
  const [portfolio, setPortfolio] = useState(false);
  const selectedYear = years.includes(bridgeYear) ? bridgeYear : years[0];
  const bridge = buildProfitBridge(dataset, selectedYear);
  const selectedRevenue = dataset.items.total_revenue?.values[selectedYear] ?? 0;
  const bridgeAvailable = !percentage || selectedRevenue > 0;
  const displayedBridge = bridge.map(row => ({ ...row,
    amount: percentage && selectedRevenue > 0 ? row.amount / selectedRevenue * 100 : row.amount,
    range: row.range.map(v => percentage && selectedRevenue > 0 ? v / selectedRevenue * 100 : v) as [number, number],
  }));
  const brandPlot = brandData.map(row => ({ ...row, ...Object.fromEntries(brands.map(([key]) => [key, percentage ? (Number(row.Total) > 0 ? Number(row[key]) / Number(row.Total) * 100 : null) : row[key]])) }));
  const last = data.at(-1);
  const first = data[0];
  const span = last && first ? Number(last.year) - Number(first.year) : 0;
  const cagr = last && first && first.revenue > 0 && last.revenue > 0 && span > 0 ? (Math.pow(last.revenue / first.revenue, 1 / span) - 1) * 100 : null;
  const unit = percentage ? '% of revenue' : 'IDR Bn';
  const format = (v: number) => percentage ? `${number(v, 1)}%` : number(v);
  const text = isLightMode ? '#22364d' : '#d8e3ee';
  const muted = isLightMode ? '#75859a' : '#91a3b9';
  const grid = isLightMode ? '#edf1f5' : '#263347';
  const xAxis = { tickLine: false, axisLine: false, tick: { fill: muted, fontSize: 11 }, dy: 7, minTickGap: 10 };
  const yAxis = { tickLine: false, axisLine: false, tick: { fill: muted, fontSize: 10 }, width: 48, tickCount: 5 };
  const tooltipStyle = { backgroundColor: isLightMode ? '#fff' : '#172338', color: text, border: `1px solid ${grid}`, borderRadius: 12, fontSize: 12, boxShadow: '0 8px 30px #00000012' };
  const tooltip = <Tooltip contentStyle={tooltipStyle} labelFormatter={y => fiscalYear(String(y))} formatter={(v: number, name: string) => [`${number(v, 1)}${percentage || name.includes('margin') ? '%' : ' IDR Bn'}`, name]} />;
  const forecast = years.includes('2025') && years.includes('2026') ? <ReferenceLine x="2025" stroke={muted} strokeDasharray="3 5" /> : null;
  const costEntries = [['COGS', colors.cogs], ['Operating expenses', colors.opex], ['Other, tax & holding', colors.other], ['Net profit', colors.profit]] as const;

  return <main className="cockpit-main" data-theme={isLightMode ? 'light' : 'dark'}>
    <div className="cockpit-intro"><div><p className="cockpit-eyebrow">MRA GROUP / FINANCIAL PERFORMANCE</p><h1>Performance at a glance</h1><p>{dataset.title}</p></div><div className="cockpit-period">{years.length ? `${fiscalYear(years[0])} — ${fiscalYear(years.at(-1)!)}` : 'No period available'}<span>A = Actual · F = Forecast / Plan</span></div></div>
    <div className="cockpit-kpis">
      {[
        ['Revenue', last?.revenue, `${cagr === null ? '—' : `${number(cagr, 1)}%`} CAGR · ${first?.year}–${last?.year}`, colors.revenue],
        ['EBITDA', last?.ebitda, `${number(last?.ebitdaMargin ?? 0, 1)}% EBITDA margin`, colors.ebitda],
        ['Net profit', last?.npat, `${number(last?.npatMargin ?? 0, 1)}% net profit margin`, colors.profit],
      ].map(([label, value, note, color]) => <div className="cockpit-kpi" key={String(label)} style={{ borderTopColor: String(color) }}><div><span>{label}</span><small>FY{last?.year} · Plan</small></div><strong>{typeof value === 'number' ? number(value, 1) : '—'} <em>IDR Bn</em></strong><p><ArrowUpRight size={12} />{note}</p></div>)}
    </div>
    <div className={`cockpit-panels ${zoom !== null ? 'cockpit-panels-zoom' : ''}`}>
      {(zoom === null || zoom === 1) && <Panel id={1} title="Revenue & net profit" caption="Growth trajectory" metric={`${unit} · Compare scale and earnings over time`} zoom={zoom} setZoom={setZoom}>
        <Legend entries={[[percentage ? 'Revenue base' : 'Revenue', colors.revenue], [percentage ? 'Net profit margin' : 'Net profit', colors.profit]]} />
        <div className="cockpit-chart"><ResponsiveContainer><ComposedChart data={data} syncId="cockpit-years" syncMethod="value" margin={{ top: 24, right: 14, left: 0, bottom: 3 }} barCategoryGap="35%">
          <CartesianGrid stroke={grid} vertical={false} /><XAxis {...xAxis} dataKey="year" tickFormatter={fiscalYear} /><YAxis {...yAxis} tickFormatter={format} />{tooltip}{forecast}
          <Bar dataKey={percentage ? 'revenueShare' : 'revenue'} name={percentage ? 'Revenue base' : 'Revenue'} fill={colors.revenue} radius={[4, 4, 0, 0]} maxBarSize={44} isAnimationActive={false}><LabelList position="top" fill={text} fontSize={10} formatter={format} /></Bar>
          <Line dataKey={percentage ? 'profitShare' : 'npat'} name={percentage ? 'Net profit margin' : 'Net profit'} type="linear" stroke={colors.profit} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2, fill: isLightMode ? '#fff' : '#172338' }} activeDot={{ r: 5 }} isAnimationActive={false} />
        </ComposedChart></ResponsiveContainer></div>
      </Panel>}
      {(zoom === null || zoom === 2) && <Panel id={2} title="EBITDA & margin" caption="Operating performance" metric={percentage ? 'EBITDA after holding cost · % of revenue' : 'EBITDA after holding cost · IDR Bn (left), margin % (right)'} zoom={zoom} setZoom={setZoom}>
        <Legend entries={percentage ? [['EBITDA margin', colors.margin]] : [['EBITDA', colors.ebitda], ['EBITDA margin', colors.margin]]} />
        <div className="cockpit-chart"><ResponsiveContainer><ComposedChart data={data} syncId="cockpit-years" syncMethod="value" margin={{ top: 24, right: 10, left: 0, bottom: 3 }} barCategoryGap="35%">
          <CartesianGrid stroke={grid} vertical={false} /><XAxis {...xAxis} dataKey="year" tickFormatter={fiscalYear} /><YAxis {...yAxis} yAxisId="amount" tickFormatter={format} />{!percentage && <YAxis {...yAxis} yAxisId="margin" orientation="right" tickFormatter={v => `${v}%`} />}{tooltip}
          {!percentage && <Bar yAxisId="amount" dataKey="ebitda" name="EBITDA" fill={colors.ebitda} radius={[4, 4, 0, 0]} maxBarSize={44} isAnimationActive={false}><LabelList position="top" fill={text} fontSize={10} formatter={(v: number) => number(v)} /></Bar>}
          <Line yAxisId={percentage ? 'amount' : 'margin'} dataKey="ebitdaShare" name="EBITDA margin" type="linear" stroke={colors.margin} strokeWidth={2.5} dot={{ r: 3, fill: isLightMode ? '#fff' : '#172338', strokeWidth: 2 }} isAnimationActive={false} />
        </ComposedChart></ResponsiveContainer></div>
      </Panel>}
      {(zoom === null || zoom === 3) && <Panel id={3} title={portfolio ? 'Brand portfolio' : 'Revenue composition'} caption={portfolio ? 'Portfolio mix' : 'Cost & profit mix'} metric={portfolio ? `Brand Revenue Matrix · ${unit}` : 'Share of revenue · includes all costs and net profit'} zoom={zoom} setZoom={setZoom} controls={<><div className="cockpit-switch"><button aria-pressed={!portfolio} onClick={() => setPortfolio(false)}>Costs</button><button aria-pressed={portfolio} onClick={() => setPortfolio(true)}>Brands</button></div><button className="cockpit-icon-button" onClick={onOpenBrands} aria-label="Open Brand Revenue Matrix" title="Open Brand Revenue Matrix"><Building2 size={15} /></button></>}>
        <Legend entries={portfolio ? brands : costEntries} />
        <div className="cockpit-chart"><ResponsiveContainer><BarChart data={portfolio ? brandPlot : data} syncId="cockpit-years" syncMethod="value" stackOffset="sign" margin={{ top: 16, right: 14, left: 0, bottom: 3 }} barCategoryGap="35%">
          <CartesianGrid stroke={grid} vertical={false} /><XAxis {...xAxis} dataKey="year" tickFormatter={fiscalYear} /><YAxis {...yAxis} tickFormatter={v => portfolio ? format(v) : `${number(v)}%`} />
          <Tooltip contentStyle={tooltipStyle} labelFormatter={y => fiscalYear(String(y))} formatter={(v: number, name: string) => [`${number(v, 1)}${!portfolio || percentage ? '%' : ' IDR Bn'}`, name]} /><ReferenceLine y={0} stroke={muted} />
          {portfolio ? brands.map(([name, color]) => <Bar key={name} dataKey={name} stackId="cost" fill={color} maxBarSize={44} isAnimationActive={false} />) : (['cogsShare', 'opexShare', 'otherShare', 'profitShare'] as const).map((key, i) => <Bar key={key} dataKey={key} name={costEntries[i][0]} stackId="cost" fill={costEntries[i][1]} maxBarSize={44} isAnimationActive={false}><LabelList position="center" fill={i === 0 || i === 3 ? '#fff' : '#22364d'} fontSize={10} formatter={(v: number) => Math.abs(v) >= 8 ? `${number(v)}%` : ''} /></Bar>)}
        </BarChart></ResponsiveContainer></div>
      </Panel>}
      {(zoom === null || zoom === 4) && <Panel id={4} title="Revenue to net profit" caption="Profit bridge" metric={`${unit} · All operating costs, tax and holding included`} zoom={zoom} setZoom={setZoom} controls={<select aria-label="Profit bridge year" value={selectedYear} onChange={e => setBridgeYear(e.target.value)}>{years.map(y => <option key={y} value={y}>{fiscalYear(y)}</option>)}</select>}>
        <Legend entries={[[`Totals · ${fiscalYear(selectedYear)}`, colors.revenue], ['Deductions', colors.loss], ['Additions / net profit', colors.profit]]} />
        <div className="cockpit-chart">{!bridgeAvailable ? <p className="cockpit-empty">Percentage bridge unavailable: revenue is zero or negative.</p> : <ResponsiveContainer><BarChart data={displayedBridge} margin={{ top: 24, right: 14, left: 0, bottom: 3 }} barCategoryGap="23%">
          <CartesianGrid stroke={grid} vertical={false} /><XAxis {...xAxis} dataKey="name" interval={0} tick={{ fill: muted, fontSize: 10 }} /><YAxis {...yAxis} tickFormatter={format} /><ReferenceLine y={0} stroke={muted} />
          <Tooltip cursor={{ fill: isLightMode ? '#f3f6fa' : '#263347' }} content={({ active, payload }) => { const row = payload?.[0]?.payload; return active && row ? <div style={{ ...tooltipStyle, padding: 12 }}><strong>{row.name}: {format(row.amount)} {percentage ? '' : 'IDR Bn'}</strong><p style={{ maxWidth: 240, marginTop: 4 }}>{row.detail}</p></div> : null; }} />
          <Bar dataKey="range" maxBarSize={55} isAnimationActive={false}>{displayedBridge.map((row, i) => <Cell key={row.name} fill={i === displayedBridge.length - 1 ? colors.profit : row.kind === 'total' ? colors.revenue : row.kind === 'increase' ? colors.profit : colors.loss} />)}<LabelList dataKey="amount" position="top" fill={text} fontSize={10} formatter={(v: number) => v < 0 ? `(${format(Math.abs(v))})` : format(v)} /></Bar>
        </BarChart></ResponsiveContainer>}</div>
      </Panel>}
    </div>
    <p className="cockpit-source">Source: saved scenario P&L; portfolio uses the saved Brand Revenue Matrix. All figures rounded for display. <span>Strictly private & confidential</span></p>
  </main>;
}
