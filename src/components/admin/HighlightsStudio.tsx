'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save, RotateCcw, ExternalLink, Sparkles,
  BarChart3, Coins, TrendingUp, Percent, FileText,
  DollarSign, Activity, Check
} from 'lucide-react';
import SaveNotification from '@/components/admin/SaveNotification';
import { FinancialHighlightsData } from '@/lib/types';
import { INITIAL_HIGHLIGHTS_DATA } from '@/lib/highlights-data';
import { useEditHistory } from '@/lib/use-edit-history';
import { formatForEdit, parseNumberInput } from '@/lib/number-format';
import { deriveMargins } from '@/lib/highlights-margins';
import HighlightsMatrix from './HighlightsMatrix';
import { EditHistoryButtons } from './EditToolbar';

/**
 * A number field that reads what the person typed with the same parser as the grids, so a decimal
 * comma works as well as a decimal point. A plain <input type="number"> rejects one of the two
 * depending on the browser's locale, and hands back an empty value that would be stored as zero.
 */
function NumberInput({ value, onCommit, className }: { value: number; onCommit: (value: number) => void; className?: string }) {
  const [text, setText] = useState(() => formatForEdit(value));
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) setText(formatForEdit(value));
  }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      value={text}
      onFocus={() => { isFocused.current = true; }}
      onChange={(event) => setText(event.target.value)}
      onBlur={() => {
        isFocused.current = false;
        const parsed = parseNumberInput(text);
        // Text that is not a number puts the old figure back rather than storing a zero
        if (parsed === null) setText(formatForEdit(value));
        else { onCommit(parsed); setText(formatForEdit(parsed)); }
      }}
    />
  );
}

interface HighlightsStudioProps {
  isLightMode?: boolean;
}

