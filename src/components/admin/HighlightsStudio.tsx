'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save, RotateCcw, ExternalLink, Sparkles, CheckCircle2,
  BarChart3, Coins, TrendingUp, Percent, FileText,
  DollarSign, Activity, Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FinancialHighlightsData } from '@/lib/types';
import { INITIAL_HIGHLIGHTS_DATA } from '@/lib/highlights-data';

interface HighlightsStudioProps {
  isLightMode?: boolean;
}

export default function HighlightsStudio({ isLightMode = false }: HighlightsStudioProps) {
  const router = useRouter();
  const [highlightsData, setHighlightsData] = useState<FinancialHighlightsData>(INITIAL_HIGHLIGHTS_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch saved highlights on mount
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/highlights');
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setHighlightsData(json.data);
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

  // Save to PostgreSQL
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(highlightsData),
      });

      if (res.ok) {
        setSaveSuccess(true);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {}
        setTimeout(() => setSaveSuccess(false), 3500);
      } else {
        alert('Failed to save to database');
      }
    } catch (e) {
      console.error('Error saving highlights:', e);
      alert('Error saving highlights');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset all values to Slide 1 baseline figures?')) {
      setHighlightsData(INITIAL_HIGHLIGHTS_DATA);
    }
  };

  // Helper Mutation Handlers
  const updateKpi = (key: 'revenue' | 'ebitda' | 'eat' | 'gpm', field: string, value: any) => {
    setHighlightsData((prev) => ({
      ...prev,
      kpis: {
        ...prev.kpis,
        [key]: {
          ...prev.kpis[key],
          [field]: value,
        },
      },
    }));
  };

  const updateRevenuePoint = (year: string, value: number) => {
    setHighlightsData((prev) => ({
      ...prev,
      revenueTrajectory: prev.revenueTrajectory.map((pt) =>
        pt.year === year ? { ...pt, value } : pt
      ),
    }));
  };

  const toggleRevenueForecast = (year: string) => {
    setHighlightsData((prev) => ({
      ...prev,
      revenueTrajectory: prev.revenueTrajectory.map((pt) =>
        pt.year === year ? { ...pt, isForecast: !pt.isForecast } : pt
      ),
    }));
  };

  const updatePnlPoint = (
    year: string,
    field: 'gp' | 'ebitda' | 'ebit' | 'eat',
    value: number
  ) => {
    setHighlightsData((prev) => ({
      ...prev,
      pnlTrajectory: prev.pnlTrajectory.map((pt) =>
        pt.year === year ? { ...pt, [field]: value } : pt
      ),
    }));
  };

  const updateMarginsPoint = (
    year: string,
    field: 'gpm' | 'ebitdam' | 'ebitm' | 'eatm',
    value: number
  ) => {
    setHighlightsData((prev) => ({
      ...prev,
      marginsTrajectory: prev.marginsTrajectory.map((pt) =>
        pt.year === year ? { ...pt, [field]: value } : pt
      ),
    }));
  };

  const updateCashflowPoint = (
    year: string,
    field: 'cfo' | 'cfi' | 'cff',
    value: number
  ) => {
    setHighlightsData((prev) => ({
      ...prev,
      cashflowTrajectory: prev.cashflowTrajectory.map((pt) =>
        pt.year === year ? { ...pt, [field]: value } : pt
      ),
    }));
  };

  // Style tokens
  const cardBg = isLightMode
    ? 'bg-white border-slate-200 shadow-sm'
    : 'bg-[#101726]/90 border-slate-800/90 shadow-2xl backdrop-blur-sm';
  const inputBg = isLightMode
    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
    : 'bg-slate-900/80 border-slate-700/80 text-white focus:border-blue-500';
  const tableHeaderBg = isLightMode ? 'bg-slate-100 text-slate-800' : 'bg-[#162032] text-slate-200';
  const cellInputBg = isLightMode
    ? 'bg-white border-slate-300 hover:border-blue-500 focus:border-blue-600 text-slate-900'
    : 'bg-slate-900/80 border-slate-700/60 hover:border-blue-500 focus:border-blue-400 text-white';

  return (
    <div className="space-y-6">
      {/* Studio Action Bar */}
      <div className={`rounded-2xl p-5 border transition-all ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Sparkles size={18} />
              </div>
              <div>
                <h2 className={`text-base font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  Financial Highlights Deck Studio
                </h2>
                <p className="text-xs text-slate-400">
                  Slide 1 Editor: FY22–FY30F KPI Cards & 4-Quadrant Trajectories (Saved to PostgreSQL).
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleReset}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                isLightMode
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Reset values to PPT Slide 1 Baseline"
            >
              <RotateCcw size={13} />
              Reset Baseline
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Save size={14} />
              {isSaving ? 'Saving to DB...' : 'Save Highlights to DB'}
            </button>

            <button
              onClick={() => router.push('/highlights')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <ExternalLink size={14} />
              Open Presentation Deck (16:9)
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} />
            Highlights saved successfully to PostgreSQL! Ready for presentation at /highlights.
          </div>
        )}
      </div>

      {/* 1. TOP 4 KPI CARDS (FY30F) */}
      <div className={`rounded-2xl p-5 border transition-all ${cardBg}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              <Coins className="w-4 h-4 text-emerald-500" />
              Executive KPI Cards (Top Bar)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Target figures displayed on the 4 top summary cards of the presentation slide.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Revenue */}
          <div className={`p-4 rounded-xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">FY30F Revenue</span>
              <BarChart3 size={16} className="text-emerald-500" />
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold">Value (IDR Bn)</label>
                <input
                  type="number"
                  value={highlightsData.kpis.revenue.value}
                  onChange={(e) => updateKpi('revenue', 'value', parseFloat(e.target.value) || 0)}
                  className={`w-full text-xs rounded-lg border px-2.5 py-1.5 font-bold outline-none ${inputBg}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold">YoY %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={highlightsData.kpis.revenue.yoyPct}
                    onChange={(e) => updateKpi('revenue', 'yoyPct', parseFloat(e.target.value) || 0)}
                    className={`w-full text-xs rounded-lg border px-2.5 py-1.5 font-semibold text-emerald-500 outline-none ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold">Comparison</label>
                  <input
                    type="text"
                    value={highlightsData.kpis.revenue.yoyText}
                    onChange={(e) => updateKpi('revenue', 'yoyText', e.target.value)}
                    className={`w-full text-xs rounded-lg border px-2.5 py-1.5 font-semibold outline-none ${inputBg}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* KPI 2: EBITDA */}
          <div className={`p-4 rounded-xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">FY30F EBITDA</span>
              <Coins size={16} className="text-emerald-500" />
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold">Value (IDR Bn)</label>
                <input
                  type="number"
                  value={highlightsData.kpis.ebitda.value}
                  onChange={(e) => updateKpi('ebitda', 'value', parseFloat(e.target.value) || 0)}
                  className={`w-full text-xs rounded-lg border px-2.5 py-1.5 font-bold outline-none ${inputBg}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold">YoY %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={highlightsData.kpis.ebitda.yoyPct}
                    onChange={(e) => updateKpi('ebitda', 'yoyPct', parseFloat(e.target.value) || 0)}
                    className={`w-full text-xs rounded-lg border px-2.5 py-1.5 font-semibold text-emerald-500 outline-none ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold">Comparison</label>
                  <input
                    type="text"
                    value={highlightsData.kpis.ebitda.yoyText}
                    onChange={(e) => updateKpi('ebitda', 'yoyText', e.target.value)}
                    className={`w-full text-xs rounded-lg border px-2.5 py-1.5 font-semibold outline-none ${inputBg}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* KPI 3: Net Profit (EAT) */}
          <div className={`p-4 rounded-xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">FY30F Net Profit</span>
              <TrendingUp size={16} className="text-emerald-500" />
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold">Value (IDR Bn)</label>
                <input
                  type="number"
                  value={highlightsData.kpis.eat.value}
                  onChange={(e) => updateKpi('eat', 'value', parseFloat(e.target.value) || 0)}
                  className={`w-full text-xs rounded-lg border px-2.5 py-1.5 font-bold outline-none ${inputBg}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold">YoY %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={highlightsData.kpis.eat.yoyPct}
                    onChange={(e) => updateKpi('eat', 'yoyPct', parseFloat(e.target.value) || 0)}
                    className={`w-full text-xs rounded-lg border px-2.5 py-1.5 font-semibold text-emerald-500 outline-none ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold">Comparison</label>
                  <input
                    type="text"
                    value={highlightsData.kpis.eat.yoyText}
                    onChange={(e) => updateKpi('eat', 'yoyText', e.target.value)}
                    className={`w-full text-xs rounded-lg border px-2.5 py-1.5 font-semibold outline-none ${inputBg}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* KPI 4: Gross Profit Margin */}
          <div className={`p-4 rounded-xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">FY30F Gross Margin</span>
              <Percent size={16} className="text-emerald-500" />
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold">Value (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={highlightsData.kpis.gpm.value}
                  onChange={(e) => updateKpi('gpm', 'value', parseFloat(e.target.value) || 0)}
                  className={`w-full text-xs rounded-lg border px-2.5 py-1.5 font-bold outline-none ${inputBg}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold">YoY Diff (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={highlightsData.kpis.gpm.yoyDiff}
                    onChange={(e) => updateKpi('gpm', 'yoyDiff', parseFloat(e.target.value) || 0)}
                    className={`w-full text-xs rounded-lg border px-2.5 py-1.5 font-semibold outline-none ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold">Comparison</label>
                  <input
                    type="text"
                    value={highlightsData.kpis.gpm.yoyText}
                    onChange={(e) => updateKpi('gpm', 'yoyText', e.target.value)}
                    className={`w-full text-xs rounded-lg border px-2.5 py-1.5 font-semibold outline-none ${inputBg}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. QUADRANT 1: REVENUE TRAJECTORY */}
      <div className={`rounded-2xl p-5 border transition-all ${cardBg}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              Quadrant 1: Revenue Trajectory (FY22 – FY30F in IDR Bn)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Actual years render solid green; forecast years render diagonal striped green on the deck.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className={`border-b ${tableHeaderBg}`}>
                <th className="p-3 text-left font-bold uppercase tracking-wider">Period</th>
                {highlightsData.revenueTrajectory.map((pt) => (
                  <th key={pt.year} className="p-3 text-center font-bold">
                    {pt.year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-800/40">
                <td className="p-3 font-semibold text-slate-400">Type</td>
                {highlightsData.revenueTrajectory.map((pt) => (
                  <td key={pt.year} className="p-2 text-center">
                    <button
                      onClick={() => toggleRevenueForecast(pt.year)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                        pt.isForecast
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      }`}
                      title="Click to toggle Actual / Forecast"
                    >
                      {pt.isForecast ? 'Forecast' : 'Actual'}
                    </button>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-200">Revenue (IDR Bn)</td>
                {highlightsData.revenueTrajectory.map((pt) => (
                  <td key={pt.year} className="p-2 text-center">
                    <input
                      type="number"
                      value={pt.value}
                      onChange={(e) => updateRevenuePoint(pt.year, parseFloat(e.target.value) || 0)}
                      className={`w-20 text-center font-bold text-xs rounded-lg border py-1.5 outline-none ${cellInputBg}`}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. QUADRANT 2: P&L TRAJECTORY MATRIX */}
      <div className={`rounded-2xl p-5 border transition-all ${cardBg}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              <Coins className="w-4 h-4 text-emerald-500" />
              Quadrant 2: P&L Trajectory Matrix (GP, EBITDA, EBIT, EAT in IDR Bn)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Clustered bar chart values representing Gross Profit, EBITDA, Operating Profit, and Net Profit.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className={`border-b ${tableHeaderBg}`}>
                <th className="p-3 text-left font-bold uppercase tracking-wider min-w-[180px]">P&L Line Item</th>
                {highlightsData.pnlTrajectory.map((pt) => (
                  <th key={pt.year} className="p-3 text-center font-bold min-w-[85px]">
                    {pt.year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {/* GP */}
              <tr>
                <td className="p-3 font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981] inline-block" />
                  Gross Profit (GP)
                </td>
                {highlightsData.pnlTrajectory.map((pt) => (
                  <td key={pt.year} className="p-2 text-center">
                    <input
                      type="number"
                      value={pt.gp}
                      onChange={(e) => updatePnlPoint(pt.year, 'gp', parseFloat(e.target.value) || 0)}
                      className={`w-18 text-center font-semibold text-xs rounded-lg border py-1.5 outline-none ${cellInputBg}`}
                    />
                  </td>
                ))}
              </tr>

              {/* EBITDA */}
              <tr>
                <td className="p-3 font-bold text-teal-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#14B8A6] inline-block" />
                  EBITDA
                </td>
                {highlightsData.pnlTrajectory.map((pt) => (
                  <td key={pt.year} className="p-2 text-center">
                    <input
                      type="number"
                      value={pt.ebitda}
                      onChange={(e) => updatePnlPoint(pt.year, 'ebitda', parseFloat(e.target.value) || 0)}
                      className={`w-18 text-center font-semibold text-xs rounded-lg border py-1.5 outline-none ${cellInputBg}`}
                    />
                  </td>
                ))}
              </tr>

              {/* EBIT */}
              <tr>
                <td className="p-3 font-bold text-amber-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B] inline-block" />
                  Operating Profit (EBIT)
                </td>
                {highlightsData.pnlTrajectory.map((pt) => (
                  <td key={pt.year} className="p-2 text-center">
                    <input
                      type="number"
                      value={pt.ebit}
                      onChange={(e) => updatePnlPoint(pt.year, 'ebit', parseFloat(e.target.value) || 0)}
                      className={`w-18 text-center font-semibold text-xs rounded-lg border py-1.5 outline-none ${cellInputBg}`}
                    />
                  </td>
                ))}
              </tr>

              {/* EAT */}
              <tr>
                <td className="p-3 font-bold text-indigo-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#6366F1] inline-block" />
                  Net Profit (EAT)
                </td>
                {highlightsData.pnlTrajectory.map((pt) => (
                  <td key={pt.year} className="p-2 text-center">
                    <input
                      type="number"
                      value={pt.eat}
                      onChange={(e) => updatePnlPoint(pt.year, 'eat', parseFloat(e.target.value) || 0)}
                      className={`w-18 text-center font-semibold text-xs rounded-lg border py-1.5 outline-none ${cellInputBg}`}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. QUADRANT 3: MARGINS TRAJECTORY % */}
      <div className={`rounded-2xl p-5 border transition-all ${cardBg}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Quadrant 3: Margins Trajectory Matrix (%)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-line trajectory percentages (Gross Profit Margin, EBITDA Margin, Operating Margin, Net Margin).
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className={`border-b ${tableHeaderBg}`}>
                <th className="p-3 text-left font-bold uppercase tracking-wider min-w-[180px]">Margin Metric (%)</th>
                {highlightsData.marginsTrajectory.map((pt) => (
                  <th key={pt.year} className="p-3 text-center font-bold min-w-[85px]">
                    {pt.year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {/* GPM */}
              <tr>
                <td className="p-3 font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block" />
                  GPM (%)
                </td>
                {highlightsData.marginsTrajectory.map((pt) => (
                  <td key={pt.year} className="p-2 text-center">
                    <input
                      type="number"
                      step="0.1"
                      value={pt.gpm}
                      onChange={(e) => updateMarginsPoint(pt.year, 'gpm', parseFloat(e.target.value) || 0)}
                      className={`w-18 text-center font-semibold text-xs rounded-lg border py-1.5 outline-none ${cellInputBg}`}
                    />
                  </td>
                ))}
              </tr>

              {/* EBITDAM */}
              <tr>
                <td className="p-3 font-bold text-teal-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#14B8A6] inline-block" />
                  EBITDAM (%)
                </td>
                {highlightsData.marginsTrajectory.map((pt) => (
                  <td key={pt.year} className="p-2 text-center">
                    <input
                      type="number"
                      step="0.1"
                      value={pt.ebitdam}
                      onChange={(e) => updateMarginsPoint(pt.year, 'ebitdam', parseFloat(e.target.value) || 0)}
                      className={`w-18 text-center font-semibold text-xs rounded-lg border py-1.5 outline-none ${cellInputBg}`}
                    />
                  </td>
                ))}
              </tr>

              {/* EBITM */}
              <tr>
                <td className="p-3 font-bold text-amber-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] inline-block" />
                  EBITM (%)
                </td>
                {highlightsData.marginsTrajectory.map((pt) => (
                  <td key={pt.year} className="p-2 text-center">
                    <input
                      type="number"
                      step="0.1"
                      value={pt.ebitm}
                      onChange={(e) => updateMarginsPoint(pt.year, 'ebitm', parseFloat(e.target.value) || 0)}
                      className={`w-18 text-center font-semibold text-xs rounded-lg border py-1.5 outline-none ${cellInputBg}`}
                    />
                  </td>
                ))}
              </tr>

              {/* EATM */}
              <tr>
                <td className="p-3 font-bold text-indigo-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1] inline-block" />
                  EATM (%)
                </td>
                {highlightsData.marginsTrajectory.map((pt) => (
                  <td key={pt.year} className="p-2 text-center">
                    <input
                      type="number"
                      step="0.1"
                      value={pt.eatm}
                      onChange={(e) => updateMarginsPoint(pt.year, 'eatm', parseFloat(e.target.value) || 0)}
                      className={`w-18 text-center font-semibold text-xs rounded-lg border py-1.5 outline-none ${cellInputBg}`}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. QUADRANT 4: CASHFLOW TRAJECTORY */}
      <div className={`rounded-2xl p-5 border transition-all ${cardBg}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              <Coins className="w-4 h-4 text-emerald-500" />
              Quadrant 4: Cashflow Trajectory Matrix (CFO, CFI, CFF in IDR Bn)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cashflow movements across Operating (CFO), Investing (CFI), and Financing (CFF) activities.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className={`border-b ${tableHeaderBg}`}>
                <th className="p-3 text-left font-bold uppercase tracking-wider min-w-[180px]">Cashflow Type</th>
                {highlightsData.cashflowTrajectory.map((pt) => (
                  <th key={pt.year} className="p-3 text-center font-bold min-w-[85px]">
                    {pt.year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {/* CFO */}
              <tr>
                <td className="p-3 font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981] inline-block" />
                  CFO (Operations)
                </td>
                {highlightsData.cashflowTrajectory.map((pt) => (
                  <td key={pt.year} className="p-2 text-center">
                    <input
                      type="number"
                      value={pt.cfo}
                      onChange={(e) => updateCashflowPoint(pt.year, 'cfo', parseFloat(e.target.value) || 0)}
                      className={`w-18 text-center font-semibold text-xs rounded-lg border py-1.5 outline-none ${cellInputBg}`}
                    />
                  </td>
                ))}
              </tr>

              {/* CFI */}
              <tr>
                <td className="p-3 font-bold text-rose-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#F43F5E] inline-block" />
                  CFI (Investing)
                </td>
                {highlightsData.cashflowTrajectory.map((pt) => (
                  <td key={pt.year} className="p-2 text-center">
                    <input
                      type="number"
                      value={pt.cfi}
                      onChange={(e) => updateCashflowPoint(pt.year, 'cfi', parseFloat(e.target.value) || 0)}
                      className={`w-18 text-center font-semibold text-xs rounded-lg border py-1.5 outline-none ${cellInputBg}`}
                    />
                  </td>
                ))}
              </tr>

              {/* CFF */}
              <tr>
                <td className="p-3 font-bold text-blue-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#3B82F6] inline-block" />
                  CFF (Financing)
                </td>
                {highlightsData.cashflowTrajectory.map((pt) => (
                  <td key={pt.year} className="p-2 text-center">
                    <input
                      type="number"
                      value={pt.cff}
                      onChange={(e) => updateCashflowPoint(pt.year, 'cff', parseFloat(e.target.value) || 0)}
                      className={`w-18 text-center font-semibold text-xs rounded-lg border py-1.5 outline-none ${cellInputBg}`}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. SLIDE METADATA & FOOTERS */}
      <div className={`rounded-2xl p-5 border transition-all ${cardBg}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              <FileText className="w-4 h-4 text-blue-500" />
              Slide Presentation Metadata & Footers
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Header title, subtitles, and disclaimer notes shown on the slide presentation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400">Slide Title</label>
            <input
              type="text"
              value={highlightsData.title}
              onChange={(e) => setHighlightsData((prev) => ({ ...prev, title: e.target.value }))}
              className={`w-full text-xs rounded-lg border px-3 py-2 mt-1 font-medium outline-none ${inputBg}`}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400">Slide Subtitle</label>
            <input
              type="text"
              value={highlightsData.subtitle}
              onChange={(e) => setHighlightsData((prev) => ({ ...prev, subtitle: e.target.value }))}
              className={`w-full text-xs rounded-lg border px-3 py-2 mt-1 font-medium outline-none ${inputBg}`}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400">Footer Note</label>
            <input
              type="text"
              value={highlightsData.footerNote}
              onChange={(e) => setHighlightsData((prev) => ({ ...prev, footerNote: e.target.value }))}
              className={`w-full text-xs rounded-lg border px-3 py-2 mt-1 font-medium outline-none ${inputBg}`}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400">Confidentiality Notice</label>
            <input
              type="text"
              value={highlightsData.confidentialText}
              onChange={(e) => setHighlightsData((prev) => ({ ...prev, confidentialText: e.target.value }))}
              className={`w-full text-xs rounded-lg border px-3 py-2 mt-1 font-medium outline-none ${inputBg}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
