'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';
import { BarChart, Bar, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowLeft, Layers, ShoppingBag, UtensilsCrossed, Radio, Maximize2, Printer } from 'lucide-react';
import { ScenarioDataset } from '@/lib/types';
import { buildRevenueBreakdown, revenuePercentage, revenueSeries, RevenuePanel, RevenuePoint } from '@/lib/revenue-breakdown';

const titles = { segment: 'Revenue Breakdown per Segment', retail: 'Revenue Breakdown: Retail', fnb: 'Revenue Breakdown: F&B', media: 'Revenue Breakdown: Media' };
const icons = { segment: Layers, retail: ShoppingBag, fnb: UtensilsCrossed, media: Radio };
const format = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 });

interface TooltipRow { name: string; value: number; color: string }

/**
 * Readings for one year. Brands are ranked biggest first and the empty ones are folded into a note,
 * so the card stays short enough not to cover the neighbouring bars. Names wear plain ink with a
 * colour chip beside them rather than being coloured themselves, which keeps every line legible.
 */
function RevenueTooltip({ active, payload, label, unit, percentage }: { active?: boolean; payload?: Array<{ name?: string; dataKey?: string; value?: number; color?: string; fill?: string }>; label?: string; unit: string; percentage: boolean }) {
  if (!active || !payload?.length) return null;

  const entries: TooltipRow[] = payload
    .filter((item) => item.dataKey !== 'total')
    .map((item) => ({ name: String(item.name ?? item.dataKey ?? ''), value: Number(item.value) || 0, color: item.color ?? item.fill ?? '#94a3b8' }));
  const shown = entries.filter((row) => row.value !== 0).sort((a, b) => b.value - a.value);
  const empty = entries.length - shown.length;
  const total = entries.reduce((sum, row) => sum + row.value, 0);
  const format = (value: number) => percentage
    ? `${value.toLocaleString('en-US', { maximumFractionDigits: 1 })}%`
    : value.toLocaleString('en-US', { maximumFractionDigits: 1 });

  return (
    <div className="revenue-tip" role="tooltip">
      <div className="revenue-tip-head">
        <strong>FY{label}</strong>
        <span>Forecast</span>
      </div>
      <dl className="revenue-tip-rows">
        {shown.map((row) => (
          <div key={row.name}>
            <dt><i style={{ background: row.color }} />{row.name}</dt>
            <dd>{format(row.value)}</dd>
          </div>
        ))}
      </dl>
      <div className="revenue-tip-total">
        <span>Total</span>
        <b>{percentage ? '100%' : `${format(total)} ${unit}`}</b>
      </div>
      {empty > 0 && <p className="revenue-tip-note">{empty} with no revenue this year</p>}
    </div>
  );
}