export default function HighlightsStudio({ isLightMode = true }: HighlightsStudioProps) {
  const router = useRouter();
  const [highlightsData, setHighlightsData] = useState<FinancialHighlightsData>(INITIAL_HIGHLIGHTS_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!saveSuccess) return;
    const timer = setTimeout(() => setSaveSuccess(false), 3500);
    return () => clearTimeout(timer);
  }, [saveSuccess]);

  const [loading, setLoading] = useState(true);

  // Undo/redo for the figures typed into the grids. Plain text fields keep the browser's own undo.
  const { push, undo, redo, clear: clearHistory, canUndo, canRedo } = useEditHistory<FinancialHighlightsData>();
  const dataRef = useRef(highlightsData);
  dataRef.current = highlightsData;
  const rememberBeforeEdit = () => push(dataRef.current);
  const onUndo = useCallback(() => {
    const previous = undo(dataRef.current);
    if (previous) setHighlightsData(previous);
  }, [undo]);
  const onRedo = useCallback(() => {
    const next = redo(dataRef.current);
    if (next) setHighlightsData(next);
  }, [redo]);

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
            clearHistory();
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
    setSaveSuccess(false);
    setIsSaving(true);
    try {
      const res = await fetch('/api/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...highlightsData, marginsTrajectory: margins }),
      });

      if (res.ok) {
        setSaveSuccess(true);
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
      clearHistory();
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
    rememberBeforeEdit();
    setHighlightsData((prev) => ({
      ...prev,
      revenueTrajectory: prev.revenueTrajectory.map((pt) =>
        pt.year === year ? { ...pt, value } : pt
      ),
    }));
  };

  const toggleRevenueForecast = (year: string) => {
    rememberBeforeEdit();
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
    rememberBeforeEdit();
    setHighlightsData((prev) => ({
      ...prev,
      pnlTrajectory: prev.pnlTrajectory.map((pt) =>
        pt.year === year ? { ...pt, [field]: value } : pt
      ),
    }));
  };

  // Margins are not typed in: each is a P&L line over that year's revenue. Deriving them here means
  // the table cannot drift from the two tables it is read off.
  const margins = deriveMargins(highlightsData.revenueTrajectory, highlightsData.pnlTrajectory);

  const updateCashflowPoint = (
    year: string,
    field: 'cfo' | 'cfi' | 'cff',
    value: number
  ) => {
    rememberBeforeEdit();
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
                  Edit the numbers behind the Highlights slide.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <EditHistoryButtons
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={onUndo}
              onRedo={onRedo}
              isLightMode={isLightMode}
            />
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
              {isSaving ? 'Saving...' : 'Save Highlights'}
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

        <SaveNotification visible={saveSuccess} isLightMode={isLightMode} message="Financial Highlights are ready to present." />
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
                <NumberInput
                  value={highlightsData.kpis.revenue.value}
                  onCommit={(next) => updateKpi('revenue', 'value', next)}
                  className={`w-full text-xs rounded-lg border px-2.5 py-1.5 font-bold outline-none ${inputBg}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold">YoY %</label>
                  <NumberInput
                    value={highlightsData.kpis.revenue.yoyPct}
                    onCommit={(next) => updateKpi('revenue', 'yoyPct', next)}
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
                <NumberInput
                  value={highlightsData.kpis.ebitda.value}
                  onCommit={(next) => updateKpi('ebitda', 'value', next)}
                  className={`w-full text-xs rounded-lg border px-2.5 py-1.5 font-bold outline-none ${inputBg}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold">YoY %</label>
                  <NumberInput
                    value={highlightsData.kpis.ebitda.yoyPct}
                    onCommit={(next) => updateKpi('ebitda', 'yoyPct', next)}
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
                <NumberInput
                  value={highlightsData.kpis.eat.value}
                  onCommit={(next) => updateKpi('eat', 'value', next)}
                  className={`w-full text-xs rounded-lg border px-2.5 py-1.5 font-bold outline-none ${inputBg}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold">YoY %</label>
                  <NumberInput
                    value={highlightsData.kpis.eat.yoyPct}
                    onCommit={(next) => updateKpi('eat', 'yoyPct', next)}
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
                <NumberInput
                  value={highlightsData.kpis.gpm.value}
                  onCommit={(next) => updateKpi('gpm', 'value', next)}
                  className={`w-full text-xs rounded-lg border px-2.5 py-1.5 font-bold outline-none ${inputBg}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold">YoY Diff (%)</label>
                  <NumberInput
                    value={highlightsData.kpis.gpm.yoyDiff}
                    onCommit={(next) => updateKpi('gpm', 'yoyDiff', next)}
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

      {/* Revenue Trajectory */}
      <div className={`rounded-2xl p-5 border transition-all ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              Revenue Trajectory
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Years marked Actual are drawn solid on the slide; Forecast years are drawn hatched.</p>
          </div>
        </div>
        <HighlightsMatrix
          rows={[{ field: 'value', label: 'Revenue' }]}
          points={highlightsData.revenueTrajectory}
          caption="IDR Billion"
          isLightMode={isLightMode}
          onEdit={(field, year, value) => updateRevenuePoint(year, value)}
          onToggleForecast={toggleRevenueForecast}
          onUndo={onUndo}
          onRedo={onRedo}
        />
      </div>

      {/* Gross Profit, EBITDA and Net Profit */}
      <div className={`rounded-2xl p-5 border transition-all ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              Gross Profit, EBITDA and Net Profit
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">The four bars shown for each year on the slide.</p>
          </div>
        </div>
        <HighlightsMatrix
          rows={[
            { field: 'gp', label: 'Gross Profit' },
            { field: 'ebitda', label: 'EBITDA' },
            { field: 'ebit', label: 'EBIT' },
            { field: 'eat', label: 'Net Profit (EAT)' },
          ]}
          points={highlightsData.pnlTrajectory}
          caption="IDR Billion"
          isLightMode={isLightMode}
          onEdit={(field, year, value) => updatePnlPoint(year, field as 'gp' | 'ebitda' | 'ebit' | 'eat', value)}
          onUndo={onUndo}
          onRedo={onRedo}
        />
      </div>

      {/* Margins Trajectory */}
      <div className={`rounded-2xl p-5 border transition-all ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              Margins Trajectory
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Worked out for you: each line of Gross Profit, EBITDA and Net Profit over that year&apos;s revenue.</p>
          </div>
        </div>
        <HighlightsMatrix
          rows={[
            { field: 'gpm', label: 'Gross Profit Margin', unit: 'pct' },
            { field: 'ebitdam', label: 'EBITDA Margin', unit: 'pct' },
            { field: 'ebitm', label: 'Operating Margin', unit: 'pct' },
            { field: 'eatm', label: 'Net Margin', unit: 'pct' },
          ]}
          points={margins}
          caption="Percent of revenue"
          isLightMode={isLightMode}
          readOnly
          onUndo={onUndo}
          onRedo={onRedo}
        />
      </div>

      {/* Cashflow Trajectory */}
      <div className={`rounded-2xl p-5 border transition-all ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              Cashflow Trajectory
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Cash from operating, investing and financing activities. Negative figures are outflows.</p>
          </div>
        </div>
        <HighlightsMatrix
          rows={[
            { field: 'cfo', label: 'Operating (CFO)' },
            { field: 'cfi', label: 'Investing (CFI)' },
            { field: 'cff', label: 'Financing (CFF)' },
          ]}
          points={highlightsData.cashflowTrajectory}
          caption="IDR Billion"
          isLightMode={isLightMode}
          onEdit={(field, year, value) => updateCashflowPoint(year, field as 'cfo' | 'cfi' | 'cff', value)}
          onUndo={onUndo}
          onRedo={onRedo}
        />
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
