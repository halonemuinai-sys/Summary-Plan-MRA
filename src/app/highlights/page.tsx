'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, BarChart, Bar, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, LabelList
} from 'recharts';
import {
  BarChart3, Coins, PieChart as PieIcon, TrendingUp,
  ArrowLeft, Sun, Moon, Maximize2, Minimize2,
  Settings, Check, Copy, Sparkles, Filter
} from 'lucide-react';
import { FinancialHighlightsData } from '@/lib/types';
import { INITIAL_HIGHLIGHTS_DATA } from '@/lib/highlights-data';
import { deriveMargins } from '@/lib/highlights-margins';
import { useDeckExport } from '@/components/DeckExportContext';
import HighlightsTooltip from '@/components/HighlightsTooltip';
import { formatHighlightBarLabel, formatHighlightValue } from '@/lib/highlights-format';
import { barAxis } from '@/lib/highlights-axis';

// One colour per P&L line, used by every chart on this slide so a series keeps its identity.
// Checked with the data-viz palette validator on the light surface: lightness band, chroma floor,
// colour-blind separation and normal-vision separation all pass. The previous set failed the last one
// (a tan EBIT next to an orange EAT), which is why those two bars were hard to tell apart.
// Night mode is not an automatic flip: these are the same four hues stepped for a dark surface,
// and validated against it separately.
type SeriesColours = { gp: string; ebitda: string; ebit: string; eat: string };
const SERIES_LIGHT: SeriesColours = { gp: '#1baf7a', ebitda: '#2a78d6', ebit: '#eb6834', eat: '#4a3aa7' };
const SERIES_DARK: SeriesColours = { gp: '#199e70', ebitda: '#3987e5', ebit: '#d95926', eat: '#9085e9' };

