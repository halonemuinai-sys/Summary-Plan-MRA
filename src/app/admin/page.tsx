'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud, Save, PlusCircle, ExternalLink, Copy, Check,
  RefreshCw, FileSpreadsheet, Lock, Edit3, ArrowRight, ShieldCheck
} from 'lucide-react';
import { ScenarioDataset, FinancialRowData } from '@/lib/types';
import { INITIAL_DATASET } from '@/lib/initial-data';
import { recalculateFinancials } from '@/lib/formula-engine';
import * as XLSX from 'xlsx';

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
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Focus years for business plan (2025 to 2031)
  const displayYears = dataset.years.filter(y => parseInt(y) >= 2024);

  // Load scenarios on mount
  useEffect(() => {
    fetchScenarios();
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
        setTimeout(() => setSaveSuccess(false), 3000);
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
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error updating scenario:', err);
      alert('Failed to update scenario');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus('Processing Excel file...');
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        const targetSheet = 'PL MRA Group+Holding (Combine)';
        if (!wb.SheetNames.includes(targetSheet)) {
          alert(`Sheet "${targetSheet}" not found in uploaded workbook!`);
          setUploadStatus(null);
          return;
        }

        setUploadStatus(`Sheet "${targetSheet}" successfully recognized and updated!`);
      } catch (err) {
        console.error('Error reading excel:', err);
        setUploadStatus('Failed to read Excel workbook.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const presentationUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${activeScenarioSlug}`;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-slate-800 bg-[#111827] flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              MRA P&L Data Studio
              <span className="text-xs bg-blue-900/60 text-blue-300 font-semibold px-2 py-0.5 rounded border border-blue-700/50">
                Altius Rev3 Backend
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Interactive In-Browser Spreadsheet & Dynamic Presentation Link Generator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/p/${activeScenarioSlug}`)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Launch 16:9 Presentation Deck
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">

        {/* Action Panel: Excel Uploader & Scenario Link Generation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* 1. Excel Uploader */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-blue-400" />
                Excel Backend Upload
              </h2>
              <p className="text-xs text-slate-400 mb-3">
                Drop your updated <code className="text-blue-300">Group MRA Summary Plan.xlsx</code> to sync all figures.
              </p>
              <label className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-900/40">
                <FileSpreadsheet className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-slate-300">Click to Browse Excel (.xlsx)</span>
                <span className="text-[10px] text-slate-500">Auto-reads sheet 'PL MRA Group+Holding'</span>
                <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            {uploadStatus && (
              <div className="mt-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 p-2 rounded">
                {uploadStatus}
              </div>
            )}
          </div>

          {/* 2. Active Scenario Settings */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-amber-400" />
                Active Scenario Info
              </h2>
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Scenario Title</label>
                  <input
                    type="text"
                    value={scenarioTitle}
                    onChange={(e) => setScenarioTitle(e.target.value)}
                    className="w-full text-xs rounded bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white font-medium focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Select Loaded Scenario</label>
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
                    className="w-full text-xs rounded bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white font-medium focus:border-blue-500 outline-none"
                  >
                    {scenariosList.map(s => (
                      <option key={s.slug} value={s.slug}>{s.title} ({s.slug})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleUpdateCurrent}
                disabled={isSaving}
                className="flex-1 text-xs font-semibold py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Saving...' : 'Update Current Scenario'}
              </button>
            </div>
          </div>

          {/* 3. Publish as New Scenario (Unique Link) */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                Publish as New Unique Link
              </h2>
              <p className="text-xs text-slate-400 mb-2">
                Modified numbers? Create a separate, permanent presentation URL without overwriting previous decks.
              </p>
              <div>
                <label className="text-[11px] font-semibold text-slate-400">New Slug Identifier (/p/[slug])</label>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1.5 rounded-l border border-r-0 border-slate-700">/p/</span>
                  <input
                    type="text"
                    placeholder="e.g. mra-scenario-optimistic-2027"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    className="w-full text-xs rounded-r bg-slate-900 border border-slate-700 px-2 py-1.5 text-white focus:border-emerald-500 outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <button
                onClick={handleSaveAsNew}
                disabled={isSaving}
                className="w-full text-xs font-semibold py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                {isSaving ? 'Creating...' : 'Publish as New Scenario Link'}
              </button>
              {saveSuccess && (
                <div className="text-[11px] text-emerald-400 text-center font-medium">
                  ✔ Scenario published successfully!
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Live Presentation URL Sharing Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Live Presentation URL:</span>
            <span className="text-xs font-mono text-blue-400 font-semibold bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
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
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'Copied' : 'Copy Link'}
            </button>
            <button
              onClick={() => router.push(`/p/${activeScenarioSlug}`)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white transition-all shadow"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              Open Deck
            </button>
          </div>
        </div>

        {/* Interactive In-Browser Spreadsheet Grid */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                In-Browser Spreadsheet Grid: PL MRA Group+Holding (Combine)
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-semibold border border-emerald-500/30">
                  Editable Cells & Auto-Recalculate Active
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Click on any cell to edit numbers (All values in IDR Billion). GP, OPEX, EBITDA, and NPAT auto-recalculate.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg max-h-[550px]">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#1F2937] text-slate-200 sticky top-0 z-20 shadow">
                <tr>
                  <th className="py-2.5 px-3 font-semibold border-b border-r border-slate-700 w-64 bg-[#1F2937]">
                    Financial Line Item
                  </th>
                  {displayYears.map(y => (
                    <th key={y} className="py-2.5 px-3 font-semibold border-b border-r border-slate-700 text-right min-w-[100px]">
                      {y} {parseInt(y) === 2026 ? '(Proj)' : parseInt(y) >= 2027 ? '(Plan)' : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {Object.entries(dataset.items).map(([key, row]) => {
                  const isFormula = row.isFormula || ['gross_profit', 'gp_margin', 'total_opex', 'operating_profit', 'ebitda_after_holding', 'npat'].includes(key);
                  const isHeaderRow = ['total_revenue', 'gross_profit', 'total_opex', 'operating_profit', 'ebitda_after_holding', 'npat'].includes(key);

                  return (
                    <tr
                      key={key}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        isHeaderRow ? 'bg-slate-900/80 font-bold text-slate-100' : 'text-slate-300'
                      }`}
                    >
                      <td className="py-2 px-3 border-r border-slate-800 flex items-center justify-between">
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
                          <td key={year} className="py-1 px-2 border-r border-slate-800 text-right">
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
                                className="w-full text-right font-mono text-xs rounded px-2 py-1 bg-slate-900 border border-slate-700/60 hover:border-blue-500 focus:border-blue-400 focus:bg-slate-800 text-white outline-none transition-all"
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