function RevenueChart({ panel, rows, multiplier, unit, percentage }: { panel: RevenuePanel; rows: RevenuePoint[]; multiplier: number; unit: string; percentage: boolean }) {
  // Mark the selected series with an outline while keeping every brand fully legible.
  const [focus, setFocus] = useState<string | null>(null);
  const toggleFocus = (name: string) => setFocus((current) => (current === name ? null : name));
  useEffect(() => {
    if (!focus) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setFocus(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focus]);
  const onChartClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const group = (event.target as Element).closest?.('[class*="revenue-series-"]');
    const matched = group?.getAttribute('class')?.match(/revenue-series-([0-9]+)/);
    const name = matched ? series[Number(matched[1])]?.[0] : undefined;
    if (name) toggleFocus(name);
    else setFocus(null); // a click on the empty part of the chart lets everyone back in
  };
  const Icon = icons[panel];
  const series = revenueSeries[panel];
  const data = percentage ? revenuePercentage(rows) : rows.map(row => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, typeof v === 'number' ? v * multiplier : v])));
  const display = (v: number) => percentage ? `${v.toLocaleString('en-US', { maximumFractionDigits: 1 })}%` : format(v);
  return <section className="revenue-card rounded-2xl border border-white bg-white/90 p-5 shadow-[0_4px_30px_#dce6ed30] min-w-0">
    <div className="flex items-start gap-4 mb-3"><div aria-hidden="true" className="revenue-panel-icon"><Icon size={26} strokeWidth={1.5} /></div><div className="min-w-0 flex-1"><h2 className="text-lg xl:text-xl font-bold tracking-tight">{titles[panel]}</h2><p className="text-sm text-slate-500">{panel === 'segment' ? 'Total revenue by business segment' : panel === 'media' ? 'Revenue by type' : 'Revenue by brand'} ({unit})</p></div>{focus && <button type="button" className="revenue-focus-chip" onClick={() => setFocus(null)}>Focus: {focus}<span aria-hidden>×</span></button>}</div>
    <div className="revenue-legend flex flex-wrap justify-end items-center gap-x-3 gap-y-1 text-[11px] min-h-8 mb-2">
      {series.map(([name, color]) => <button type="button" key={name} onClick={() => toggleFocus(name)} aria-pressed={focus === name} title={focus === name ? 'Clear brand highlight' : `Highlight ${name}`} className={`revenue-legend-item${focus === name ? ' is-on' : ''}`}><span className="h-2.5 w-2.5 rounded" style={{ background: color }} />{name}</button>)}
    </div>
    <div className="revenue-chart h-[250px] xl:h-[27vh] min-h-[210px]" data-focus={focus ?? undefined} onClick={onChartClick} role="img" aria-label={`${titles[panel]}, ${unit}. ${data.map(r => `${r.year}: ${series.map(([name]) => `${name} ${display(Number(r[name]))}`).join(', ')}`).join('; ')}`}>
      <ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 26, right: 12, bottom: 0, left: 0 }} barCategoryGap="25%">
        <CartesianGrid stroke="#edf1f5" vertical={false} /><XAxis dataKey="year" tickFormatter={y => `FY${String(y).slice(-2)}F`} tickLine={false} axisLine={{ stroke: '#b7c2cf' }} tick={{ fill: '#142443', fontSize: 11 }} dy={6} />
        <YAxis tickFormatter={percentage ? v => `${v}%` : format} tickLine={false} axisLine={false} tick={{ fill: '#142443', fontSize: 11 }} width={55} domain={percentage ? [0, 100] : [0, 'auto']} ticks={percentage ? [0, 25, 50, 75, 100] : undefined} />
        <Tooltip isAnimationActive={false} cursor={{ fill: 'rgba(16, 36, 67, 0.06)' }} wrapperStyle={{ outline: 'none', zIndex: 20 }} content={<RevenueTooltip unit={unit} percentage={percentage} />} />
        {series.map(([name, color], index) => <Bar key={name} dataKey={name} stackId="revenue" fill={color} maxBarSize={66} className={`revenue-series-${index}${focus === name ? ' is-focused' : ''}`} isAnimationActive={false} cursor="pointer">
          <LabelList dataKey={name} position="center" fill={color === '#25303e' ? '#fff' : '#142443'} fontSize={10} formatter={(v: number) => v !== 0 && Math.abs(v) >= (percentage ? 6.5 : Math.max(...rows.map(r => r.total)) * multiplier * .065) ? display(v) : ''} />
          {index === series.length - 1 && <LabelList dataKey="total" position="top" fill="#101b40" fontSize={12} fontWeight={700} formatter={(v: number) => percentage && v === 0 ? 'N/A' : display(v)} />}
        </Bar>)}
      </BarChart></ResponsiveContainer>
    </div>
  </section>;
}

