'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, LabelList
} from 'recharts';
import {
  BarChart3, Coins, PieChart as PieIcon, TrendingUp,
  Landmark, ArrowLeft, Sun, Moon, Maximize2, Minimize2,
  Settings, Check, Copy, Sparkles, Filter
} from 'lucide-react';
import { FinancialHighlightsData } from '@/lib/types';
import { INITIAL_HIGHLIGHTS_DATA } from '@/lib/highlights-data';

export default function FinancialHighlightsPage() {
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
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setData(json.data);
          }
        }
      } catch (e) {
        console.error('Error fetching highlights:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Hotkeys
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
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

  const scaleMultiplier = unitMode === 'mn' ? 1000 : 1;
  const unitLabel = unitMode === 'mn' ? 'IDR Mn' : 'IDR Bn';

  // Format data according to unit and filter
  const formattedRevenue = data.revenueTrajectory
    .filter((pt) => {
      if (filterMode === 'actual') return !pt.isForecast;
      if (filterMode === 'forecast') return pt.isForecast;
      return true;
    })
    .map((pt) => ({
      ...pt,
      displayValue: Math.round(pt.value * scaleMultiplier),
      actualValue: !pt.isForecast ? Math.round(pt.value * scaleMultiplier) : null,
      forecastValue: pt.isForecast ? Math.round(pt.value * scaleMultiplier) : null,
    }));

  const formattedPnl = data.pnlTrajectory.map((pt) => ({
    year: pt.year,
    gp: Math.round(pt.gp * scaleMultiplier),
    ebitda: Math.round(pt.ebitda * scaleMultiplier),
    ebit: Math.round(pt.ebit * scaleMultiplier),
    eat: Math.round(pt.eat * scaleMultiplier),
  }));

  const formattedCashflow = data.cashflowTrajectory.map((pt) => ({
    year: pt.year,
    cfo: Math.round(pt.cfo * scaleMultiplier),
    cfi: Math.round(pt.cfi * scaleMultiplier),
    cff: Math.round(pt.cff * scaleMultiplier),
  }));

  // Style tokens matching the attached slide
  const pageBg = isLightMode ? 'bg-[#F4F6F8] text-slate-800' : 'bg-[#070B14] text-slate-100';
  const cardBg = isLightMode
    ? 'bg-white border-slate-200 shadow-sm'
    : 'bg-[#101726]/95 border-slate-800 shadow-xl';
  const subText = isLightMode ? 'text-slate-500' : 'text-slate-400';
  const gridStroke = isLightMode ? '#E2E8F0' : '#1E293B';
  const axisColor = isLightMode ? '#64748B' : '#94A3B8';

  return (
    <div className={`min-h-screen ${pageBg} flex flex-col justify-between p-4 lg:p-6 select-none font-sans transition-colors duration-300`}>
      {/* SVG Defs for striped forecast bars */}
      <svg className="h-0 w-0 absolute">
        <defs>
          <pattern id="forecastStripe" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="4" height="8" fill={isLightMode ? "#B7E4C7" : "#064E3B"} />
            <rect x="4" width="4" height="8" fill={isLightMode ? "#D8F3DC" : "#022C22"} />
          </pattern>
        </defs>
      </svg>

      {/* TOP HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 shrink-0">
            <Image
              src="/mra-clover.png"
              alt="MRA Clover Logo"
              width={40}
              height={40}
              className="object-contain"
              priority
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
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as any)}
            className={`text-xs rounded-lg border px-3 py-1.5 font-semibold outline-none transition-colors ${
              isLightMode ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-900 border-slate-700 text-white'
            }`}
          >
            <option value="all">Actual & Forecast</option>
            <option value="actual">Actual Only</option>
            <option value="forecast">Forecast Only</option>
          </select>

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
                <span className="text-xl font-black tracking-tight">
                  {(data.kpis.revenue.value * scaleMultiplier).toLocaleString('en-US')}
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
                <span className="text-xl font-black tracking-tight">
                  {(data.kpis.ebitda.value * scaleMultiplier).toLocaleString('en-US')}
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
                <span className="text-xl font-black tracking-tight">
                  {(data.kpis.eat.value * scaleMultiplier).toLocaleString('en-US')}
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
                <span className="text-xl font-black tracking-tight">
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

      {/* 4-QUADRANT PRESENTATION CANVAS */}
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
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1E825A]" />
                <span className="text-[11px] text-slate-500">Actual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded border border-[#1E825A] bg-[#B7E4C7]" />
                <span className="text-[11px] text-slate-500">Forecast</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 font-medium -mt-1 mb-1">
            ({unitLabel})
          </p>

          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedRevenue} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="year" stroke={axisColor} fontSize={11} tickLine={false} />
                <YAxis stroke={axisColor} fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isLightMode ? '#FFFFFF' : '#0F172A',
                    borderColor: isLightMode ? '#CBD5E1' : '#334155',
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                  formatter={(val: any) => [`${Number(val).toLocaleString()} ${unitLabel}`, 'Revenue']}
                />
                <Bar
                  dataKey="actualValue"
                  name="Actual"
                  fill="#1E825A"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                >
                  <LabelList dataKey="actualValue" position="top" fill={isLightMode ? '#334155' : '#CBD5E1'} fontSize={10} formatter={(v: any) => v ? Number(v).toLocaleString() : ''} />
                </Bar>
                <Bar
                  dataKey="forecastValue"
                  name="Forecast"
                  fill="url(#forecastStripe)"
                  stroke="#1E825A"
                  strokeWidth={1}
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                >
                  <LabelList dataKey="forecastValue" position="top" fill={isLightMode ? '#334155' : '#CBD5E1'} fontSize={10} formatter={(v: any) => v ? Number(v).toLocaleString() : ''} />
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
              <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-[#94D2BD]" /> GP</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-[#0A5C36]" /> EBITDA</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-[#A39B8B]" /> EBIT</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-[#F4A261]" /> EAT</span>
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
                <YAxis stroke={axisColor} fontSize={11} tickLine={false} />
                <ReferenceLine y={0} stroke={axisColor} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isLightMode ? '#FFFFFF' : '#0F172A',
                    borderColor: isLightMode ? '#CBD5E1' : '#334155',
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                  formatter={(v: any, n: any) => [`${Number(v).toLocaleString()} ${unitLabel}`, n]}
                />
                <Bar dataKey="gp" name="GP" fill="#94D2BD" radius={[3, 3, 0, 0]}>
                  <LabelList dataKey="gp" position="top" fill={axisColor} fontSize={9} />
                </Bar>
                <Bar dataKey="ebitda" name="EBITDA" fill="#0A5C36" radius={[3, 3, 0, 0]}>
                  <LabelList dataKey="ebitda" position="top" fill={axisColor} fontSize={9} />
                </Bar>
                <Bar dataKey="ebit" name="EBIT" fill="#A39B8B" radius={[3, 3, 0, 0]}>
                  <LabelList dataKey="ebit" position="top" fill={axisColor} fontSize={9} />
                </Bar>
                <Bar dataKey="eat" name="EAT" fill="#F4A261" radius={[3, 3, 0, 0]}>
                  <LabelList dataKey="eat" position="top" fill={axisColor} fontSize={9} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* QUADRANT 3: MARGINS TRAJECTORY */}
        <motion.div layout className={`rounded-2xl border p-4 flex flex-col justify-between ${cardBg}`}>
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
              <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-[#10B981]" /> GPM</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-[#0A5C36]" /> EBITDAM</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-[#A39B8B]" /> EBITM</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-[#F4A261]" /> EATM</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 font-medium -mt-1 mb-1">
            (%)
          </p>

          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.marginsTrajectory} margin={{ top: 20, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="year" stroke={axisColor} fontSize={11} tickLine={false} />
                <YAxis stroke={axisColor} fontSize={11} tickLine={false} unit="%" domain={[-10, 60]} />
                <ReferenceLine y={0} stroke={axisColor} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isLightMode ? '#FFFFFF' : '#0F172A',
                    borderColor: isLightMode ? '#CBD5E1' : '#334155',
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                  formatter={(v: any, n: any) => [`${v}%`, n]}
                />
                <Line type="monotone" dataKey="gpm" name="GPM" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }}>
                  <LabelList dataKey="gpm" position="top" fill="#10B981" fontSize={9} offset={8} />
                </Line>
                <Line type="monotone" dataKey="ebitdam" name="EBITDAM" stroke="#0A5C36" strokeWidth={2.5} dot={{ r: 3 }}>
                  <LabelList dataKey="ebitdam" position="top" fill="#0A5C36" fontSize={9} offset={8} />
                </Line>
                <Line type="monotone" dataKey="ebitm" name="EBITM" stroke="#A39B8B" strokeWidth={2} dot={{ r: 3 }}>
                  <LabelList dataKey="ebitm" position="bottom" fill="#A39B8B" fontSize={9} offset={8} />
                </Line>
                <Line type="monotone" dataKey="eatm" name="EATM" stroke="#F4A261" strokeWidth={2} dot={{ r: 3 }}>
                  <LabelList dataKey="eatm" position="top" fill="#F4A261" fontSize={9} offset={8} />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* QUADRANT 4: CASHFLOW TRAJECTORY */}
        <motion.div layout className={`rounded-2xl border p-4 flex flex-col justify-between ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <Landmark size={15} />
              </span>
              <h3 className="text-sm font-bold tracking-tight">
                Cashflow Trajectory
              </h3>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-[#A7F3D0]" /> CFO</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-[#C2B8A3]" /> CFI</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> CFF</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 font-medium -mt-1 mb-1">
            ({unitLabel})
          </p>

          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedCashflow} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="year" stroke={axisColor} fontSize={11} tickLine={false} />
                <YAxis stroke={axisColor} fontSize={11} tickLine={false} domain={[-300 * scaleMultiplier, 300 * scaleMultiplier]} />
                <ReferenceLine y={0} stroke={axisColor} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isLightMode ? '#FFFFFF' : '#0F172A',
                    borderColor: isLightMode ? '#CBD5E1' : '#334155',
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                  formatter={(v: any, n: any) => [`${Number(v).toLocaleString()} ${unitLabel}`, n]}
                />
                <Bar dataKey="cfo" name="CFO" fill="#A7F3D0" radius={[3, 3, 0, 0]}>
                  <LabelList dataKey="cfo" position="top" fill={axisColor} fontSize={9} />
                </Bar>
                <Bar dataKey="cfi" name="CFI" fill="#C2B8A3" radius={[0, 0, 3, 3]}>
                  <LabelList dataKey="cfi" position="bottom" fill={axisColor} fontSize={9} />
                </Bar>
                <Bar dataKey="cff" name="CFF" fill="#F59E0B" radius={[3, 3, 0, 0]}>
                  <LabelList dataKey="cff" position="top" fill={axisColor} fontSize={9} />
                </Bar>
              </BarChart>
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
          <span className="font-bold text-xs tracking-wider text-slate-700 dark:text-slate-300">
            MRA Group
          </span>
          <div className="relative w-5 h-5">
            <Image
              src="/mra-clover.png"
              alt="MRA Logo"
              width={20}
              height={20}
              className="object-contain"
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
