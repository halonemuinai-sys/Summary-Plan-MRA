'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save, PlusCircle, ExternalLink, Copy, Check,
  FileSpreadsheet, Lock, Edit3, ArrowRight, Database,
  Sparkles, CheckCircle2
} from 'lucide-react';
import { ScenarioDataset, FinancialRowData } from '@/lib/types';
import { INITIAL_DATASET } from '@/lib/initial-data';
import { recalculateFinancials } from '@/lib/formula-engine';
import confetti from 'canvas-confetti';

export default function AdminPage() {
  const router = useRouter();
  const [dataset, setDataset] = useState<ScenarioDataset>(INITIAL_DATASET);
  const [activeScenarioSlug, setActiveScenarioSlug] = useState(INITIAL_DATASET.slug);
  const [scenarioTitle, setScenarioTitle] = useState(INITIAL_DATASET.title);
  const [newSlug, setNewSlug] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [scenariosList, setScenariosList] = useState<ScenarioDataset[]>([INITIAL_DATASET]);
  const [highlightedRow, setHighlightedRow] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');

  // Focus years for business plan (2024 to 2031)
  const displayYears = dataset.years.filter(y => parseInt(y) >= 2024);

  // Load scenarios from PostgreSQL on mount & set origin safely
  useEffect(() => {
    fetchScenarios();
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const fetchScenarios = async () => {
    try {
      const res = await fetch('/api/scenarios');
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setScenariosList(json.data);
        }
      }
    } catch (err) {
      console.error('Error fetching scenarios:', err);
    }
  };

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  const handleCellChange = (key: string, year: string, valStr: string) => {
    const num = parseFloat(valStr) || 0;
    const newItems = { ...dataset.items };
    if (newItems[key]) {
      newItems[key] = {
        ...newItems[key],
        values: {
          ...newItems[key].values,
          [year]: num
        }
      };
    }

    // Recalculate derived formulas automatically
    const recalculated = recalculateFinancials(newItems, dataset.years);
    setDataset(prev => ({
      ...prev,
      items: recalculated
    }));

    setHighlightedRow(key);
    setTimeout(() => setHighlightedRow(null), 1200);
  };

  const handleSaveAsNew = async () => {
    if (!newSlug.trim()) {
      alert('Please enter a scenario slug (URL identifier)');
      return;
    }

    const cleanSlug = newSlug.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const newDataset: ScenarioDataset = {
      ...dataset,
      id: cleanSlug,
      slug: cleanSlug,
      title: scenarioTitle || `Scenario ${cleanSlug}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setIsSaving(true);
    try {
      const res = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDataset)
      });

      if (res.ok) {
        setSaveSuccess(true);
        setActiveScenarioSlug(cleanSlug);
        setNewSlug('');
        fetchScenarios();
        triggerCelebration();
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Error saving scenario:', err);
      alert('Failed to save scenario into PostgreSQL');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCurrent = async () => {
    setIsSaving(true);
    try {
      const updated: ScenarioDataset = {
        ...dataset,
        title: scenarioTitle,
        updatedAt: new Date().toISOString()
      };

      const res = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });

      if (res.ok) {
        setSaveSuccess(true);
        fetchScenarios();
        triggerCelebration();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error updating scenario:', err);
      alert('Failed to update scenario');
    } finally {
      setIsSaving(false);
    }
  };

  const presentationUrl = origin ? `${origin}/p/${activeScenarioSlug}` : `/p/${activeScenarioSlug}`;

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Glassmorphic Header */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-[#0B0F19]/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white">MRA P&L Data Studio</h1>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                <Database className="w-3 h-3" />
                PostgreSQL Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive In-Browser Spreadsheet Grid & Dynamic Multi-Scenario Generator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/p/${activeScenarioSlug}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
          >
            <ExternalLink className="w-4 h-4" />
            Launch 16:9 Presentation Deck
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">

        {/* Action Panel: 2 Executive Cards (Clean 2-Column Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* 2. Active Scenario Settings */}
          <div className="bg-[#101726]/90 border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between shadow-xl backdrop-blur-sm">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-amber-400" />
                Active Scenario Info
              </h2>
              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Scenario Title</label>
                  <input
                    type="text"
                    value={scenarioTitle}
                    onChange={(e) => setScenarioTitle(e.target.value)}
                    className="w-full text-xs rounded-lg bg-slate-900/80 border border-slate-700/80 px-3 py-1.5 text-white font-medium focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Select Stored Scenario ({scenariosList.length})</label>
                  <select
                    value={activeScenarioSlug}
                    onChange={(e) => {
                      const sel = scenariosList.find(s => s.slug === e.target.value);
                      if (sel) {
                        setActiveScenarioSlug(sel.slug);
                        setDataset(sel);
                        setScenarioTitle(sel.title);
                      }
                    }}
                    className="w-full text-xs rounded-lg bg-slate-900/80 border border-slate-700/80 px-3 py-1.5 text-white font-medium focus:border-blue-500 outline-none"
                  >
                    {scenariosList.map(s => (
                      <option key={s.slug} value={s.slug}>{s.title} ({s.slug})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <button
                onClick={handleUpdateCurrent}
                disabled={isSaving}
                className="w-full text-xs font-semibold py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/20 active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Updating...' : 'Save Changes to Current Scenario'}
              </button>
            </div>
          </div>

          {/* 3. Publish as New Unique Link */}
          <div className="bg-[#101726]/90 border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between shadow-xl backdrop-blur-sm">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Publish New Unique Link
                </h2>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded border border-emerald-500/20">
                  New URL
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                Modified numbers? Generate an independent, permanent presentation URL without overwriting previous decks.
              </p>
              <div>
                <label className="text-[11px] font-semibold text-slate-400">Slug Identifier (/p/[slug])</label>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-slate-500 bg-slate-900 px-2.5 py-1.5 rounded-l-lg border border-r-0 border-slate-700">/p/</span>
                  <input
                    type="text"
                    placeholder="e.g. mra-optimistic-opex-2027"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    className="w-full text-xs rounded-r-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white focus:border-emerald-500 outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <button
                onClick={handleSaveAsNew}
                disabled={isSaving}
                className="w-full text-xs font-semibold py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                {isSaving ? 'Publishing...' : 'Publish as New Scenario Link'}
              </button>
              {saveSuccess && (
                <div className="text-[11px] text-emerald-400 flex items-center justify-center gap-1 font-medium animate-pulse">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Scenario committed to PostgreSQL!
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Live Presentation URL Sharing Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-400 font-medium">Live Presentation URL:</span>
            <span 
              suppressHydrationWarning 
              className="text-xs font-mono text-blue-400 font-semibold bg-slate-950 px-3 py-1 rounded-lg border border-slate-800"
            >
              {presentationUrl}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(presentationUrl);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'Copied' : 'Copy Link'}
            </button>
            <button
              onClick={() => router.push(`/p/${activeScenarioSlug}`)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/30 active:scale-95"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              Open Deck
            </button>
          </div>
        </div>

        {/* In-Browser Interactive Spreadsheet Grid */}
        <div className="bg-[#101726]/90 border border-slate-800/90 rounded-2xl p-5 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                In-Browser Spreadsheet Grid: PL MRA Group+Holding (Combine)
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                  Live Recalculate Active
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Click on any cell to edit numbers (Values in IDR Billion). Gross Profit, OPEX, EBITDA, and NPAT auto-recalculate.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl max-h-[550px] shadow-inner">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#162032] text-slate-200 sticky top-0 z-20 shadow">
                <tr>
                  <th className="py-3 px-4 font-semibold border-b border-r border-slate-700/80 w-64 bg-[#162032]">
                    Financial Line Item
                  </th>
                  {displayYears.map(y => (
                    <th key={y} className="py-3 px-4 font-semibold border-b border-r border-slate-700/80 text-right min-w-[105px]">
                      {y} {parseInt(y) === 2026 ? '(Proj)' : parseInt(y) >= 2027 ? '(Plan)' : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {Object.entries(dataset.items).map(([key, row]) => {
                  const isFormula = row.isFormula || ['gross_profit', 'gp_margin', 'total_opex', 'operating_profit', 'ebitda_after_holding', 'npat'].includes(key);
                  const isHeaderRow = ['total_revenue', 'gross_profit', 'total_opex', 'operating_profit', 'ebitda_after_holding', 'npat'].includes(key);
                  const isHighlighted = highlightedRow === key;

                  return (
                    <tr
                      key={key}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isHighlighted ? 'bg-blue-900/30' : isHeaderRow ? 'bg-slate-900/80 font-bold text-slate-100' : 'text-slate-300'
                      }`}
                    >
                      <td className="py-2.5 px-4 border-r border-slate-800/80 flex items-center justify-between">
                        <span className={key.startsWith('rev_') || key.startsWith('cogs_') ? 'pl-4 text-slate-400' : ''}>
                          {row.description}
                        </span>
                        {isFormula && (
                          <span title="Formula derived row (Auto-calculates)">
                            <Lock className="w-3 h-3 text-slate-500 ml-1 inline" />
                          </span>
                        )}
                      </td>

                      {displayYears.map(year => {
                        const val = row.values[year] ?? 0;
                        return (
                          <td key={year} className="py-1 px-2 border-r border-slate-800/80 text-right">
                            {isFormula ? (
                              <span className="font-mono text-emerald-400 font-semibold px-2 py-1 block">
                                {key.includes('margin') ? `${val}%` : val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <input
                                type="number"
                                step="0.1"
                                defaultValue={val}
                                onBlur={(e) => handleCellChange(key, year, e.target.value)}
                                className="w-full text-right font-mono text-xs rounded-lg px-2.5 py-1 bg-slate-900/80 border border-slate-700/60 hover:border-blue-500 focus:border-blue-400 focus:bg-slate-800 text-white outline-none transition-all shadow-inner"
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
