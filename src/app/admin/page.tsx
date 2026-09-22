'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save, PlusCircle, ExternalLink, Copy, Check,
  Edit3, Sparkles,
  Table2, Layers, FolderKanban, TrendingUp, CheckCircle,
  Percent, Coins, Building2, ArrowUpRight, AlertTriangle, RotateCcw, X
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from 'recharts';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import HighlightsStudio from '@/components/admin/HighlightsStudio';
import { ScenarioDataset, BrandRowData } from '@/lib/types';
import { INITIAL_DATASET, INITIAL_BRAND_BREAKDOWN } from '@/lib/initial-data';
import { applyInputEdits, CellEdit } from '@/lib/formula-engine';
import { applyBrandEdits, BrandEdit, BRAND_YEARS } from '@/lib/brand-engine';
import { useGridEditor } from '@/lib/use-grid-editor';
import GridHelp from '@/components/admin/GridHelp';
import { EditHistoryButtons, UnsavedBadge } from '@/components/admin/EditToolbar';
import PnlGrid from '@/components/admin/PnlGrid';
import BrandMatrixGrid from '@/components/admin/BrandMatrixGrid';
import SaveNotification from '@/components/admin/SaveNotification';

const GridPlaceholder = () => (
  <div className="h-64 flex items-center justify-center text-xs text-slate-400">Loading spreadsheet...</div>
);

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'divisions' | 'scenarios'
  const [dataset, setDataset] = useState<ScenarioDataset>(INITIAL_DATASET);
  const [activeScenarioSlug, setActiveScenarioSlug] = useState(INITIAL_DATASET.slug);
  const [scenarioTitle, setScenarioTitle] = useState(INITIAL_DATASET.title);
  const [newSlug, setNewSlug] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!saveSuccess) return;
    const timer = setTimeout(() => setSaveSuccess(false), 3500);
    return () => clearTimeout(timer);
  }, [saveSuccess]);

  const [copiedLink, setCopiedLink] = useState(false);
  const [scenariosList, setScenariosList] = useState<ScenarioDataset[]>([INITIAL_DATASET]);
  const [isDirty, setIsDirty] = useState(false);
  // The Highlights studio keeps its own figures, so it reports whether it has anything unsaved and
  // hands over its save. That way one Save button can keep every tab up to date.
  const [highlightsDirty, setHighlightsDirty] = useState(false);
  const saveHighlightsRef = useRef<(() => Promise<boolean>) | null>(null);
  // The grids measure themselves against the browser window, so they are rendered once the page is up
  const [hasMounted, setHasMounted] = useState(false);
  const [origin, setOrigin] = useState('');
  const [isLightMode, setIsLightMode] = useState(true);
  const [brandViewMode, setBrandViewMode] = useState<'bn' | 'full' | 'growth'>('bn');
  const [showRestoreDefault, setShowRestoreDefault] = useState(false);
  const [restoreConfirmation, setRestoreConfirmation] = useState('');

  const currentBrands: BrandRowData[] =
    dataset.brandBreakdown && dataset.brandBreakdown.length > 0
      ? dataset.brandBreakdown
      : INITIAL_BRAND_BREAKDOWN;

  // Each grid keeps its own undo history and highlights the rows an edit changed
  const pnlEditor = useGridEditor<ScenarioDataset['items'], CellEdit>({
    snapshot: dataset.items,
    apply: applyInputEdits,
    changedKeys: (before, after) => Object.keys(after).filter((key) => after[key] !== before[key]),
    onCommit: (items) => {
      setDataset((prev) => ({ ...prev, items }));
      setIsDirty(true);
    },
  });
  const brandEditor = useGridEditor<BrandRowData[], BrandEdit>({
    snapshot: currentBrands,
    apply: (brands, edits) => applyBrandEdits(brands, edits),
    // Only rows whose figures changed (the edited brand and the total), not rows that just got new growth figures
    changedKeys: (before, after) =>
      after.filter((row, index) => row.valuesIdr !== before[index].valuesIdr).map((row) => row.id),
    onCommit: (brandBreakdown) => {
      setDataset((prev) => ({ ...prev, brandBreakdown }));
      setIsDirty(true);
    },
  });

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

  // Focus years for business plan (2024 to 2031)
  const displayYears = dataset.years.filter((y) => parseInt(y) >= 2024);

  // Load scenarios on mount & set origin safely
  useEffect(() => {
    fetchScenarios();
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
    setHasMounted(true);
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
            pnlEditor.clearHistory();
            brandEditor.clearHistory();
            setIsDirty(false);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching scenarios:', err);
    }
  };

  // Load a saved scenario into the editor: start with a clean undo history and nothing unsaved
  const loadIntoEditor = (scenario: ScenarioDataset) => {
    setActiveScenarioSlug(scenario.slug);
    setDataset(scenario);
    setScenarioTitle(scenario.title);
    pnlEditor.clearHistory();
    brandEditor.clearHistory();
    setIsDirty(false);
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

    setSaveSuccess(false);
    setIsSaving(true);
    try {
      const res = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDataset),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setIsDirty(false);
        setActiveScenarioSlug(cleanSlug);
        setNewSlug('');
        fetchScenarios();
      }
    } catch (err) {
      console.error('Error saving scenario:', err);
      alert('Failed to save scenario');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCurrent = async () => {
    setSaveSuccess(false);
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
        setIsDirty(false);
        fetchScenarios();
      }
    } catch (err) {
      console.error('Error updating scenario:', err);
      alert('Failed to update scenario');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * The Save button in the top bar saves everything that is waiting: the scenario behind the P&L and
   * brand grids, and the Highlights studio. Two Save buttons that each covered half of the screen left
   * people pressing the nearer one and losing the other half.
   */
  const handleSaveEverything = async () => {
    if (isDirty) await handleUpdateCurrent();
    if (highlightsDirty) await saveHighlightsRef.current?.();
  };

  const handleCopyLink = () => {
    const path = activeTab === 'grid'
      ? `/p/${activeScenarioSlug}`
      : `/deck/${activeScenarioSlug}?slide=highlights`;
    const fullUrl = `${origin}${path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const openRestoreDefault = () => {
    setRestoreConfirmation('');
    setShowRestoreDefault(true);
  };

  const closeRestoreDefault = () => {
    setRestoreConfirmation('');
    setShowRestoreDefault(false);
  };

  const handleRestoreDefault = () => {
    if (restoreConfirmation.trim().toUpperCase() !== 'DEFAULT') return;

    // Keep the active scenario identity. Only its planning figures return to the original baseline.
    setDataset((current) => ({
      ...current,
      years: [...INITIAL_DATASET.years],
      items: structuredClone(INITIAL_DATASET.items),
      brandBreakdown: structuredClone(INITIAL_BRAND_BREAKDOWN),
    }));
    pnlEditor.clearHistory();
    brandEditor.clearHistory();
    setIsDirty(true);
    closeRestoreDefault();
  };

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
      <SaveNotification visible={saveSuccess} isLightMode={isLightMode} message="Your scenario is ready to present." />
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
              : activeTab === 'highlights'
              ? 'Financial Highlights Studio & Deck Editor'
              : 'Scenario Management'
          }
          activeScenarioSlug={activeScenarioSlug}
          setActiveScenarioSlug={(slug) => {
            const sel = scenariosList.find((s) => s.slug === slug);
            if (sel) loadIntoEditor(sel);
          }}
          scenariosList={scenariosList}
          onSaveCurrent={handleSaveEverything}
          hasUnsaved={isDirty || highlightsDirty}
          isSaving={isSaving}
          copiedLink={copiedLink}
          onCopyLink={handleCopyLink}
          isLightMode={isLightMode}
          onToggleTheme={() => setIsLightMode(!isLightMode)}
          onRestoreDefault={openRestoreDefault}
        />

        {/* Dynamic Tab Body */}
        <div className="p-5 max-w-[1700px] mx-auto w-full space-y-5">

          {/* TAB 1: P&L CONSOLIDATION GRID */}
          {activeTab === 'grid' && (
            <div className="space-y-4">
              {/* In-Browser Interactive Spreadsheet Grid */}
              <div className={`rounded-2xl p-5 border transition-all ${cardBg}`}>
                <div className="flex flex-wrap items-start justify-between gap-5 mb-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 mb-2">Financial planning workspace</p>
                    <div className="flex items-center gap-2"><h3 className={`text-xl font-bold tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      P&L Group + Holding
                    </h3>
                    <GridHelp variant="pnl" isLightMode={isLightMode} />
                    </div>
                    <p className={`text-xs mt-1.5 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>PL MRA Group+Holding (Combine) · IDR Billion</p>
                    <div className="flex items-center gap-2 mt-3"><span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold ${isLightMode ? 'text-emerald-700' : 'text-emerald-400'}`}><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Auto calculation on</span>
                    {isDirty && <UnsavedBadge isLightMode={isLightMode} />}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <EditHistoryButtons
                      canUndo={pnlEditor.canUndo}
                      canRedo={pnlEditor.canRedo}
                      onUndo={pnlEditor.onUndo}
                      onRedo={pnlEditor.onRedo}
                      isLightMode={isLightMode}
                    />
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
                      onClick={handleUpdateCurrent}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <Save size={13} />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => router.push(`/p/${activeScenarioSlug}`)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      <ExternalLink size={13} />
                      View P&L Deck
                    </button>
                  </div>
                </div>

                {!hasMounted ? <GridPlaceholder /> : (
                <PnlGrid
                  items={dataset.items}
                  years={displayYears}
                  isLightMode={isLightMode}
                  flashKeys={pnlEditor.flashKeys}
                  onEdits={pnlEditor.onEdits}
                  onUndo={pnlEditor.onUndo}
                  onRedo={pnlEditor.onRedo}
                />
                )}
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

              {/* Brand Revenue Matrix Spreadsheet */}
              <div className={`rounded-2xl p-5 border transition-all ${cardBg}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`text-sm font-bold flex items-center gap-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      <Building2 className="w-4 h-4 text-blue-500" />
                      Brand Revenue Matrix (2026–2031)
                    </h3>
                    <GridHelp variant="brand" isLightMode={isLightMode} />
                    <span className="text-[10px] bg-blue-500/10 text-blue-500 font-semibold px-2 py-0.5 rounded border border-blue-500/20">
                      PL Combine: Rows 97–117
                    </span>
                    {isDirty && <UnsavedBadge isLightMode={isLightMode} />}
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400 hidden md:inline">Display Mode:</span>
                    <div className={`flex rounded-lg border p-0.5 ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-700'}`}>
                      {(
                        [
                          ['bn', 'IDR Billion'],
                          ['full', 'Full Rupiah'],
                          ['growth', '% YoY Growth'],
                        ] as const
                      ).map(([mode, label]) => (
                        <button
                          key={mode}
                          onClick={() => setBrandViewMode(mode)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                            brandViewMode === mode
                              ? 'bg-blue-600 text-white shadow'
                              : isLightMode
                              ? 'text-slate-500 hover:text-slate-800'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <EditHistoryButtons
                      canUndo={brandEditor.canUndo}
                      canRedo={brandEditor.canRedo}
                      onUndo={brandEditor.onUndo}
                      onRedo={brandEditor.onRedo}
                      isLightMode={isLightMode}
                    />

                    <button
                      onClick={handleUpdateCurrent}
                      disabled={isSaving}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Save size={12} />
                      {isSaving ? 'Saving...' : 'Save Matrix'}
                    </button>
                  </div>
                </div>

                {!hasMounted ? <GridPlaceholder /> : (
                <BrandMatrixGrid
                  brands={currentBrands}
                  years={BRAND_YEARS}
                  mode={brandViewMode}
                  isLightMode={isLightMode}
                  flashKeys={brandEditor.flashKeys}
                  onEdits={brandEditor.onEdits}
                  onUndo={brandEditor.onUndo}
                  onRedo={brandEditor.onRedo}
                />
                )}
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
                  </div>
                </div>
              </div>

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
                              onClick={() => loadIntoEditor(sc)}
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
                            onClick={() => router.push(`/deck/${sc.slug}?slide=highlights`)}
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

          {/* TAB 4: FINANCIAL HIGHLIGHTS STUDIO */}
          {/* Kept mounted: unmounting it on a tab change threw away any figure typed here */}
          <div className={activeTab === 'highlights' ? undefined : 'hidden'}>
            <HighlightsStudio
              isLightMode={isLightMode}
              onDirtyChange={setHighlightsDirty}
              saveRef={saveHighlightsRef}
            />
          </div>

        </div>

        {showRestoreDefault && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeRestoreDefault(); }}>
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="restore-default-title"
              className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
                isLightMode ? 'border-slate-200 bg-white text-slate-900' : 'border-slate-700 bg-[#101827] text-white'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isLightMode ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/15 text-amber-300'}`}>
                  <AlertTriangle size={21} />
                </div>
                <button type="button" onClick={closeRestoreDefault} aria-label="Close restore warning" className={`rounded-lg p-1.5 ${isLightMode ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800'}`}><X size={17} /></button>
              </div>

              <h2 id="restore-default-title" className="mt-4 text-lg font-bold">Restore original default data?</h2>
              <p className={`mt-2 text-sm leading-6 ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                This replaces all P&amp;L figures and the Brand Revenue Matrix in <strong>{scenarioTitle}</strong> with the original baseline.
              </p>
              <div className={`mt-4 rounded-xl border p-3 text-xs leading-5 ${isLightMode ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-amber-700/50 bg-amber-950/25 text-amber-200'}`}>
                Unsaved edits will be discarded. The database is not changed until you click <strong>Save Changes</strong>, so you can review the restored figures first.
              </div>

              <label htmlFor="restore-default-confirmation" className="mt-5 block text-xs font-semibold">
                Type <span className="font-mono text-amber-600">DEFAULT</span> to confirm
              </label>
              <input
                id="restore-default-confirmation"
                autoFocus
                autoComplete="off"
                value={restoreConfirmation}
                onChange={(event) => setRestoreConfirmation(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Escape') closeRestoreDefault(); if (event.key === 'Enter' && restoreConfirmation.trim().toUpperCase() === 'DEFAULT') handleRestoreDefault(); }}
                placeholder="DEFAULT"
                className={`mt-2 w-full rounded-xl border px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-amber-500/30 ${
                  isLightMode ? 'border-slate-300 bg-white focus:border-amber-500' : 'border-slate-600 bg-slate-900 focus:border-amber-400'
                }`}
              />

              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={closeRestoreDefault} className={`rounded-lg border px-4 py-2 text-xs font-semibold ${isLightMode ? 'border-slate-300 hover:bg-slate-50' : 'border-slate-600 hover:bg-slate-800'}`}>Cancel</button>
                <button
                  type="button"
                  onClick={handleRestoreDefault}
                  disabled={restoreConfirmation.trim().toUpperCase() !== 'DEFAULT'}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <RotateCcw size={13} /> Restore Default Data
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