export default function RevenuePresentation() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const percentage = (searchParams.get('slide') ?? searchParams.get('view')) === 'percentage';
  const [dataset, setDataset] = useState<ScenarioDataset | null>(null);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('all');
  const [unit, setUnit] = useState('bn');
  useEffect(() => {
    const controller = new AbortController();
    setDataset(null); setError('');
    fetch(`/api/scenarios/${encodeURIComponent(slug)}`, { signal: controller.signal, cache: 'no-store' })
      .then(async res => { if (!res.ok) throw new Error('Data tidak dapat dimuat.'); return res.json(); })
      .then(json => { if (!json.data || json.data.slug !== slug) throw new Error('Skenario tidak ditemukan.'); setDataset(json.data); })
      .catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, [slug]);
  const breakdown = useMemo(() => buildRevenueBreakdown(dataset?.brandBreakdown ?? []), [dataset]);
  const years = breakdown.years.filter(y => period === 'all' || Number(y) <= 2030);
  const unitLabel = percentage ? '%' : unit === 'bn' ? 'IDR Bn' : 'IDR Mn';
  const unavailable = dataset && (!breakdown.years.length || breakdown.unmapped.length > 0);
  return <main className="revenue-deck min-h-screen bg-[#f5f9fb] text-[#101b40] p-5 xl:px-7">
    <nav className="revenue-tools flex items-center justify-between text-xs text-slate-500 mb-4"><Link href={`/p/${slug}`} className="flex gap-2 items-center hover:text-emerald-700"><ArrowLeft size={14} />P&L Deck</Link><div className="flex gap-4"><button onClick={() => window.print()} className="flex gap-1 items-center"><Printer size={14} />Print / PDF</button><button onClick={() => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else document.documentElement.requestFullscreen().catch(() => {}); }} className="flex gap-1 items-center"><Maximize2 size={14} />Fullscreen</button></div></nav>
    <header className="flex flex-wrap items-center justify-between gap-5 mb-6"><div className="flex gap-5 items-center"><Image src="/mra-logo-official.svg" alt="MRA Group" width={121} height={52} className="object-contain" unoptimized /><div><h1 className="text-2xl xl:text-4xl font-bold tracking-tight">Revenue Breakdown by {percentage ? 'Percentage' : 'Value'} ({unitLabel})</h1><p className="text-slate-500 mt-1 text-sm">Growth across segments, brands and business units.</p></div></div>
      <div className="flex flex-wrap gap-3"><div className="flex items-center rounded-xl border border-slate-200 bg-white p-1" role="group" aria-label="Revenue presentation view">{(['value', 'percentage'] as const).map(view => <Link key={view} href={`/p/${slug}/revenue?view=${view}`} aria-current={(percentage ? 'percentage' : 'value') === view ? 'page' : undefined} className={`rounded-lg px-3 py-2 text-sm font-semibold ${(percentage ? 'percentage' : 'value') === view ? 'bg-emerald-700 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>{view === 'value' ? 'Value' : 'Percentage'}</Link>)}</div><select aria-label="Period" value={period} onChange={e => setPeriod(e.target.value)} className="bg-white border border-slate-100 rounded-xl p-3 text-sm"><option value="all">{breakdown.years.length ? `FY${breakdown.years[0].slice(-2)}F – FY${breakdown.years.at(-1)?.slice(-2)}F` : 'All available years'}</option><option value="2030">Through FY30F</option></select>{!percentage && <select aria-label="Currency unit" value={unit} onChange={e => setUnit(e.target.value)} className="bg-emerald-50 rounded-xl p-3 text-sm"><option value="bn">IDR Bn</option><option value="mn">IDR Mn</option></select>}</div>
    </header>
    {percentage && <p className="mb-4 text-xs text-slate-500">Segment percentages use total group revenue; brand percentages use their division total for each year. Percentage means revenue share, not YoY growth. Years with a zero or negative total have no percentage mix.</p>}
    {error ? <p role="alert" className="p-8 bg-white rounded-xl">{error} <button className="underline" onClick={() => window.location.reload()}>Coba lagi</button></p> : !dataset ? <p role="status" className="p-8">Memuat data skenario…</p> : unavailable ? <p role="alert" className="p-8 bg-white rounded-xl">{breakdown.unmapped.length ? `Brand belum memiliki pemetaan segmen: ${breakdown.unmapped.join(', ')}.` : 'Rincian brand lengkap belum tersedia untuk skenario ini.'}</p> : <div className="revenue-grid grid grid-cols-1 lg:grid-cols-2 gap-4">{(Object.keys(revenueSeries) as RevenuePanel[]).map(panel => <RevenueChart key={panel} panel={panel} rows={breakdown.panels[panel].filter(r => years.includes(r.year))} multiplier={unit === 'bn' ? 1 : 1000} unit={unitLabel} percentage={percentage} />)}</div>}
    <footer className="mt-4 flex justify-between items-end gap-4 text-xs text-slate-500"><div><p>{dataset?.title} · Source: saved Brand Revenue Matrix · F = Forecast</p><p className="mt-1">Brand detail available for {breakdown.years[0] ?? '—'}–{breakdown.years.at(-1) ?? '—'}. Broadcast breakdown is unavailable. Totals use unrounded brand values.</p><p className="text-emerald-700 mt-1 text-sm">Strictly Private and Confidential</p></div><Image src="/mra-logo-official.svg" alt="MRA Group" width={82} height={35} className="object-contain shrink-0" unoptimized /></footer>
    <style jsx global>{`@media print { @page { size: A3 landscape; margin: 8mm; } .revenue-tools { display: none !important; } .revenue-deck { padding: 0 !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; } .revenue-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; } .revenue-card { break-inside: avoid; } .revenue-chart { height: 230px !important; min-height: 0 !important; } }`}</style>
  </main>;
}
