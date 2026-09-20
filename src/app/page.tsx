import Image from 'next/image';
import Link from 'next/link';
import { getAllScenarios } from '@/lib/data-service';
import { INITIAL_DATASET } from '@/lib/initial-data';
import {
  ArrowRight, ArrowUpRight, BarChart3, CalendarDays, CheckCircle2,
  Database, Layers3, MonitorPlay, Settings, ShieldCheck,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const number = (value: number) => value.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export default async function HomePage() {
  const scenarios = await getAllScenarios();
  const primary = scenarios[0] ?? INITIAL_DATASET;
  const revenue2031 = primary.items.total_revenue?.values['2031'] ?? 0;
  const ebitda2031 = primary.items.ebitda_after_holding?.values['2031'] ?? 0;
  const ebitdaMargin = revenue2031 > 0 ? ebitda2031 / revenue2031 * 100 : 0;

  return (
    <div className="min-h-screen bg-[#f6f9fb] text-[#17324a] selection:bg-emerald-200 selection:text-emerald-950">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-40 -top-44 h-[520px] w-[520px] rounded-full bg-emerald-300/20 blur-[110px]" />
        <div className="absolute -bottom-56 -left-36 h-[520px] w-[520px] rounded-full bg-blue-200/25 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(148,163,184,.13)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.13)_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      <header className="relative z-20 border-b border-slate-200/80 bg-white/85 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-6 py-4 lg:px-10">
          <Link href="/" className="flex items-center gap-4" aria-label="MRA Group home">
            <span className="flex h-12 w-[118px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
              <Image src="/mra-logo-official.svg" alt="MRA Group" width={102} height={38} priority unoptimized />
            </span>
            <span className="hidden border-l border-slate-200 pl-4 sm:block">
              <strong className="block text-sm font-semibold tracking-tight text-[#17324a]">Corporate Planning &amp; Finance</strong>
              <span className="mt-0.5 block text-[10px] uppercase tracking-[0.18em] text-slate-400">Business Plan 2025–2031</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/admin" className="home-admin-glow inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50/50">
              <Settings size={15} className="text-slate-500" /> Admin Data Studio
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1440px] px-6 pb-14 pt-14 lg:px-10 lg:pt-20">
        <section className="grid items-center gap-12 lg:grid-cols-[1.08fr_.92fr] lg:gap-20">
          <div>
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
              <span className="h-px w-9 bg-emerald-500" aria-hidden="true" />
              MRA Group · Executive Planning
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.04] tracking-[-0.05em] text-[#102a43] sm:text-5xl lg:text-[56px]">
              Financial planning<span className="block text-slate-500">presented with clarity.</span>
            </h1>
            <p className="mt-6 max-w-[640px] text-sm leading-7 text-slate-600 sm:text-[15px]">
              One source for MRA Group’s consolidated plan, brand revenue, and executive presentation.
              <span className="block">Review scenarios, maintain figures, and present the latest approved view.</span>
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/deck/${primary.slug}?slide=highlights`} className="inline-flex items-center gap-2.5 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(5,150,105,.22)] transition hover:bg-emerald-500 active:scale-[.98]">
                <MonitorPlay size={17} /> Launch Executive Presentation <ArrowRight size={15} />
              </Link>
              <Link href="/admin" className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
                <BarChart3 size={17} className="text-slate-500" /> Open Planning Workspace
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-slate-200 pt-6 text-[11px] text-slate-500">
              <span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> One synchronized dataset</span>
              <span className="flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500" /> Scenario-level control</span>
              <span className="flex items-center gap-2"><Layers3 size={14} className="text-emerald-500" /> Three connected presentation views</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[28px] bg-gradient-to-br from-emerald-200/60 via-transparent to-blue-100/50 blur-xl" />
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-[0_24px_70px_rgba(30,64,92,.12)]">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Active baseline</p><h2 className="mt-1.5 text-base font-semibold text-[#17324a]">2031 Plan Outlook</h2></div>
                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-semibold text-emerald-700">LIVE</span>
              </div>

              <div className="grid grid-cols-2 gap-px bg-slate-200">
                <div className="bg-white p-6"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">Net Revenue</p><p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#17324a]">{number(revenue2031)}</p><p className="mt-1 text-[10px] text-slate-400">IDR Billion</p></div>
                <div className="bg-white p-6"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">EBITDA Margin</p><p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-emerald-600">{number(ebitdaMargin)}%</p><p className="mt-1 text-[10px] text-slate-400">After holding cost</p></div>
              </div>

              <div className="space-y-4 p-6">
                <div className="flex items-center justify-between text-[10px]"><span className="text-slate-500">Presentation sequence</span><span className="text-slate-700">3 executive views</span></div>
                <div className="grid grid-cols-3 gap-2">
                  {['Highlights', 'Percentage', 'Value'].map((view, index) => <div key={view} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"><span className="text-[9px] text-slate-400">0{index + 1}</span><p className="mt-1 text-[10px] font-semibold text-slate-700">{view}</p></div>)}
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-[10px] text-emerald-700"><Database size={13} /> Figures follow the currently saved scenario</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20 lg:mt-24">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-600">Scenario library</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#17324a]">Select a planning scenario</h2><p className="mt-1 text-xs text-slate-500">Open a synchronized presentation or continue working in the Admin Studio.</p></div>
            <Link href="/admin" className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 transition hover:text-emerald-600">Create or manage scenarios <ArrowUpRight size={14} /></Link>
          </div>

          <div className="grid gap-4">
            {scenarios.map((scenario, index) => {
              const isBaseline = scenario.slug === INITIAL_DATASET.slug;
              const scenarioRevenue = scenario.items.total_revenue?.values['2031'] ?? 0;
              return (
                <article key={scenario.slug} className="group grid items-center gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(30,64,92,.06)] transition hover:border-emerald-300 hover:shadow-[0_14px_36px_rgba(30,64,92,.1)] md:grid-cols-[minmax(0,1fr)_auto] md:p-6">
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-600">{String(index + 1).padStart(2, '0')}</div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5"><h3 className="truncate text-sm font-semibold text-[#17324a]">{scenario.title}</h3><span className={`rounded-md border px-2 py-0.5 text-[9px] font-semibold ${isBaseline ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>{isBaseline ? 'Master baseline' : 'Custom scenario'}</span></div>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-[10px] text-slate-500"><span className="font-mono">{scenario.slug}</span><span className="flex items-center gap-1.5"><CalendarDays size={12} /> Updated {new Date(scenario.updatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span><span>FY31 Revenue: <strong className="font-semibold text-slate-700">{number(scenarioRevenue)} IDR Bn</strong></span></div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <Link href="/admin" className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800">Edit Data</Link>
                    <Link href={`/deck/${scenario.slug}?slide=highlights`} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-500 active:scale-[.98]"><MonitorPlay size={14} /> Launch Presentation <ArrowRight size={13} /></Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-slate-200 bg-white/50">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-6 py-5 text-[10px] text-slate-400 lg:px-10"><span>MRA Group · Corporate Planning &amp; Finance</span><span>Strictly Private &amp; Confidential · Business Plan 2025–2031</span></div>
      </footer>
    </div>
  );
}
