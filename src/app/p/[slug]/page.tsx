'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import {
  Maximize2, Minimize2, ArrowLeft, Share2, Database,
  Check, RefreshCw, Sun, Moon, TrendingUp, DollarSign, Layers, Compass
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
  const wfOtherCost = dataset.items['other_expenses']?.values[wfYear] ?? 0;
  const wfTax = dataset.items['income_tax']?.values[wfYear] ?? 0;
  const wfNpat = dataset.items['npat']?.values[wfYear] ?? 0;

  const waterfallData = [
    { name: 'Gross Revenue', value: wfRev, fill: '#3B82F6', isTotal: true },
    { name: '(-) COGS', value: -wfCogs, fill: '#F43F5E' },
    { name: '(=) Gross Profit', value: wfGp, fill: '#059669', isTotal: true },
    { name: '(-) Personnel', value: -wfPersonnel, fill: '#F59E0B' },
    { name: '(-) G&A Exp', value: -wfGa, fill: '#F59E0B' },
    { name: '(-) Marketing', value: -wfMarketing, fill: '#F59E0B' },
    { name: '(-) Fin & Tax', value: -(wfOtherCost + wfTax), fill: '#EF4444' },
    { name: '(=) Net Profit', value: wfNpat, fill: '#10B981', isTotal: true },
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const bgClass = isLightMode ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#070B14] text-slate-100';
  const cardClass = isLightMode 
    ? 'bg-white border-slate-200/90 shadow-md ring-1 ring-black/5' 
    : 'bg-[#101726]/90 border-slate-800/80 shadow-2xl backdrop-blur-md ring-1 ring-white/5';

  if (blackout) {
    return (
      <div 
        onClick={() => setBlackout(false)}
        className="fixed inset-0 bg-black z-50 flex items-center justify-center cursor-pointer select-none"
      >
        <span className="text-slate-700 text-sm font-mono tracking-wider animate-pulse">
          Presentation Paused — Press 'B' or click anywhere to resume
        </span>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} flex flex-col transition-colors duration-300 select-none overflow-x-hidden`}>
      {/* Top Glassmorphic Navigation Bar */}
      <header className={`px-6 py-3 border-b flex items-center justify-between ${
        isLightMode ? 'border-slate-200 bg-white/90' : 'border-slate-800/80 bg-[#0B0F19]/90'
      } backdrop-blur-md sticky top-0 z-40`}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              isLightMode 
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' 
                : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200 shadow'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Admin Studio
          </button>
          <div className="h-4 w-px bg-slate-700/60" />
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20 shadow-sm flex items-center gap-1">
              <Compass className="w-3 h-3" />
              MRA Cockpit
            </span>
            <span className="text-sm font-bold tracking-tight truncate max-w-md text-white">
              {dataset.title}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
              <Database className="w-2.5 h-2.5" />
              PostgreSQL
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Unit Toggle */}
          <div className={`flex rounded-lg border p-0.5 ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-700'}`}>
            <button
              onClick={() => setUnitMode('idrbn')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                unitMode === 'idrbn' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              IDR Billion
            </button>
            <button
              onClick={() => setUnitMode('pct')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                unitMode === 'pct' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              % of Sales
            </button>
          </div>

          {/* Theme Switcher */}
          <button
            onClick={() => setIsLightMode(!isLightMode)}
            title="Toggle Light / Dark Mode (T)"
            className={`p-2 rounded-lg border transition-all ${
              isLightMode ? 'bg-slate-100 border-slate-300 hover:bg-slate-200' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isLightMode ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Share Link Button */}
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-md active:scale-95 ${
              isCopied 
                ? 'bg-emerald-600 text-white border-emerald-500' 
                : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500/80 shadow-blue-600/30'
            }`}
          >
            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            {isCopied ? 'Link Copied!' : 'Share Deck'}
          </button>
        </div>
      </header>

      {/* Main 16:9 Presentation Canvas */}
      <main className="flex-1 p-3 lg:p-5 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            layout
            className={`grid ${
              zoomedQuadrant !== null ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'
            } gap-3.5 flex-1`}
          >
            {/* QUADRANT 1: REVENUE & NET PROFIT TRAJECTORY */}
            {(zoomedQuadrant === null || zoomedQuadrant === 1) && (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className={`rounded-2xl border p-4 flex flex-col justify-between ${cardClass}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                        Quadrant 1
                      </span>
                      <h3 className="text-sm font-bold tracking-tight">
                        Revenue & Net Profit Trajectory (2024 - 2031)
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-bold text-blue-400">
                        2031: {dataset.items['total_revenue']?.values['2031']} IDRbn
                      </div>
                      <div className="text-[10px] text-emerald-400 font-semibold">
                        NPAT: {dataset.items['npat']?.values['2031']} IDRbn
                      </div>
                    </div>
                    <button
                      onClick={() => setZoomedQuadrant(zoomedQuadrant === 1 ? null : 1)}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all hover:scale-105"
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
                      <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? "#E2E8F0" : "#1E293B"} vertical={false} />
                      <XAxis dataKey="year" stroke={isLightMode ? "#64748B" : "#94A3B8"} fontSize={11} />
                      <YAxis stroke={isLightMode ? "#64748B" : "#94A3B8"} fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isLightMode ? '#FFFFFF' : '#0F172A',
                          borderColor: isLightMode ? '#CBD5E1' : '#334155',
                          borderRadius: 10,
                          fontSize: 12,
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar
                        dataKey="revenue"
                        name="Total Revenue (IDRbn)"
                        fill="#3B82F6"
                        radius={[6, 6, 0, 0]}
                        isAnimationActive={true}
                        animationDuration={1200}
                      />
                      <Line
                        type="monotone"
                        dataKey="npat"
                        name="Net Profit (IDRbn)"
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#FFFFFF' }}
                        isAnimationActive={true}
                        animationDuration={1500}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {/* QUADRANT 2: EBITDA & MARGIN EXPANSION */}
            {(zoomedQuadrant === null || zoomedQuadrant === 2) && (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className={`rounded-2xl border p-4 flex flex-col justify-between ${cardClass}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <DollarSign className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        Quadrant 2
                      </span>
                      <h3 className="text-sm font-bold tracking-tight">
                        EBITDA (After Holding Cost) & Margin Trajectory
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-bold text-amber-400">
                        2031: {dataset.items['ebitda_after_holding']?.values['2031']} IDRbn
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Margin: {chartData[chartData.length - 1]?.ebitdaMargin}%
                      </div>
                    </div>
                    <button
                      onClick={() => setZoomedQuadrant(zoomedQuadrant === 2 ? null : 2)}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all hover:scale-105"
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
                        <linearGradient id="ebitdaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? "#E2E8F0" : "#1E293B"} vertical={false} />
                      <XAxis dataKey="year" stroke={isLightMode ? "#64748B" : "#94A3B8"} fontSize={11} />
                      <YAxis yAxisId="left" stroke={isLightMode ? "#64748B" : "#94A3B8"} fontSize={11} />
                      <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" fontSize={11} unit="%" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isLightMode ? '#FFFFFF' : '#0F172A',
                          borderColor: isLightMode ? '#CBD5E1' : '#334155',
                          borderRadius: 10,
                          fontSize: 12,
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
                        fill="url(#ebitdaGrad)"
                        isAnimationActive={true}
                        animationDuration={1300}
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
              </motion.div>
            )}

            {/* QUADRANT 3: COST STRUCTURE COMPOSITION */}
            {(zoomedQuadrant === null || zoomedQuadrant === 3) && (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className={`rounded-2xl border p-4 flex flex-col justify-between ${cardClass}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <Layers className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                        Quadrant 3
                      </span>
                      <h3 className="text-sm font-bold tracking-tight">
                        Cost Structure Evolution (COGS vs OPEX vs Margin)
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setZoomedQuadrant(zoomedQuadrant === 3 ? null : 3)}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all hover:scale-105"
                    title={zoomedQuadrant === 3 ? "Restore 4-Quadrant View (Esc)" : "Zoom Quadrant 3"}
                  >
                    {zoomedQuadrant === 3 ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex-1 min-h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} stackOffset="expand">
                      <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? "#E2E8F0" : "#1E293B"} vertical={false} />
                      <XAxis dataKey="year" stroke={isLightMode ? "#64748B" : "#94A3B8"} fontSize={11} />
                      <YAxis
                        stroke={isLightMode ? "#64748B" : "#94A3B8"}
                        fontSize={11}
                        tickFormatter={(val) => `${Math.round(val * 100)}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isLightMode ? '#FFFFFF' : '#0F172A',
                          borderColor: isLightMode ? '#CBD5E1' : '#334155',
                          borderRadius: 10,
                          fontSize: 12,
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
              </motion.div>
            )}

            {/* QUADRANT 4: P&L STEP-DOWN WATERFALL BRIDGE */}
            {(zoomedQuadrant === null || zoomedQuadrant === 4) && (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className={`rounded-2xl border p-4 flex flex-col justify-between ${cardClass}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Compass className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        Quadrant 4
                      </span>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold tracking-tight">
                          P&L Step-Down Bridge
                        </h3>
                        <select
                          value={selectedWaterfallYear}
                          onChange={(e) => setSelectedWaterfallYear(e.target.value)}
                          className={`text-xs rounded-md px-2 py-0.5 border font-semibold outline-none ${
                            isLightMode 
                              ? 'bg-slate-100 border-slate-300 text-slate-800' 
                              : 'bg-slate-800 border-slate-700 text-slate-200 focus:border-emerald-500'
                          }`}
                        >
                          {chartYears.map(y => (
                            <option key={y} value={y}>{y} {parseInt(y) === 2026 ? '(Projection)' : parseInt(y) >= 2027 ? '(Plan)' : ''}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setZoomedQuadrant(zoomedQuadrant === 4 ? null : 4)}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all hover:scale-105"
                    title={zoomedQuadrant === 4 ? "Restore 4-Quadrant View (Esc)" : "Zoom Quadrant 4"}
                  >
                    {zoomedQuadrant === 4 ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex-1 min-h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={waterfallData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? "#E2E8F0" : "#1E293B"} vertical={false} />
                      <XAxis dataKey="name" stroke={isLightMode ? "#64748B" : "#94A3B8"} fontSize={10} interval={0} angle={-15} textAnchor="end" height={45} />
                      <YAxis stroke={isLightMode ? "#64748B" : "#94A3B8"} fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isLightMode ? '#FFFFFF' : '#0F172A',
                          borderColor: isLightMode ? '#CBD5E1' : '#334155',
                          borderRadius: 10,
                          fontSize: 12,
                        }}
                        formatter={(val: any) => [`${Math.abs(val)} IDRbn`, 'Amount']}
                      />
                      <ReferenceLine y={0} stroke="#94A3B8" />
                      <Bar
                        dataKey="value"
                        name="Amount (IDRbn)"
                        radius={[6, 6, 0, 0]}
                        isAnimationActive={true}
                        animationDuration={1200}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Presentation Footer Bar */}
      <footer className={`px-6 py-2.5 border-t flex items-center justify-between text-xs ${
        isLightMode ? 'border-slate-200 bg-white text-slate-500' : 'border-slate-800/80 bg-[#0B0F19] text-slate-400'
      }`}>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-400">Hotkeys:</span>
          <span className="font-mono bg-slate-800/90 px-2 py-0.5 rounded text-[11px] text-slate-300 border border-slate-700/60">F: Fullscreen</span>
          <span className="font-mono bg-slate-800/90 px-2 py-0.5 rounded text-[11px] text-slate-300 border border-slate-700/60">T: Theme</span>
          <span className="font-mono bg-slate-800/90 px-2 py-0.5 rounded text-[11px] text-slate-300 border border-slate-700/60">B: Blackout</span>
          <span className="font-mono bg-slate-800/90 px-2 py-0.5 rounded text-[11px] text-slate-300 border border-slate-700/60">Esc: Restore Zoom</span>
        </div>
        <div className="text-slate-500 font-medium">
          MRA Corporate Planning & Finance &copy; 2026. PostgreSQL Live Sync Active.
        </div>
      </footer>
    </div>
  );
}
