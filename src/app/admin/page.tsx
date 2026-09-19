'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save, PlusCircle, ExternalLink, Copy, Check,
  Lock, Edit3, Sparkles, CheckCircle2,
  Table2, Layers, FolderKanban, TrendingUp, CheckCircle,
  Percent, Coins, Building2, ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from 'recharts';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { ScenarioDataset, BrandRowData } from '@/lib/types';
import { INITIAL_DATASET, INITIAL_BRAND_BREAKDOWN } from '@/lib/initial-data';
import { recalculateFinancials, recalculateBrandBreakdown } from '@/lib/formula-engine';
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
  const [isLightMode, setIsLightMode] = useState(false);
  const [brandViewMode, setBrandViewMode] = useState<'bn' | 'full' | 'growth'>('bn');
  const [highlightedBrandRow, setHighlightedBrandRow] = useState<string | null>(null);
  const brandYears = ['2026', '2027', '2028', '2029', '2030', '2031'];

  const currentBrands: BrandRowData[] =
    dataset.brandBreakdown && dataset.brandBreakdown.length > 0
      ? dataset.brandBreakdown
      : INITIAL_BRAND_BREAKDOWN;

  const topBrands2031 = [...currentBrands]
    .filter(
      (b) =>
        !['total', 'header_fnb', 'header_retail', 'acquisition'].includes(b.category) &&
        (b.valuesBn['2031'] || 0) > 0
    )
    .sort((a, b) => (b.valuesBn['2031'] || 0) - (a.valuesBn['2031'] || 0))
    .slice(0, 5);

  const totalRev2031 =
    currentBrands.find((b) => b.category === 'total')?.valuesBn['2031'] || 3408.64;

  const handleBrandCellChange = (brandId: string, year: string, valStr: string) => {
    const cleanStr = valStr.replace(/[^0-9.-]+/g, '');
    const rawNum = parseFloat(cleanStr) || 0;
    const updatedBrands = currentBrands.map((b) => {
      if (b.id !== brandId) return b;
      let numBn = rawNum;
      let numIdr = rawNum;
      if (brandViewMode === 'full') {
        numBn = Number((rawNum / 1e9).toFixed(2));
        numIdr = rawNum;
      } else {
        numBn = rawNum;
        numIdr = rawNum * 1e9;
      }
      return {
        ...b,
        valuesBn: { ...b.valuesBn, [year]: numBn },
        valuesIdr: { ...b.valuesIdr, [year]: numIdr },
      };
    });

    const recalculated = recalculateBrandBreakdown(updatedBrands, brandYears);
    setDataset((prev) => ({
      ...prev,
      brandBreakdown: recalculated,
    }));
    setHighlightedBrandRow(brandId);
  };

  // Focus years for business plan (2024 to 2031)
  const displayYears = dataset.years.filter((y) => parseInt(y) >= 2024);

  // Load scenarios on mount & set origin safely
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
          const loadedScenarios = json.data.map((sc: ScenarioDataset) => ({
            ...sc,
            brandBreakdown:
              sc.brandBreakdown && sc.brandBreakdown.length > 0
                ? sc.brandBreakdown
                : INITIAL_BRAND_BREAKDOWN,
          }));
          setScenariosList(loadedScenarios);
          if (loadedScenarios[0]) {
            setDataset(loadedScenarios[0]);
          }
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
      alert('Failed to save scenario');
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

  // Style Tokens based on isLightMode
  const pageBg = isLightMode ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#070B14] text-slate-100';
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
    <div className={`min-h-screen ${pageBg} flex transition-colors duration-300 selection:bg-blue-600 selection:text-white`}>
      {/* Side Menu */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dataset={dataset}
        activeScenarioSlug={activeScenarioSlug}
        isLightMode={isLightMode}
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-w-0 transition-all duration-300">
        {/* Topbar with Theme Switcher */}
        <Topbar
          title={
            activeTab === 'grid'
              ? 'P&L Consolidation Grid (Sheet: PL Combine)'
              : activeTab === 'divisions'
              ? 'Brand Revenue Matrix & Division Breakdown'
              : 'Scenario Management'
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
          isLightMode={isLightMode}
          onToggleTheme={() => setIsLightMode(!isLightMode)}
        />

        {/* Dynamic Tab Body */}
        <div className="p-6 max-w-7xl mx-auto w-full space-y-6">

          {/* Quick Scenario Banner */}
          <div className={`rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border transition-all ${cardBg}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <Sparkles size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className={`text-sm font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{dataset.title}</h2>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded border border-emerald-500/20">
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
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all active:scale-95 ${
                  isLightMode
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {copiedLink ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
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
                <div className={`rounded-2xl p-5 flex flex-col justify-between border transition-all ${cardBg}`}>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4 text-amber-500" />
                      Active Scenario Details
                    </h3>
                    <div className="space-y-2.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400">Scenario Title</label>
                        <input
                          type="text"
                          value={scenarioTitle}
                          onChange={(e) => setScenarioTitle(e.target.value)}
                          className={`w-full text-xs rounded-lg border px-3 py-2 font-medium outline-none transition-colors ${inputBg}`}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400">Scenario Identifier</label>
                        <div className={`text-xs px-3 py-2 rounded-lg font-mono flex items-center gap-2 border ${
                          isLightMode ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-900/80 border-slate-700/80 text-emerald-400'
                        }`}>
                          <CheckCircle size={13} className="text-emerald-500" />
                          <span>/p/{activeScenarioSlug} (Live Synchronized)</span>
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
                <div className={`rounded-2xl p-5 flex flex-col justify-between border transition-all ${cardBg}`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        Publish New Unique Link
                      </h3>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded border border-emerald-500/20">
                        New URL
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">
                      Modified figures? Create a new separate URL without overwriting previous decks.
                    </p>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400">Slug Identifier (/p/[slug])</label>
                      <div className="flex items-center mt-1">
                        <span className={`text-xs px-3 py-2 rounded-l-lg border border-r-0 font-mono ${
                          isLightMode ? 'bg-slate-100 border-slate-300 text-slate-500' : 'bg-slate-900 border-slate-700 text-slate-500'
                        }`}>
                          /p/
                        </span>
                        <input
                          type="text"
                          placeholder="e.g. mra-scenario-optimistic-2027"
                          value={newSlug}
                          onChange={(e) => setNewSlug(e.target.value)}
                          className={`w-full text-xs rounded-r-lg border px-3 py-2 focus:border-emerald-500 outline-none font-mono ${inputBg}`}
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
                      <div className="text-[11px] text-emerald-500 flex items-center justify-center gap-1 font-medium animate-pulse">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Scenario saved successfully!
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* In-Browser Interactive Spreadsheet Grid */}
              <div className={`rounded-2xl p-5 border transition-all ${cardBg}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className={`text-sm font-bold flex items-center gap-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      In-Browser Spreadsheet Grid: PL MRA Group+Holding (Combine)
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                        Live Recalculate Active
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Click on any numeric cell to edit. GP, OPEX, EBITDA, and NPAT auto-recalculate in real-time. (IDR Billion).
                    </p>
                  </div>
                </div>

                <div className={`overflow-x-auto border rounded-xl max-h-[550px] shadow-inner ${isLightMode ? 'border-slate-200' : 'border-slate-800'}`}>
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className={`${tableHeaderBg} sticky top-0 z-20 shadow`}>
                      <tr>
                        <th className={`py-3 px-4 font-semibold border-b border-r w-64 ${
                          isLightMode ? 'border-slate-300 bg-slate-100' : 'border-slate-700/80 bg-[#162032]'
                        }`}>
                          Financial Line Item
                        </th>
                        {displayYears.map((y) => (
                          <th
                            key={y}
                            className={`py-3 px-4 font-semibold border-b border-r text-right min-w-[105px] ${
                              isLightMode ? 'border-slate-300' : 'border-slate-700/80'
                            }`}
                          >
                            {y} {parseInt(y) === 2026 ? '(Proj)' : parseInt(y) >= 2027 ? '(Plan)' : ''}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isLightMode ? 'divide-slate-200' : 'divide-slate-800/80'}`}>
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
                            className={`transition-colors ${
                              isHighlighted
                                ? (isLightMode ? 'bg-blue-100/70' : 'bg-blue-900/30')
                                : isHeaderRow
                                ? (isLightMode ? 'bg-slate-50 font-bold text-slate-900' : 'bg-slate-900/80 font-bold text-slate-100')
                                : (isLightMode ? 'hover:bg-slate-50 text-slate-700' : 'hover:bg-slate-800/40 text-slate-300')
                            }`}
                          >
                            <td className={`py-2.5 px-4 border-r flex items-center justify-between ${
                              isLightMode ? 'border-slate-200' : 'border-slate-800/80'
                            }`}>
                              <span
                                className={
                                  key.startsWith('rev_') || key.startsWith('cogs_')
                                    ? (isLightMode ? 'pl-4 text-slate-500' : 'pl-4 text-slate-400')
                                    : ''
                                }
                              >
                                {row.description}
                              </span>
                              {isFormula && (
                                <span title="Formula derived row (Auto-calculates)">
                                  <Lock className="w-3 h-3 text-slate-400 ml-1 inline" />
                                </span>
                              )}
                            </td>

                            {displayYears.map((year) => {
                              const val = row.values[year] ?? 0;
                              return (
                                <td key={year} className={`py-1 px-2 border-r text-right ${
                                  isLightMode ? 'border-slate-200' : 'border-slate-800/80'
                                }`}>
                                  {isFormula ? (
                                    <span className={`font-mono font-semibold px-2 py-1 block ${
                                      isLightMode ? 'text-emerald-700' : 'text-emerald-400'
                                    }`}>
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
                                      className={`w-full text-right font-mono text-xs rounded-lg px-2.5 py-1 border outline-none transition-all shadow-inner ${cellInputBg}`}
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

          {/* TAB 2: DIVISION & BRAND PORTFOLIO BREAKDOWN */}
          {activeTab === 'divisions' && (
            <div className="space-y-6">
              {/* Top 5 Growth Driver Leaders (2031 Horizon) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {topBrands2031.map((brand, idx) => {
                  const val2031 = brand.valuesBn['2031'] || 0;
                  const pctShare = totalRev2031 > 0 ? ((val2031 / totalRev2031) * 100).toFixed(1) : '0';
                  return (
                    <div key={brand.id} className={`rounded-xl p-3.5 border transition-all ${cardBg}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400">#{idx + 1} Driver</span>
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {pctShare}% Share
                        </span>
                      </div>
                      <h4 className={`text-sm font-bold mt-1.5 truncate ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                        {brand.name}
                      </h4>
                      <p className="text-xs font-mono font-semibold text-blue-500 mt-0.5">
                        {val2031.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} IDRbn
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        2026: {brand.valuesBn['2026'] || 0} IDRbn
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Brand Revenue Matrix Spreadsheet Table */}
              <div className={`rounded-2xl p-5 border transition-all ${cardBg}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className={`text-sm font-bold flex items-center gap-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      <Building2 className="w-4 h-4 text-blue-500" />
                      Brand Revenue Matrix (2026–2031)
                      <span className="text-[10px] bg-blue-500/10 text-blue-500 font-semibold px-2 py-0.5 rounded border border-blue-500/20">
                        PL Combine: Rows 97–117
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Portofolio brand eksisting, akuisisi, dan unit bisnis baru. Nilai dapat diedit langsung dan tersinkronisasi otomatis.
                    </p>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400 hidden md:inline">Display Mode:</span>
                    <div className={`flex rounded-lg border p-0.5 ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-700'}`}>
                      <button
                        onClick={() => setBrandViewMode('bn')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                          brandViewMode === 'bn'
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        IDR Billion
                      </button>
                      <button
                        onClick={() => setBrandViewMode('full')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                          brandViewMode === 'full'
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Full Rupiah
                      </button>
                      <button
                        onClick={() => setBrandViewMode('growth')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                          brandViewMode === 'growth'
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        % YoY Growth
                      </button>
                    </div>

                    <button
                      onClick={handleUpdateCurrent}
                      disabled={isSaving}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow transition-all active:scale-95"
                    >
                      <Save size={12} />
                      {isSaving ? 'Saving...' : 'Save Matrix'}
                    </button>
                  </div>
                </div>

                {/* Table Container */}
                <div className={`overflow-x-auto border rounded-xl max-h-[600px] shadow-inner ${isLightMode ? 'border-slate-200' : 'border-slate-800'}`}>
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className={`${tableHeaderBg} sticky top-0 z-20 shadow`}>
                      <tr>
                        <th className={`py-3 px-4 font-semibold border-b border-r w-72 ${
                          isLightMode ? 'border-slate-300 bg-slate-100' : 'border-slate-700/80 bg-[#162032]'
                        }`}>
                          Brand / Business Unit
                        </th>
                        {brandYears.map((year) => (
                          <th
                            key={year}
                            className={`py-3 px-3 font-semibold border-b border-r text-right min-w-[125px] ${
                              isLightMode ? 'border-slate-300' : 'border-slate-700/80'
                            }`}
                          >
                            <span>{year}</span>
                            {parseInt(year) === 2026 && <span className="text-[10px] text-slate-400 font-normal ml-1">(Base)</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isLightMode ? 'divide-slate-200' : 'divide-slate-800/80'}`}>
                      {currentBrands.map((brand) => {
                        const isSectionHeader = ['header_fnb', 'header_retail'].includes(brand.category);
                        const isTotal = brand.category === 'total';
                        const isHighlighted = highlightedBrandRow === brand.id;

                        if (isSectionHeader) {
                          return (
                            <tr key={brand.id} className={isLightMode ? 'bg-slate-200/80' : 'bg-slate-800/80'}>
                              <td
                                colSpan={brandYears.length + 1}
                                className={`py-2 px-4 font-bold text-xs uppercase tracking-wider ${
                                  isLightMode ? 'text-slate-800' : 'text-slate-200'
                                }`}
                              >
                                <span>{brand.name}</span>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr
                            key={brand.id}
                            className={`transition-colors ${
                              isHighlighted
                                ? (isLightMode ? 'bg-blue-100/70' : 'bg-blue-900/30')
                                : isTotal
                                ? (isLightMode ? 'bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300' : 'bg-[#141E2E] font-bold text-slate-100 border-t-2 border-slate-700')
                                : (isLightMode ? 'hover:bg-slate-50 text-slate-700' : 'hover:bg-slate-800/40 text-slate-300')
                            }`}
                          >
                            <td className={`py-2.5 px-4 border-r flex items-center justify-between ${
                              isLightMode ? 'border-slate-200' : 'border-slate-800/80'
                            }`}>
                              <span className={['fnb_new', 'retail_new'].includes(brand.category) ? 'pl-4' : isTotal ? 'font-black tracking-wider' : 'font-semibold'}>
                                {brand.name}
                              </span>
                              {brand.category === 'existing' && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                  Core
                                </span>
                              )}
                              {brand.category === 'fnb_new' && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                  New F&B
                                </span>
                              )}
                              {brand.category === 'retail_new' && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                  New Retail
                                </span>
                              )}
                            </td>

                            {brandYears.map((year) => {
                              const valBn = brand.valuesBn[year] ?? 0;
                              const valIdr = brand.valuesIdr[year] ?? 0;
                              const growth = brand.growthPct?.[year];

                              return (
                                <td
                                  key={year}
                                  className={`py-1.5 px-2.5 border-r text-right ${
                                    isLightMode ? 'border-slate-200' : 'border-slate-800/80'
                                  }`}
                                >
                                  {isTotal ? (
                                    <div className="flex flex-col items-end">
                                      <span className={`font-mono font-black ${isLightMode ? 'text-blue-700' : 'text-blue-400'}`}>
                                        {brandViewMode === 'full'
                                          ? valIdr.toLocaleString('id-ID')
                                          : `${valBn.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} bn`}
                                      </span>
                                      {growth !== undefined && growth !== null && (
                                        <span className="text-[10px] text-emerald-500 font-semibold">
                                          +{growth}% YoY
                                        </span>
                                      )}
                                    </div>
                                  ) : brandViewMode === 'growth' ? (
                                    <div className="flex items-center justify-end">
                                      {growth === null || growth === undefined ? (
                                        <span className="text-slate-400 text-[11px] font-mono">-</span>
                                      ) : growth < 0 ? (
                                        <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
                                          {growth}%
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                                          +{growth}%
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="relative">
                                      <input
                                        type="text"
                                        defaultValue={
                                          brandViewMode === 'full'
                                            ? (valIdr > 0 ? valIdr.toLocaleString('id-ID') : '-')
                                            : (valBn > 0 ? valBn : '-')
                                        }
                                        onBlur={(e) => handleBrandCellChange(brand.id, year, e.target.value)}
                                        className={`w-full text-right font-mono text-xs rounded-lg px-2 py-1 border outline-none transition-all shadow-inner ${cellInputBg}`}
                                      />
                                      {growth !== undefined && growth !== null && brandViewMode === 'bn' && valBn > 0 && (
                                        <span className={`absolute -top-1.5 -left-1 text-[8px] font-bold px-1 rounded shadow-sm ${
                                          growth < 0
                                            ? 'bg-rose-500/90 text-white'
                                            : 'bg-emerald-600 text-white'
                                        }`}>
                                          {growth > 0 ? `+${growth}%` : `${growth}%`}
                                        </span>
                                      )}
                                    </div>
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

              {/* Division Macro Trajectory Chart */}
              <div className={`rounded-2xl p-5 border transition-all ${cardBg}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className={`text-sm font-bold flex items-center gap-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      <Layers className="w-4 h-4 text-blue-500" />
                      Macro Division Trajectory (Retail vs F&B vs Media)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Aggregated divisional revenue trajectory (2024–2031 in IDR Billion).
                    </p>
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={divisionChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? "#E2E8F0" : "#1E293B"} vertical={false} />
                      <XAxis dataKey="year" stroke={isLightMode ? "#64748B" : "#94A3B8"} fontSize={11} />
                      <YAxis stroke={isLightMode ? "#64748B" : "#94A3B8"} fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isLightMode ? '#FFFFFF' : '#0F172A',
                          borderColor: isLightMode ? '#CBD5E1' : '#334155',
                          borderRadius: 10,
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="Retail" name="Divisi Retail (Bvlgari, Omega, Atmos, Lulu Lemon, Invincible)" fill="#3B82F6" stackId="a" />
                      <Bar dataKey="FnB" name="Divisi Food & Beverages (Haagen-Dazs, Tomita, Jamba Juice)" fill="#F97316" stackId="a" />
                      <Bar dataKey="Media" name="Divisi Media (Publisher & Digital)" fill="#10B981" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SCENARIO MANAGER */}
          {activeTab === 'scenarios' && (
            <div className="space-y-6">
              <div className={`rounded-2xl p-5 border transition-all ${cardBg}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className={`text-sm font-bold flex items-center gap-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      <FolderKanban className="w-4 h-4 text-blue-500" />
                      Saved Scenarios & Decks ({scenariosList.length} Total)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      All presentation decks are stored independently with dedicated URL slugs.
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
                            ? (isLightMode ? 'bg-blue-50/80 border-blue-300 shadow-sm' : 'bg-slate-800/90 border-blue-500/60 shadow-lg')
                            : (isLightMode ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700')
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{sc.title}</h4>
                            {isCurrent && (
                              <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-500 border border-blue-500/30 px-2 py-0.5 rounded">
                                Loaded
                              </span>
                            )}
                            {sc.slug === INITIAL_DATASET.slug && (
                              <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                                Baseline
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-mono">
                            /p/{sc.slug}
                          </p>
                          {sc.updatedAt && (
                            <p className="text-[10px] text-slate-400">
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
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                                isLightMode
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                              }`}
                            >
                              Load into Editor
                            </button>
                          )}
                          <button
                            onClick={() => router.push(`/p/${sc.slug}`)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all active:scale-95"
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