export default function FinancialHighlightsPage() {
  const exportSlide = useDeckExport();
  const [loadError, setLoadError] = useState(false);
  const [data, setData] = useState<FinancialHighlightsData>(INITIAL_HIGHLIGHTS_DATA);
  const [unitMode, setUnitMode] = useState<'bn' | 'mn'>('bn');
  const [filterMode, setFilterMode] = useState<'all' | 'actual' | 'forecast'>('all');
  const [isLightMode, setIsLightMode] = useState(true); // Default matching presentation image (clean white)
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load from API / PostgreSQL
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/highlights');
        if (!res.ok) throw new Error('Highlights could not be loaded');
        if (res.ok) {
          const json = await res.json();
          if (!json.data) throw new Error('Highlights are unavailable');
          if (json.data) {
            setData(json.data);
          }
        }
      } catch (e) {
        setLoadError(true);
        console.error('Error fetching highlights:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Hotkeys
  useEffect(() => {
    if (exportSlide) return;
    function handleKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.closest('input, select, textarea, [contenteditable="true"]')) return;
      if (e.key === 't' || e.key === 'T') {
        setIsLightMode((prev) => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // The slide starts at FY26F, so every year on it is a forecast. Telling Actual from Forecast only
  // says something while both are there.
  const hasActual = data.revenueTrajectory.some((pt) => !pt.isForecast);
  const hasForecast = data.revenueTrajectory.some((pt) => pt.isForecast);
  const canFilter = hasActual && hasForecast;
  const shownFilter = canFilter ? filterMode : 'all';

  const scaleMultiplier = unitMode === 'mn' ? 1000 : 1;
  const unitLabel = unitMode === 'mn' ? 'IDR Mn' : 'IDR Bn';

  // Format data according to unit and filter
  const formattedRevenue = data.revenueTrajectory
    .filter((pt) => {
      if (shownFilter === 'actual') return !pt.isForecast;
      if (shownFilter === 'forecast') return pt.isForecast;
      return true;
    })
    .map((pt) => ({
      ...pt,
      displayValue: pt.value * scaleMultiplier,
      actualValue: !pt.isForecast ? pt.value * scaleMultiplier : null,
      forecastValue: pt.isForecast ? pt.value * scaleMultiplier : null,
    }));

  // Margins come from the figures above them rather than a stored copy that could go stale
  const marginsData = deriveMargins(data.revenueTrajectory, data.pnlTrajectory);

  const formattedPnl = data.pnlTrajectory.map((pt) => ({
    year: pt.year,
    gp: pt.gp * scaleMultiplier,
    ebitda: pt.ebitda * scaleMultiplier,
    ebit: pt.ebit * scaleMultiplier,
    eat: pt.eat * scaleMultiplier,
  }));

  // The axis follows the figures, so the bars use the height of the chart instead of being pushed up
  // into a corner by a floor left over from one small loss
  const pnlAxis = barAxis(formattedPnl.flatMap((pt) => [pt.gp, pt.ebitda, pt.ebit, pt.eat]));

  // Style tokens matching the attached slide
  const pageBg = isLightMode ? 'bg-[#F4F6F8] text-slate-800' : 'bg-[#070B14] text-slate-100';
  const cardBg = isLightMode
    ? 'bg-white border-slate-200 shadow-sm'
    : 'bg-[#101726]/95 border-slate-800 shadow-xl';
  const subText = isLightMode ? 'text-slate-500' : 'text-slate-400';
  const gridStroke = isLightMode ? '#E2E8F0' : '#1E293B';
  const axisColor = isLightMode ? '#64748B' : '#94A3B8';
  const series = isLightMode ? SERIES_LIGHT : SERIES_DARK;

  return (
    <div data-export-ready={!loading && !loadError} data-export-error={loadError} className={`highlights-presentation min-h-screen ${pageBg} flex flex-col justify-between p-4 lg:p-6 select-none font-sans transition-colors duration-300`}>
      {/* SVG Defs for striped forecast bars */}
      <svg className="h-0 w-0 absolute">
        <defs>
          <pattern id="forecastStripe" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="4" height="8" fill={isLightMode ? "#8fdcbe" : "#0e5c41"} />
            <rect x="4" width="4" height="8" fill={isLightMode ? "#D8F3DC" : "#022C22"} />
          </pattern>
        </defs>
      </svg>

      {/* TOP HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-[93px] shrink-0">
            <Image
              src="/mra-logo-official.svg"
              alt="MRA Group"
              width={93}
              height={40}
              className="object-contain"
              priority
              unoptimized
            />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-extrabold tracking-tight leading-tight">
              {data.title}
            </h1>
            <p className={`text-xs ${subText} font-medium tracking-wide`}>
              {data.subtitle}
            </p>
          </div>
        </div>

        {/* Right Controls matching the attached mockup */}
        <div className="flex items-center gap-2.5">
          {/* Unit Toggle (IDR Bn / IDR Mn) */}
          <div className={`flex rounded-lg border p-0.5 ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-700'}`}>
            <button
              onClick={() => setUnitMode('bn')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                unitMode === 'bn'
                  ? 'bg-[#0E3E2F] text-white shadow'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              IDR Bn
            </button>
            <button
              onClick={() => setUnitMode('mn')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                unitMode === 'mn'
                  ? 'bg-[#0E3E2F] text-white shadow'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              IDR Mn
            </button>
          </div>

          {/* Actual & Forecast Filter Dropdown */}
          {canFilter && (
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as any)}
              className={`text-xs rounded-lg border px-3 py-1.5 font-semibold outline-none transition-colors ${
                isLightMode ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            >
              <option value="all">Actual &amp; Forecast</option>
              <option value="actual">Actual Only</option>
              <option value="forecast">Forecast Only</option>
            </select>
          )}

          {/* Theme Switcher */}
          <button
            onClick={() => setIsLightMode(!isLightMode)}
            title="Toggle Light / Night Mode (T)"
            className={`p-2 rounded-lg border transition-all ${
              isLightMode ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
            }`}
          >
            {isLightMode ? <Moon size={14} /> : <Sun size={14} />}
          </button>

          {/* Copy Deck Link */}
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              isLightMode ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {copiedLink ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            {copiedLink ? 'Copied' : 'Share'}
          </button>

          {/* Back to Admin Studio */}
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0E3E2F] hover:bg-[#0B3125] text-white shadow transition-all active:scale-95"
          >
            <Settings size={13} />
            <span>Admin Studio</span>
          </Link>
        </div>
      </header>

      {/* TOP 4 KPI CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
        {/* Card 1: Revenue */}
        <div className={`rounded-xl p-3.5 border transition-all flex items-center justify-between ${cardBg}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center">
              <BarChart3 size={20} />
            </div>
            <div>
              <p className={`text-[11px] font-bold ${subText} uppercase tracking-wider`}>
                FY30F Revenue
              </p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black tracking-tight">
                  {formatHighlightValue(data.kpis.revenue.value * scaleMultiplier)}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {unitLabel}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-0.5">
              ↑ +{data.kpis.revenue.yoyPct}%
            </span>
            <span className={`text-[10px] ${subText}`}>
              {data.kpis.revenue.yoyText}
            </span>
          </div>
        </div>

        {/* Card 2: EBITDA */}
        <div className={`rounded-xl p-3.5 border transition-all flex items-center justify-between ${cardBg}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center">
              <Coins size={20} />
            </div>
            <div>
              <p className={`text-[11px] font-bold ${subText} uppercase tracking-wider`}>
                FY30F EBITDA
              </p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black tracking-tight">
                  {formatHighlightValue(data.kpis.ebitda.value * scaleMultiplier)}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {unitLabel}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-0.5">
              ↑ +{data.kpis.ebitda.yoyPct}%
            </span>
            <span className={`text-[10px] ${subText}`}>
              {data.kpis.ebitda.yoyText}
            </span>
          </div>
        </div>

        {/* Card 3: Net Profit (EAT) */}
        <div className={`rounded-xl p-3.5 border transition-all flex items-center justify-between ${cardBg}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center">
              <PieIcon size={20} />
            </div>
            <div>
              <p className={`text-[11px] font-bold ${subText} uppercase tracking-wider`}>
                FY30F Net Profit (EAT)
              </p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black tracking-tight">
                  {formatHighlightValue(data.kpis.eat.value * scaleMultiplier)}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {unitLabel}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-0.5">
              ↑ +{data.kpis.eat.yoyPct}%
            </span>
            <span className={`text-[10px] ${subText}`}>
              {data.kpis.eat.yoyText}
            </span>
          </div>
        </div>

        {/* Card 4: GPM */}
        <div className={`rounded-xl p-3.5 border transition-all flex items-center justify-between ${cardBg}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className={`text-[11px] font-bold ${subText} uppercase tracking-wider`}>
                FY30F GPM
              </p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black tracking-tight">
                  {data.kpis.gpm.value}%
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-extrabold text-rose-500 flex items-center justify-end gap-0.5">
              ↓ {data.kpis.gpm.yoyDiff}pp
            </span>
            <span className={`text-[10px] ${subText}`}>
              {data.kpis.gpm.yoyText}
            </span>
          </div>
        </div>
      </section>

      {/* REVENUE AND PROFIT ABOVE FULL-WIDTH MARGINS */}
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        {/* QUADRANT 1: REVENUE TRAJECTORY */}
        <motion.div layout className={`rounded-2xl border p-4 flex flex-col justify-between ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <BarChart3 size={15} />
              </span>
              <h3 className="text-sm font-bold tracking-tight">
                Revenue Trajectory
              </h3>
            </div>

            <div className="flex items-center gap-3 text-xs">
              {hasActual && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: series.gp }} />
                  <span className="text-[11px] text-slate-500">Actual</span>
                </div>
              )}
              {hasForecast && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded" style={{ border: `1px solid ${series.gp}`, background: '#8fdcbe' }} />
                  <span className="text-[11px] text-slate-500">Forecast</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-[10px] text-slate-400 font-medium -mt-1 mb-1">
            ({unitLabel})
          </p>

          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedRevenue} margin={{ top: 20, right: 10, left: -10, bottom: 0 }} barCategoryGap="24%">
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="year" stroke={axisColor} fontSize={11} tickLine={false} />
                <YAxis stroke={axisColor} fontSize={11} tickLine={false} />
                <Tooltip isAnimationActive={false} offset={16} cursor={{ stroke: isLightMode ? "#94b8ae" : "#4f766e", strokeWidth: 1, fill: isLightMode ? "rgba(13,148,136,0.045)" : "rgba(45,212,191,0.06)" }} wrapperStyle={{ outline: "none", zIndex: 50 }} content={<HighlightsTooltip variant="revenue" unit={unitLabel} light={isLightMode} trajectory={data.revenueTrajectory} />} />
                {/* One series, not two: a second series would reserve its own half of each year and
                    leave the actual bars sitting left of their label and the forecast bars right of it.
                    Actual and forecast are told apart by the fill instead. */}
                <Bar
                  dataKey="displayValue"
                  name="Revenue"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                  isAnimationActive={!exportSlide}
                >
                  {formattedRevenue.map((point) => (
                    <Cell
                      key={point.year}
                      fill={point.isForecast ? 'url(#forecastStripe)' : series.gp}
                      stroke={point.isForecast ? series.gp : undefined}
                      strokeWidth={point.isForecast ? 1 : 0}
                    />
                  ))}
                  <LabelList dataKey="displayValue" position="top" fill={isLightMode ? '#334155' : '#CBD5E1'} fontSize={10} formatter={formatHighlightValue} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* QUADRANT 2: GROSS PROFIT, EBITDA AND NET PROFIT */}
        <motion.div layout className={`rounded-2xl border p-4 flex flex-col justify-between ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <BarChart3 size={15} />
              </span>
              <h3 className="text-sm font-bold tracking-tight">
                Gross Profit, EBITDA and Net Profit
              </h3>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full" style={{ background: series.gp }} /> GP</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full" style={{ background: series.ebitda }} /> EBITDA</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full" style={{ background: series.ebit }} /> EBIT</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full" style={{ background: series.eat }} /> EAT</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 font-medium -mt-1 mb-1">
            ({unitLabel})
          </p>

          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedPnl} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="year" stroke={axisColor} fontSize={11} tickLine={false} />
                <YAxis stroke={axisColor} fontSize={11} tickLine={false} domain={pnlAxis.domain} ticks={pnlAxis.ticks} allowDecimals={false} />
                <ReferenceLine y={0} stroke={axisColor} />
                <Tooltip isAnimationActive={false} offset={16} cursor={{ stroke: isLightMode ? "#94b8ae" : "#4f766e", strokeWidth: 1, fill: isLightMode ? "rgba(13,148,136,0.045)" : "rgba(45,212,191,0.06)" }} wrapperStyle={{ outline: "none", zIndex: 50 }} content={<HighlightsTooltip variant="pnl" unit={unitLabel} light={isLightMode} trajectory={data.revenueTrajectory} />} />
                <Bar isAnimationActive={!exportSlide} dataKey="gp" name="GP" fill={series.gp} radius={[3, 3, 0, 0]}>
                  <LabelList dataKey="gp" position="top" fill={axisColor} fontSize={9} formatter={formatHighlightBarLabel} />
                </Bar>
                <Bar isAnimationActive={!exportSlide} dataKey="ebitda" name="EBITDA" fill={series.ebitda} radius={[3, 3, 0, 0]}>
                  <LabelList dataKey="ebitda" position="top" fill={axisColor} fontSize={9} formatter={formatHighlightBarLabel} />
                </Bar>
                <Bar isAnimationActive={!exportSlide} dataKey="ebit" name="EBIT" fill={series.ebit} radius={[3, 3, 0, 0]}>
                  <LabelList dataKey="ebit" position="top" fill={axisColor} fontSize={9} formatter={formatHighlightBarLabel} />
                </Bar>
                <Bar isAnimationActive={!exportSlide} dataKey="eat" name="EAT" fill={series.eat} radius={[3, 3, 0, 0]}>
                  <LabelList dataKey="eat" position="top" fill={axisColor} fontSize={9} formatter={formatHighlightBarLabel} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* FULL-WIDTH MARGINS TRAJECTORY */}
        <motion.div layout className={`col-span-full rounded-2xl border p-4 flex flex-col justify-between ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <TrendingUp size={15} />
              </span>
              <h3 className="text-sm font-bold tracking-tight">
                Margins Trajectory
              </h3>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full" style={{ background: series.gp }} /> GPM</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full" style={{ background: series.ebitda }} /> EBITDAM</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full" style={{ background: series.ebit }} /> EBITM</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full" style={{ background: series.eat }} /> EATM</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 font-medium -mt-1 mb-1">
            (%)
          </p>

          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marginsData} margin={{ top: 20, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="year" stroke={axisColor} fontSize={11} tickLine={false} />
                <YAxis stroke={axisColor} fontSize={11} tickLine={false} unit="%" domain={[-10, 60]} />
                <ReferenceLine y={0} stroke={axisColor} />
                <Tooltip isAnimationActive={false} offset={16} cursor={{ stroke: isLightMode ? "#94b8ae" : "#4f766e", strokeWidth: 1, fill: isLightMode ? "rgba(13,148,136,0.045)" : "rgba(45,212,191,0.06)" }} wrapperStyle={{ outline: "none", zIndex: 50 }} content={<HighlightsTooltip variant="margins" unit={unitLabel} light={isLightMode} trajectory={data.revenueTrajectory} />} />
                <Line isAnimationActive={!exportSlide} type="monotone" dataKey="gpm" name="GPM" stroke={series.gp} strokeWidth={2.5} dot={{ r: 3 }}>
                </Line>
                <Line isAnimationActive={!exportSlide} type="monotone" dataKey="ebitdam" name="EBITDAM" stroke={series.ebitda} strokeWidth={2.5} dot={{ r: 3 }}>
                </Line>
                <Line isAnimationActive={!exportSlide} type="monotone" dataKey="ebitm" name="EBITM" stroke={series.ebit} strokeWidth={2} dot={{ r: 3 }}>
                </Line>
                <Line isAnimationActive={!exportSlide} type="monotone" dataKey="eatm" name="EATM" stroke={series.eat} strokeWidth={2} dot={{ r: 3 }}>
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </main>

      {/* FOOTER BAR MATCHING ATTACHED SLIDE */}
      <footer className="flex items-center justify-between pt-4 mt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs">
        <div className="space-y-0.5">
          <p className="text-[11px] text-slate-400 font-medium">
            {data.footerNote}
          </p>
          <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            {data.confidentialText}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Image
            src="/mra-logo-official.svg"
            alt="MRA Group"
            width={70}
            height={30}
            className="object-contain"
            unoptimized
          />
        </div>
      </footer>
    </div>
  );
}
