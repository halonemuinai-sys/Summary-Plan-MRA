'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save, RotateCcw, ExternalLink, Sparkles,
  BarChart3, Coins, TrendingUp, Percent, FileText,
  DollarSign, Activity, Check, Lock, LockOpen
} from 'lucide-react';
import SaveNotification from '@/components/admin/SaveNotification';
import { FinancialHighlightsData, FinancialRowData } from '@/lib/types';
import { INITIAL_HIGHLIGHTS_DATA } from '@/lib/highlights-data';
import { useEditHistory } from '@/lib/use-edit-history';
import { formatBn, formatPct } from '@/lib/number-format';
import { PNL_SOURCE_SLUG, PNL_SOURCE_TITLE, applyPnlSource, pnlFigure } from '@/lib/highlights-from-pnl';
import HighlightsMatrix from './HighlightsMatrix';
import { EditHistoryButtons, UnsavedBadge } from './EditToolbar';

/** The lock on a table of figures: closed means the figures cannot be typed over by accident. */
function LockToggle({ open, onToggle, isLightMode }: { open: boolean; onToggle: () => void; isLightMode: boolean }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={open}
      title={open ? 'Lock these figures so they cannot be changed by accident' : 'Unlock to type over these figures'}
      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
        open
          ? isLightMode
            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
          : isLightMode
            ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
      }`}
    >
      {open ? <LockOpen size={13} /> : <Lock size={13} />}
      {open ? 'Editing - lock when done' : 'Locked'}
    </button>
  );
}

/** A figure the slide reads off the P&L: shown the way it will appear, never typed into. */
function DerivedField({ label, text, isLightMode, tone }: { label: string; text: string; isLightMode: boolean; tone?: 'growth' }) {
  return (
    <div>
      <label className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
        {label}
        <Lock size={9} className="text-slate-400" aria-label="Comes from the P&L" />
      </label>
      <div
        className={`w-full text-xs rounded-lg border border-dashed px-2.5 py-1.5 font-bold ${
          isLightMode ? 'bg-slate-100/70 border-slate-300 text-slate-500' : 'bg-slate-900/40 border-slate-700 text-slate-400'
        } ${tone === 'growth' ? 'font-semibold' : ''}`}
      >
        {text}
      </div>
    </div>
  );
}

/** The lines of each table. Kept out here so the grids are handed the same array on every render:
 *  a new one makes them rebuild their columns and rows, and an edit made mid-rebuild is lost. */
const REVENUE_ROWS = [{ field: 'value', label: 'Revenue' }];
const PNL_ROWS = [
  { field: 'gp', label: 'Gross Profit' },
  { field: 'ebitda', label: 'EBITDA' },
  { field: 'ebit', label: 'EBIT' },
  { field: 'eat', label: 'Net Profit (EAT)' },
];
const MARGIN_ROWS = [
  { field: 'gpm', label: 'Gross Profit Margin', unit: 'pct' as const },
  { field: 'ebitdam', label: 'EBITDA Margin', unit: 'pct' as const },
  { field: 'ebitm', label: 'Operating Margin', unit: 'pct' as const },
  { field: 'eatm', label: 'Net Margin', unit: 'pct' as const },
];
const CASHFLOW_ROWS = [
  { field: 'cfo', label: 'Operating (CFO)' },
  { field: 'cfi', label: 'Investing (CFI)' },
  { field: 'cff', label: 'Financing (CFF)' },
];

const PNL_LINES = ['gp', 'ebitda', 'ebit', 'eat'] as const;
type PnlLine = (typeof PNL_LINES)[number];

interface HighlightsStudioProps {
  isLightMode?: boolean;
  /** Told whenever there are edits here that have not been saved, so the page can say so */
  onDirtyChange?: (dirty: boolean) => void;
  /** Handed this studio's save, so the Save button in the top bar can reach it */
  saveRef?: React.MutableRefObject<(() => Promise<boolean>) | null>;
}

export default function HighlightsStudio({ isLightMode = true, onDirtyChange, saveRef }: HighlightsStudioProps) {
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
  // The P&L the slide is drawn from, so the figures shown here are the ones the slide will show
  const [pnlItems, setPnlItems] = useState<Record<string, FinancialRowData>>();
  // What was last loaded or saved. Anything else on screen is an edit nobody has kept yet.
  const [saved, setSaved] = useState<string>();
  /**
   * The two tables of figures start locked. A figure typed here is a decision someone made against
   * what the P&L says, and an open grid is one stray keystroke away from losing it. Unlocking is a
   * deliberate act, and a save locks them again.
   */
  const [editing, setEditing] = useState({ revenue: false, pnl: false });

  // Undo/redo for the figures typed into the grids. Plain text fields keep the browser's own undo.
  const { push, undo, redo, clear: clearHistory, canUndo, canRedo } = useEditHistory<FinancialHighlightsData>();
  const dataRef = useRef(highlightsData);
  dataRef.current = highlightsData;
  // What a save would send. Kept in a ref so the save can be handed out without being rebuilt.
  const sourcedRef = useRef<FinancialHighlightsData>(INITIAL_HIGHLIGHTS_DATA);
  const rememberBeforeEdit = () => push(dataRef.current);
  const onUndo = useCallback(() => {
    const previous = undo(dataRef.current);
    if (previous) setHighlightsData(previous);
  }, [undo]);
  const onRedo = useCallback(() => {
    const next = redo(dataRef.current);
    if (next) setHighlightsData(next);
  }, [redo]);

  // Fetch saved highlights and the P&L they are read off, on mount
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [highlights, scenario] = await Promise.all([
          fetch('/api/highlights'),
          fetch(`/api/scenarios/${PNL_SOURCE_SLUG}`),
        ]);
        if (highlights.ok) {
          const json = await highlights.json();
          if (json.data) {
            setHighlightsData(json.data);
            setSaved(JSON.stringify(json.data));
            clearHistory();
          }
        }
        if (scenario.ok) {
          const json = await scenario.json();
          if (json.data?.items) setPnlItems(json.data.items);
        }
      } catch (e) {
        console.error('Error fetching highlights:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Save to PostgreSQL. Returns whether it went through, so the Save button in the top bar can hold
  // its "saved" message back when it did not.
  const handleSave = useCallback(async () => {
    setSaveSuccess(false);
    setIsSaving(true);
    try {
      const body = sourcedRef.current;
      const res = await fetch('/api/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        alert('Failed to save to database');
        return false;
      }
      setSaveSuccess(true);
      setSaved(JSON.stringify(dataRef.current));
      setEditing({ revenue: false, pnl: false });
      return true;
    } catch (e) {
      console.error('Error saving highlights:', e);
      alert('Error saving highlights');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleReset = () => {
    if (confirm('Put the slide wording and the Actual/Forecast marking back to the baseline? The figures stay as they are in the P&L.')) {
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

  const toggleRevenueForecast = (year: string) => {
    rememberBeforeEdit();
    setHighlightsData((prev) => ({
      ...prev,
      revenueTrajectory: prev.revenueTrajectory.map((pt) =>
        pt.year === year ? { ...pt, isForecast: !pt.isForecast } : pt
      ),
    }));
  };

  // Revenue and the four profit lines are lines of the P&L, and the margins follow from them, so the
  // slide reads them off the P&L rather than keeping a copy that can drift. A profit figure can still
  // be typed over year by year; that figure is kept separately, so the table can show which of its
  // numbers have left the P&L behind and put any of them back.
  const sourced = useMemo(() => applyPnlSource(highlightsData, pnlItems), [highlightsData, pnlItems]);
  sourcedRef.current = sourced;

  // Edits nobody has kept yet, and a way for the page around this studio to save them
  const dirty = saved !== undefined && JSON.stringify(highlightsData) !== saved;
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (!saveRef) return;
    saveRef.current = handleSave;
    return () => { saveRef.current = null; };
  }, [saveRef, handleSave]);
  const margins = sourced.marginsTrajectory;

  const overrides = highlightsData.pnlOverrides;
  const isTyped = useCallback(
    (field: string, year: string) => {
      const typed = overrides?.[year]?.[field as PnlLine];
      return typeof typed === 'number' && Number.isFinite(typed);
    },
    [overrides]
  );
  const cellSource = useCallback(
    (field: string, year: string) => (isTyped(field, year) ? ('override' as const) : ('source' as const)),
    [isTyped]
  );
  const typedLines = useMemo(
    () => PNL_LINES.filter((line) => Object.values(overrides ?? {}).some((lines) => typeof lines[line] === 'number')) as string[],
    [overrides]
  );

  const updatePnlPoint = useCallback((year: string, field: PnlLine, value: number) => {
    rememberBeforeEdit();
    setHighlightsData((prev) => {
      const fromPnl = pnlFigure(pnlItems, field, year);
      const forYear = { ...(prev.pnlOverrides?.[year] ?? {}) };
      // Typing the figure the P&L already has puts the cell back under the P&L rather than pinning it
      if (fromPnl !== null && Math.abs(fromPnl - value) < 0.005) delete forYear[field];
      else forYear[field] = value;

      const next = { ...(prev.pnlOverrides ?? {}) };
      if (Object.keys(forYear).length === 0) delete next[year];
      else next[year] = forYear;
      return { ...prev, pnlOverrides: next };
    });
  }, [pnlItems]);

  const revertPnlLine = useCallback((field: string) => {
    rememberBeforeEdit();
    setHighlightsData((prev) => {
      const next: typeof prev.pnlOverrides = {};
      for (const [year, lines] of Object.entries(prev.pnlOverrides ?? {})) {
        const kept = { ...lines };
        delete kept[field as PnlLine];
        if (Object.keys(kept).length > 0) next[year] = kept;
      }
      return { ...prev, pnlOverrides: next };
    });
  }, []);

  const revenueOverrides = highlightsData.revenueOverrides;
  const revenueCellSource = useCallback(
    (_field: string, year: string) => {
      const typed = revenueOverrides?.[year];
      return typeof typed === 'number' && Number.isFinite(typed) ? ('override' as const) : ('source' as const);
    },
    [revenueOverrides]
  );
  const typedRevenueRows = useMemo(
    () => (Object.values(revenueOverrides ?? {}).some((value) => typeof value === 'number') ? ['value'] : []),
    [revenueOverrides]
  );

  const onRevenueEdit = useCallback(
    (_field: string, year: string, value: number) => {
      rememberBeforeEdit();
      setHighlightsData((prev) => {
        const fromPnl = pnlFigure(pnlItems, 'revenue', year);
        const next = { ...(prev.revenueOverrides ?? {}) };
        if (fromPnl !== null && Math.abs(fromPnl - value) < 0.005) delete next[year];
        else next[year] = value;
        return { ...prev, revenueOverrides: next };
      });
    },
    [pnlItems]
  );

  const revertAllRevenue = useCallback(() => {
    rememberBeforeEdit();
    setHighlightsData((prev) => ({ ...prev, revenueOverrides: {} }));
  }, []);

  const revertAllPnl = useCallback(() => {
    rememberBeforeEdit();
    setHighlightsData((prev) => ({ ...prev, pnlOverrides: {} }));
  }, []);

  const onPnlEdit = useCallback(
    (field: string, year: string, value: number) => updatePnlPoint(year, field as PnlLine, value),
    [updatePnlPoint]
  );

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
                <div className="flex items-center gap-2">
                  <h2 className={`text-base font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    Financial Highlights Deck Studio
                  </h2>
                  {dirty && <UnsavedBadge isLightMode={isLightMode} />}
                </div>
                <p className="text-xs text-slate-400">
                  The figures come from {PNL_SOURCE_TITLE}. Here you set what the slide says about them.
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
              title="Put the slide wording and Actual/Forecast marking back to the baseline"
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
              The four cards across the top of the slide. The figures are the last year of the charts
              below against the year before it, so they come from {PNL_SOURCE_TITLE}; the wording next
              to them is yours.
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
              <DerivedField label="Value (IDR Bn)" text={formatBn(sourced.kpis.revenue.value)} isLightMode={isLightMode} />
              <div className="grid grid-cols-2 gap-2">
                <DerivedField label="YoY %" text={formatPct(sourced.kpis.revenue.yoyPct)} isLightMode={isLightMode} tone="growth" />
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
              <DerivedField label="Value (IDR Bn)" text={formatBn(sourced.kpis.ebitda.value)} isLightMode={isLightMode} />
              <div className="grid grid-cols-2 gap-2">
                <DerivedField label="YoY %" text={formatPct(sourced.kpis.ebitda.yoyPct)} isLightMode={isLightMode} tone="growth" />
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
              <DerivedField label="Value (IDR Bn)" text={formatBn(sourced.kpis.eat.value)} isLightMode={isLightMode} />
              <div className="grid grid-cols-2 gap-2">
                <DerivedField label="YoY %" text={formatPct(sourced.kpis.eat.yoyPct)} isLightMode={isLightMode} tone="growth" />
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
              <DerivedField label="Value (%)" text={formatPct(sourced.kpis.gpm.value)} isLightMode={isLightMode} />
              <div className="grid grid-cols-2 gap-2">
                <DerivedField label="YoY Diff (%)" text={formatPct(sourced.kpis.gpm.yoyDiff)} isLightMode={isLightMode} tone="growth" />
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
            <p className="text-xs text-slate-400 mt-0.5">
              Total Revenue (Net). It follows {PNL_SOURCE_TITLE} until you type over a year, and a figure
              you type is marked and can be put back. The Actual / Forecast tag on each year is yours: it
              decides whether the bar is drawn solid or hatched.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {editing.revenue && typedRevenueRows.length > 0 && (
              <button
                onClick={revertAllRevenue}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  isLightMode
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
                title={`Put every year in this table back to ${PNL_SOURCE_TITLE}`}
              >
                <RotateCcw size={13} />
                Take all from P&amp;L
              </button>
            )}
            <LockToggle
              open={editing.revenue}
              onToggle={() => setEditing((prev) => ({ ...prev, revenue: !prev.revenue }))}
              isLightMode={isLightMode}
            />
          </div>
        </div>
        <HighlightsMatrix
          rows={REVENUE_ROWS}
          points={sourced.revenueTrajectory}
          caption="IDR Billion"
          isLightMode={isLightMode}
          locked={!editing.revenue}
          onEdit={onRevenueEdit}
          cellSource={revenueCellSource}
          overriddenRows={typedRevenueRows}
          onRevertRow={editing.revenue ? revertAllRevenue : undefined}
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
            <p className="text-xs text-slate-400 mt-0.5">
              The four bars shown for each year on the slide. They follow {PNL_SOURCE_TITLE} - Gross Profit,
              EBITDA after holding cost, Operating Profit (EBIT) and Net Profit After Tax - until you type
              over one. A figure you type is marked, and can be put back.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {editing.pnl && typedLines.length > 0 && (
              <button
                onClick={revertAllPnl}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  isLightMode
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
                title={`Put every figure in this table back to ${PNL_SOURCE_TITLE}`}
              >
                <RotateCcw size={13} />
                Take all from P&amp;L
              </button>
            )}
            <LockToggle
              open={editing.pnl}
              onToggle={() => setEditing((prev) => ({ ...prev, pnl: !prev.pnl }))}
              isLightMode={isLightMode}
            />
          </div>
        </div>
        <HighlightsMatrix
          rows={PNL_ROWS}
          points={sourced.pnlTrajectory}
          caption="IDR Billion"
          isLightMode={isLightMode}
          locked={!editing.pnl}
          onEdit={onPnlEdit}
          cellSource={cellSource}
          overriddenRows={typedLines}
          onRevertRow={editing.pnl ? revertPnlLine : undefined}
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
          rows={MARGIN_ROWS}
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
          rows={CASHFLOW_ROWS}
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
