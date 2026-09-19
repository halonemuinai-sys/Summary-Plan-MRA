'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import {
  Maximize2, Minimize2, ArrowLeft, Share2, Eye, Sliders,
  Check, RefreshCw, Sun, Moon, MonitorPlay
} from 'lucide-react';
import { ScenarioDataset } from '@/lib/types';
import { INITIAL_DATASET } from '@/lib/initial-data';
import { buildChartData } from '@/lib/formula-engine';

export default function PresentationPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || 'mra-altius-base-2025-2031';

  const [dataset, setDataset] = useState<ScenarioDataset>(INITIAL_DATASET);
  const [loading, setLoading] = useState(true);
  const [activeYearHover, setActiveYearHover] = useState<string | null>(null);
  const [zoomedQuadrant, setZoomedQuadrant] = useState<number | null>(null);
  const [selectedWaterfallYear, setSelectedWaterfallYear] = useState('2026');
  const [unitMode, setUnitMode] = useState<'idrbn' | 'pct'>('idrbn');
  const [isCopied, setIsCopied] = useState(false);
  const [blackout, setBlackout] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    async function loadScenario() {
      try {
        setLoading(true);
        const res = await fetch(`/api/scenarios/${slug}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setDataset(json.data);
          }
        }
      } catch (err) {
        console.error('Error fetching scenario, using default:', err);
      } finally {
        setLoading(false);
      }
    }
    loadScenario();
  }, [slug]);

  // Keyboard navigation & presentation hotkeys
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (zoomedQuadrant !== null) setZoomedQuadrant(null);
        if (blackout) setBlackout(false);
      } else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      } else if (e.key === 'b' || e.key === 'B') {
        setBlackout(prev => !prev);
      } else if (e.key === 't' || e.key === 'T') {
        setIsLightMode(prev => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomedQuadrant, blackout]);

  const chartYears = dataset.years.filter(y => parseInt(y) >= 2024);
  const chartData = buildChartData(dataset.items, chartYears);

  // Compute waterfall data for the selected year
  const wfYear = selectedWaterfallYear;
  const wfRev = dataset.items['total_revenue']?.values[wfYear] ?? 0;
  const wfCogs = dataset.items['cogs']?.values[wfYear] ?? 0;
  const wfGp = wfRev - wfCogs;
  const wfPersonnel = dataset.items['personnel']?.values[wfYear] ?? 0;
  const wfMarketing = dataset.items['marketing']?.values[wfYear] ?? 0;
  const wfGa = dataset.items['ga_expenses']?.values[wfYear] ?? 0;
  const wfConstant = dataset.items['constant_expenses']?.values[wfYear] ?? 0;
  const wfOtherOpex = (dataset.items['total_opex']?.values[wfYear] ?? 0) - (wfPersonnel + wfMarketing + wfGa);
  const wfOtherCost = dataset.items['other_expenses']?.values[wfYear] ?? 0;
  const wfTax = dataset.items['income_tax']?.values[wfYear] ?? 0;
  const wfNpat = dataset.items['npat']?.values[wfYear] ?? 0;

  const waterfallData = [
    { name: 'Gross Revenue', value: wfRev, fill: '#2563EB', isTotal: true },
    { name: '(-) COGS / HPP', value: -wfCogs, fill: '#F43F5E' },
    { name: '(=) Gross Profit', value: wfGp, fill: '#059669', isTotal: true },
    { name: '(-) Personnel', value: -wfPersonnel, fill: '#F59E0B' },
    { name: '(-) G&A Expenses', value: -wfGa, fill: '#F59E0B' },
    { name: '(-) Marketing', value: -wfMarketing, fill: '#F59E0B' },
    { name: '(-) Finance & Tax', value: -(wfOtherCost + wfTax), fill: '#EF4444' },
    { name: '(=) Net Profit', value: wfNpat, fill: '#10B981', isTotal: true },
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const bgClass = isLightMode ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#0B0F19] text-slate-100';
  const cardClass = isLightMode 
    ? 'bg-white border-slate-200 shadow-sm' 
    : 'bg-[#111827] border-slate-800 shadow-xl';
  const textMuted = isLightMode ? 'text-slate-500' : 'text-slate-400';

  if (blackout) {
    return (
      <div 
        onClick={() => setBlackout(false)}
        className="fixed inset-0 bg-black z-50 flex items-center justify-center cursor-pointer select-none"
      >
        <span className="text-slate-700 text-sm font-mono">Screen paused (Press 'B' or click to resume)</span>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} flex flex-col transition-colors duration-300`}>
      {/* Top Navigation Bar */}
      <header className={`px-6 py-3 border-b flex items-center justify-between ${isLightMode ? 'border-slate-200 bg-white' : 'border-slate-800/80 bg-[#0B0F19]/90 backdrop-blur-md'} sticky top-0 z-40`}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
              isLightMode ? 'bg-slate-100 hover:bg-slate-200 border-slate-300' : 'bg-slate-800/60 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Admin Studio
          </button>
          <div className="h-4 w-px bg-slate-700" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">
                MRA Executive Cockpit
              </span>
              <span className="text-sm font-bold truncate max-w-md">
                {dataset.title}
              </span>
            </div>
          </div>
        </div>

        {/* Controls and Toggles */}
        <div className="flex items-center gap-3">
          {/* Unit Toggle */}
          <div className={`flex rounded-lg border p-0.5 ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-700'}`}>
            <button
              onClick={() => setUnitMode('idrbn')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                unitMode === 'idrbn' 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              IDR Billion
            </button>
            <button
              onClick={() => setUnitMode('pct')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                unitMode === 'pct' 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              % of Sales
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsLightMode(!isLightMode)}
            title="Toggle Light / Dark Mode (T)"
            className={`p-2 rounded-lg border transition-all ${
              isLightMode ? 'bg-slate-100 border-slate-300 hover:bg-slate-200' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isLightMode ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Share Link */}
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isCopied 
                ? 'bg-emerald-600 text-white border-emerald-500' 
                : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500'
            }`}
          >
            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            {isCopied ? 'Link Copied!' : 'Share Link'}
          </button>
        </div>
      </header>

      {/* Main 16:9 Presentation Canvas */}
      <main className="flex-1 p-4 lg:p-6 flex flex-col justify-center">
        {/* 4 Quadrants Grid */}
        <div className={`grid ${zoomedQuadrant !== null ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-4 flex-1`}>

          {/* QUADRANT 1: REVENUE & NET PROFIT TRAJECTORY */}
          {(zoomedQuadrant === null || zoomedQuadrant === 1) && (
            <div className={`rounded-xl border p-4 flex flex-col transition-all duration-200 ${cardClass}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                    Quadrant 1
                  </span>
                  <h3 className="text-sm font-bold">
                    Revenue & Net Profit Trajectory (2024 - 2031)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-2 hidden sm:block">
                    <div className="text-xs font-bold text-blue-500">
                      {dataset.items['total_revenue']?.values['2031']} IDRbn
                    </div>
                    <div className="text-[10px] text-emerald-400 font-semibold">
                      NPAT: {dataset.items['npat']?.values['2031']} IDRbn (2031 Plan)
                    </div>
                  </div>
                  <button
                    onClick={() => setZoomedQuadrant(zoomedQuadrant === 1 ? null : 1)}
                    className="p-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-700 border border-slate-700 text-slate-300"
                    title={zoomedQuadrant === 1 ? "Restore 4-Quadrant View (Esc)" : "Zoom Quadrant 1"}
                  >
                    {zoomedQuadrant === 1 ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    onMouseMove={(state) => {
                      if (state?.activeLabel) setActiveYearHover(state.activeLabel);
                    }}
                    onMouseLeave={() => setActiveYearHover(null)}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? "#E2E8F0" : "#1F2937"} vertical={false} />
                    <XAxis dataKey="year" stroke={isLightMode ? "#64748B" : "#94A3B8"} fontSize={11} />
                    <YAxis stroke={isLightMode ? "#64748B" : "#94A3B8"} fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isLightMode ? '#FFFFFF' : '#111827',
                        borderColor: isLightMode ? '#CBD5E1' : '#374151',
                        borderRadius: 8,
                        fontSize: 12
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar
                      dataKey="revenue"
                      name="Total Revenue (IDRbn)"
                      fill="#2563EB"
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      type="monotone"
                      dataKey="npat"
                      name="Net Profit (IDRbn)"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#10B981' }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* QUADRANT 2: EBITDA & MARGIN EXPANSION */}
          {(zoomedQuadrant === null || zoomedQuadrant === 2) && (
            <div className={`rounded-xl border p-4 flex flex-col transition-all duration-200 ${cardClass}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Quadrant 2
                  </span>
                  <h3 className="text-sm font-bold">
                    EBITDA (After Holding Cost) & Margin Trajectory
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-2 hidden sm:block">
                    <div className="text-xs font-bold text-amber-400">
                      {dataset.items['ebitda_after_holding']?.values['2031']} IDRbn
                    </div>
                    <div className="text-[10px] text-slate-400">
                      EBITDA Margin: {chartData[chartData.length - 1]?.ebitdaMargin}%
                    </div>
                  </div>
                  <button
                    onClick={() => setZoomedQuadrant(zoomedQuadrant === 2 ? null : 2)}
                    className="p-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-700 border border-slate-700 text-slate-300"
                    title={zoomedQuadrant === 2 ? "Restore 4-Quadrant View (Esc)" : "Zoom Quadrant 2"}
                  >
                    {zoomedQuadrant === 2 ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="ebitdaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? "#E2E8F0" : "#1F2937"} vertical={false} />
                    <XAxis dataKey="year" stroke={isLightMode ? "#64748B" : "#94A3B8"} fontSize={11} />
                    <YAxis yAxisId="left" stroke={isLightMode ? "#64748B" : "#94A3B8"} fontSize={11} />
                    <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" fontSize={11} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isLightMode ? '#FFFFFF' : '#111827',
                        borderColor: isLightMode ? '#CBD5E1' : '#374151',
                        borderRadius: 8,
                        fontSize: 12
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="ebitda"
                      name="EBITDA (IDRbn)"
                      stroke="#F59E0B"
                      strokeWidth={2.5}
                      fill="url(#ebitdaGradient)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="ebitdaMargin"
                      name="EBITDA Margin %"
                      stroke="#38BDF8"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* QUADRANT 3: COST STRUCTURE COMPOSITION */}
          {(zoomedQuadrant === null || zoomedQuadrant === 3) && (
            <div className={`rounded-xl border p-4 flex flex-col transition-all duration-200 ${cardClass}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                    Quadrant 3
                  </span>
                  <h3 className="text-sm font-bold">
                    Cost Structure Evolution (COGS vs OPEX vs Margin)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setZoomedQuadrant(zoomedQuadrant === 3 ? null : 3)}
                    className="p-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-700 border border-slate-700 text-slate-300"
                    title={zoomedQuadrant === 3 ? "Restore 4-Quadrant View (Esc)" : "Zoom Quadrant 3"}
                  >
                    {zoomedQuadrant === 3 ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} stackOffset="expand">
                    <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? "#E2E8F0" : "#1F2937"} vertical={false} />
                    <XAxis dataKey="year" stroke={isLightMode ? "#64748B" : "#94A3B8"} fontSize={11} />
                    <YAxis
                      stroke={isLightMode ? "#64748B" : "#94A3B8"}
                      fontSize={11}
                      tickFormatter={(val) => `${Math.round(val * 100)}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isLightMode ? '#FFFFFF' : '#111827',
                        borderColor: isLightMode ? '#CBD5E1' : '#374151',
                        borderRadius: 8,
                        fontSize: 12
                      }}
                      formatter={(val: any, name: any) => [`${val} IDRbn`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="cogs" name="COGS / HPP" stackId="a" fill="#F43F5E" />
                    <Bar dataKey="opex" name="Total OPEX" stackId="a" fill="#FB923C" />
                    <Bar dataKey="npat" name="Net Profit Margin" stackId="a" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* QUADRANT 4: P&L STEP-DOWN WATERFALL BRIDGE */}
          {(zoomedQuadrant === null || zoomedQuadrant === 4) && (
            <div className={`rounded-xl border p-4 flex flex-col transition-all duration-200 ${cardClass}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Quadrant 4
                  </span>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold">
                      P&L Step-Down Bridge
                    </h3>
                    <select
                      value={selectedWaterfallYear}
                      onChange={(e) => setSelectedWaterfallYear(e.target.value)}
                      className={`text-xs rounded px-2 py-0.5 border font-semibold ${
                        isLightMode 
                          ? 'bg-slate-100 border-slate-300 text-slate-800' 
                          : 'bg-slate-800 border-slate-700 text-slate-200'
                      }`}
                    >
                      {chartYears.map(y => (
                        <option key={y} value={y}>{y} {parseInt(y) === 2026 ? '(Projection)' : parseInt(y) >= 2027 ? '(Plan)' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setZoomedQuadrant(zoomedQuadrant === 4 ? null : 4)}
                    className="p-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-700 border border-slate-700 text-slate-300"
                    title={zoomedQuadrant === 4 ? "Restore 4-Quadrant View (Esc)" : "Zoom Quadrant 4"}
                  >
                    {zoomedQuadrant === 4 ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={waterfallData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? "#E2E8F0" : "#1F2937"} vertical={false} />
                    <XAxis dataKey="name" stroke={isLightMode ? "#64748B" : "#94A3B8"} fontSize={10} interval={0} angle={-15} textAnchor="end" height={45} />
                    <YAxis stroke={isLightMode ? "#64748B" : "#94A3B8"} fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isLightMode ? '#FFFFFF' : '#111827',
                        borderColor: isLightMode ? '#CBD5E1' : '#374151',
                        borderRadius: 8,
                        fontSize: 12
                      }}
                      formatter={(val: any) => [`${Math.abs(val)} IDRbn`, 'Amount']}
                    />
                    <ReferenceLine y={0} stroke="#94A3B8" />
                    <Bar
                      dataKey="value"
                      name="Amount (IDRbn)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Presentation Footer Bar */}
      <footer className={`px-6 py-2 border-t flex items-center justify-between text-xs ${isLightMode ? 'border-slate-200 bg-white text-slate-500' : 'border-slate-800 bg-[#0B0F19] text-slate-400'}`}>
        <div className="flex items-center gap-3">
          <span>Keyboard Hotkeys:</span>
          <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-[11px] text-slate-300">F: Fullscreen</span>
          <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-[11px] text-slate-300">T: Theme</span>
          <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-[11px] text-slate-300">B: Blackout</span>
          <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-[11px] text-slate-300">Esc: Restore Zoom</span>
        </div>
        <div>
          MRA Corporate Planning & Finance &copy; 2026. Altius Rev3 Model.
        </div>
      </footer>
    </div>
  );
}
