'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save, PlusCircle, ExternalLink, Copy, Check,
  Lock, Edit3, ArrowRight, Database, Sparkles, CheckCircle2,
  Table2, Layers, FolderKanban, Trash2, TrendingUp, AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from 'recharts';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { ScenarioDataset } from '@/lib/types';
import { INITIAL_DATASET } from '@/lib/initial-data';
import { recalculateFinancials } from '@/lib/formula-engine';
import confetti from 'canvas-confetti';

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'divisions' | 'scenarios'
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
  const displayYears = dataset.years.filter((y) => parseInt(y) >= 2024);

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
        origin: { y: 0.6 },
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
          [year]: num,
        },
      };
    }

    // Recalculate derived formulas automatically
    const recalculated = recalculateFinancials(newItems, dataset.years);
    setDataset((prev) => ({
      ...prev,
      items: recalculated,
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
      updatedAt: new Date().toISOString(),
    };

    setIsSaving(true);
    try {
      const res = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDataset),
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
        updatedAt: new Date().toISOString(),
      };

      const res = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
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

  const handleCopyLink = () => {
    const fullUrl = origin
      ? `${origin}/p/${activeScenarioSlug}`
      : `/p/${activeScenarioSlug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const presentationUrl = origin
    ? `${origin}/p/${activeScenarioSlug}`
    : `/p/${activeScenarioSlug}`;

  // Data for Division Analysis Chart
  const divisionChartData = displayYears.map((year) => ({
    year,
    Retail: dataset.items['rev_retail']?.values[year] ?? 0,
    FnB: dataset.items['rev_fnb']?.values[year] ?? 0,
    Media: dataset.items['rev_publisher']?.values[year] ?? 0,
  }));

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex selection:bg-blue-600 selection:text-white">
      {/* Side Menu (Matching Reference UI in D:\Private Project\Dashboard MRA) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dataset={dataset}
        activeScenarioSlug={activeScenarioSlug}
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-w-0 transition-all duration-300">
        {/* Topbar with scenario controls */}
        <Topbar
          title={
            activeTab === 'grid'
              ? 'P&L Consolidation Grid (Sheet: PL Combine)'
              : activeTab === 'divisions'
              ? 'Division Breakdown Analysis'
              : 'Scenario Management & PostgreSQL Registry'
          }
          activeScenarioSlug={activeScenarioSlug}
          setActiveScenarioSlug={(slug) => {
            const sel = scenariosList.find((s) => s.slug === slug);
            if (sel) {
              setActiveScenarioSlug(sel.slug);
              setDataset(sel);
              setScenarioTitle(sel.title);
            }
          }}
          scenariosList={scenariosList}
          onSaveCurrent={handleUpdateCurrent}
          isSaving={isSaving}
          copiedLink={copiedLink}
          onCopyLink={handleCopyLink}
        />

        {/* Dynamic Tab Body */}
        <div className="p-6 max-w-7xl mx-auto w-full space-y-6">

          {/* Quick Scenario Banner */}
          <div className="bg-[#101726]/90 border border-slate-800/90 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Sparkles size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white">{dataset.title}</h2>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded border border-emerald-500/20">
                    Active Deck
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-400 font-mono" suppressHydrationWarning>
                    URL: {presentationUrl}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
              >
                {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                {copiedLink ? 'Copied' : 'Copy Link'}
              </button>
              <button
                onClick={() => router.push(`/p/${activeScenarioSlug}`)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/30 active:scale-95"
              >
                <ExternalLink size={13} />
                Open Presentation Deck
              </button>
            </div>
          </div>

          {/* TAB 1: P&L CONSOLIDATION GRID */}
          {activeTab === 'grid' && (
            <div className="space-y-6">
              {/* Scenario Settings / Creation 2-Column Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 1. Active Scenario Settings */}
                <div className="bg-[#101726]/90 border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between shadow-xl backdrop-blur-sm">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4 text-amber-400" />
                      Active Scenario Details
                    </h3>
                    <div className="space-y-2.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400">Scenario Title</label>
                        <input
                          type="text"
                          value={scenarioTitle}
                          onChange={(e) => setScenarioTitle(e.target.value)}
                          className="w-full text-xs rounded-lg bg-slate-900/80 border border-slate-700/80 px-3 py-2 text-white font-medium focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400">Database Storage</label>
                        <div className="text-xs text-emerald-400 bg-slate-900/80 border border-slate-700/80 px-3 py-2 rounded-lg font-mono flex items-center gap-2">
                          <Database size={13} />
                          PostgreSQL 17 (Table: scenarios, Slug: {activeScenarioSlug})
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
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

                {/* 2. Publish New Unique Link */}
                <div className="bg-[#101726]/90 border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between shadow-xl backdrop-blur-sm">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        Publish New Unique Link
                      </h3>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded border border-emerald-500/20">
                        New URL
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">
                      Modified figures? Create a new separate URL without overwriting previous decks.
                    </p>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400">Slug Identifier (/p/[slug])</label>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-slate-500 bg-slate-900 px-3 py-2 rounded-l-lg border border-r-0 border-slate-700 font-mono">
                          /p/
                        </span>
                        <input
                          type="text"
                          placeholder="e.g. mra-scenario-optimistic-2027"
                          value={newSlug}
                          onChange={(e) => setNewSlug(e.target.value)}
                          className="w-full text-xs rounded-r-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:border-emerald-500 outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
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

              {/* In-Browser Interactive Spreadsheet Grid */}
              <div className="bg-[#101726]/90 border border-slate-800/90 rounded-2xl p-5 shadow-2xl backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      In-Browser Spreadsheet Grid: PL MRA Group+Holding (Combine)
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                        Live Recalculate Active
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Click on any numeric cell to edit. GP, OPEX, EBITDA, and NPAT auto-recalculate in real-time. (IDR Billion).
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
                        {displayYears.map((y) => (
                          <th
                            key={y}
                            className="py-3 px-4 font-semibold border-b border-r border-slate-700/80 text-right min-w-[105px]"
                          >
                            {y} {parseInt(y) === 2026 ? '(Proj)' : parseInt(y) >= 2027 ? '(Plan)' : ''}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {Object.entries(dataset.items).map(([key, row]) => {
                        const isFormula =
                          row.isFormula ||
                          [
                            'gross_profit',
                            'gp_margin',
                            'total_opex',
                            'operating_profit',
                            'ebitda_after_holding',
                            'npat',
                          ].includes(key);
                        const isHeaderRow = [
                          'total_revenue',
                          'gross_profit',
                          'total_opex',
                          'operating_profit',
                          'ebitda_after_holding',
                          'npat',
                        ].includes(key);
                        const isHighlighted = highlightedRow === key;

                        return (
                          <tr
                            key={key}
                            className={`hover:bg-slate-800/40 transition-colors ${
                              isHighlighted
                                ? 'bg-blue-900/30'
                                : isHeaderRow
                                ? 'bg-slate-900/80 font-bold text-slate-100'
                                : 'text-slate-300'
                            }`}
                          >
                            <td className="py-2.5 px-4 border-r border-slate-800/80 flex items-center justify-between">
                              <span
                                className={
                                  key.startsWith('rev_') || key.startsWith('cogs_')
                                    ? 'pl-4 text-slate-400'
                                    : ''
                                }
                              >
                                {row.description}
                              </span>
                              {isFormula && (
                                <span title="Formula derived row (Auto-calculates)">
                                  <Lock className="w-3 h-3 text-slate-500 ml-1 inline" />
                                </span>
                              )}
                            </td>

                            {displayYears.map((year) => {
                              const val = row.values[year] ?? 0;
                              return (
                                <td key={year} className="py-1 px-2 border-r border-slate-800/80 text-right">
                                  {isFormula ? (
                                    <span className="font-mono text-emerald-400 font-semibold px-2 py-1 block">
                                      {key.includes('margin')
                                        ? `${val}%`
                                        : val.toLocaleString(undefined, {
                                            minimumFractionDigits: 1,
                                            maximumFractionDigits: 2,
                                          })}
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
          )}

          {/* TAB 2: DIVISION BREAKDOWN */}
          {activeTab === 'divisions' && (
            <div className="space-y-6">
              <div className="bg-[#101726]/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-400" />
                      Division Revenue Trajectory (Retail vs F&B vs Media)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Multi-year contribution across MRA business units (2024–2031 in IDR Billion).
                    </p>
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={divisionChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                      <XAxis dataKey="year" stroke="#94A3B8" fontSize={11} />
                      <YAxis stroke="#94A3B8" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderColor: '#334155',
                          borderRadius: 10,
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="Retail" name="Divisi Retail (Bvlgari, Omega, Atmos)" fill="#3B82F6" stackId="a" />
                      <Bar dataKey="FnB" name="Divisi Food & Beverages (Haagen-Dazs, Tomita)" fill="#F97316" stackId="a" />
                      <Bar dataKey="Media" name="Divisi Media (Publisher)" fill="#10B981" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Division Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#101726]/90 border border-slate-800/90 rounded-2xl p-5 shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    Retail Division
                  </span>
                  <h4 className="text-xl font-black text-white mt-2">
                    {dataset.items['rev_retail']?.values['2031']?.toLocaleString()} IDRbn
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    2031 Projected Sales (Bvlgari, Omega, Atmos, Metrox)
                  </p>
                </div>

                <div className="bg-[#101726]/90 border border-slate-800/90 rounded-2xl p-5 shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Food & Beverages
                  </span>
                  <h4 className="text-xl font-black text-white mt-2">
                    {dataset.items['rev_fnb']?.values['2031']?.toLocaleString()} IDRbn
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    2031 Projected Sales (Haagen-Dazs, Tomita Ramen, Jamba Juice)
                  </p>
                </div>

                <div className="bg-[#101726]/90 border border-slate-800/90 rounded-2xl p-5 shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Publisher Media
                  </span>
                  <h4 className="text-xl font-black text-white mt-2">
                    {dataset.items['rev_publisher']?.values['2031']?.toLocaleString()} IDRbn
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    2031 Projected Sales (MRA Media Publishing & Digital)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SCENARIO MANAGER */}
          {activeTab === 'scenarios' && (
            <div className="space-y-6">
              <div className="bg-[#101726]/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <FolderKanban className="w-4 h-4 text-blue-400" />
                      PostgreSQL Scenario Registry ({scenariosList.length} Active Decks)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      All presentation decks are stored independently in PostgreSQL with dedicated URL slugs.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3">
                  {scenariosList.map((sc) => {
                    const isCurrent = sc.slug === activeScenarioSlug;
                    return (
                      <div
                        key={sc.slug}
                        className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                          isCurrent
                            ? 'bg-slate-800/90 border-blue-500/60 shadow-lg shadow-blue-900/20'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{sc.title}</h4>
                            {isCurrent && (
                              <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded">
                                Loaded
                              </span>
                            )}
                            {sc.slug === INITIAL_DATASET.slug && (
                              <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                                Baseline
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-mono">
                            /p/{sc.slug}
                          </p>
                          {sc.updatedAt && (
                            <p className="text-[10px] text-slate-500">
                              Updated: {new Date(sc.updatedAt).toLocaleString('en-US')}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {!isCurrent && (
                            <button
                              onClick={() => {
                                setActiveScenarioSlug(sc.slug);
                                setDataset(sc);
                                setScenarioTitle(sc.title);
                              }}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                            >
                              Load into Editor
                            </button>
                          )}
                          <button
                            onClick={() => router.push(`/p/${sc.slug}`)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all"
                          >
                            <ExternalLink size={13} />
                            Launch Deck
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
