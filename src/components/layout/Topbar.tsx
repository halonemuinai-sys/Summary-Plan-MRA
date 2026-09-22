'use client';

import React from 'react';
import Link from 'next/link';
import {
  Copy, Check, Save, MonitorPlay, Sun, Moon, RotateCcw
} from 'lucide-react';
import { ScenarioDataset } from '@/lib/types';

interface TopbarProps {
  title: string;
  activeScenarioSlug: string;
  setActiveScenarioSlug: (slug: string) => void;
  scenariosList: ScenarioDataset[];
  onSaveCurrent: () => void;
  /** Whether anything on the page is waiting to be saved, so the button can say so */
  hasUnsaved?: boolean;
  isSaving: boolean;
  copiedLink: boolean;
  onCopyLink: () => void;
  isLightMode: boolean;
  onToggleTheme: () => void;
  onRestoreDefault: () => void;
}

export default function Topbar({
  title,
  activeScenarioSlug,
  setActiveScenarioSlug,
  scenariosList,
  onSaveCurrent,
  hasUnsaved = false,
  isSaving,
  copiedLink,
  onCopyLink,
  isLightMode,
  onToggleTheme,
  onRestoreDefault,
}: TopbarProps) {
  const topbarBg = isLightMode
    ? 'bg-white/90 border-slate-200/90 text-slate-900 shadow-sm'
    : 'bg-[#0B0F19]/90 border-slate-800/80 text-white shadow-md';

  const selectBg = isLightMode
    ? 'bg-slate-100 border-slate-300 text-slate-800'
    : 'bg-slate-900 border-slate-700/80 text-white';

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 transition-colors duration-300 ${topbarBg}`}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <h1 className="max-w-[250px] truncate text-sm font-semibold tracking-tight" title={title}>
          {title.includes('P&L Consolidation') ? 'P&L Consolidation' : title}
        </h1>
        <div className={`hidden h-5 w-px sm:block ${isLightMode ? 'bg-slate-200' : 'bg-slate-800'}`} />
        <div className="min-w-0 flex-1 text-xs">
          <select
            aria-label="Active scenario"
            value={activeScenarioSlug}
            onChange={(e) => setActiveScenarioSlug(e.target.value)}
            className={`w-full max-w-[390px] truncate rounded-lg border px-3 py-2 text-xs font-medium outline-none transition-colors focus:border-emerald-500 ${selectBg}`}
          >
            {scenariosList.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Theme Switcher Toggle (Night / Light Mode) */}
        <button
          onClick={onToggleTheme}
          aria-label={isLightMode ? 'Switch to Night Mode' : 'Switch to Light Mode'}
          data-tooltip={isLightMode ? 'Gunakan tampilan gelap' : 'Gunakan tampilan terang'}
          className={`ui-tooltip p-2.5 rounded-lg border transition-all ${
            isLightMode
              ? 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-700'
              : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-amber-400'
          }`}
        >
          {isLightMode ? <Moon size={14} /> : <Sun size={14} />}
        </button>

        <button
          type="button"
          onClick={onRestoreDefault}
          disabled={isSaving}
          aria-label="Restore Default"
          data-tooltip="Kembalikan angka ke baseline awal"
          className={`ui-tooltip flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-xs font-semibold rounded-lg border transition-all active:scale-95 disabled:opacity-50 ${
            isLightMode
              ? 'bg-white border-amber-300 hover:bg-amber-50 text-amber-700'
              : 'bg-amber-950/20 border-amber-700/60 hover:bg-amber-900/30 text-amber-300'
          }`}
        >
          <RotateCcw size={13} />
          Reset
        </button>

        {/* Quick Save Button: saves every tab that has something waiting */}
        <button
          onClick={onSaveCurrent}
          disabled={isSaving || !hasUnsaved}
          aria-label={hasUnsaved ? 'Save unsaved changes' : 'Everything is saved'}
          data-tooltip={hasUnsaved ? 'Simpan semua perubahan yang belum tersimpan' : 'Semua sudah tersimpan'}
          className="ui-tooltip relative flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-blue-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-50"
        >
          <Save size={13} />
          {isSaving ? 'Saving…' : hasUnsaved ? 'Save' : 'Saved'}
          {hasUnsaved && !isSaving && (
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-white dark:ring-slate-900" />
          )}
        </button>

        {/* Copy Link Button */}
        <button
          onClick={onCopyLink}
          aria-label={copiedLink ? 'Presentation link copied' : 'Copy presentation link'}
          data-tooltip={copiedLink ? 'Link berhasil disalin' : 'Salin link presentasi'}
          className={`ui-tooltip flex h-9 w-9 items-center justify-center rounded-lg border transition-all active:scale-95 ${
            isLightMode
              ? 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-700'
              : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
          }`}
        >
          {copiedLink ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>

        {/* Launch Presentation Button */}
        <Link
          href={`/deck/${activeScenarioSlug}?slide=highlights`}
          aria-label="Open executive presentation"
          data-tooltip="Buka presentasi skenario aktif"
          className="ui-tooltip flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:scale-95"
        >
          <MonitorPlay size={13} />
          Present
        </Link>
      </div>
    </header>
  );
}
