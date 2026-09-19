'use client';

import React from 'react';
import Link from 'next/link';
import {
  Copy, Check, Save, MonitorPlay, Sun, Moon
} from 'lucide-react';
import { ScenarioDataset } from '@/lib/types';

interface TopbarProps {
  title: string;
  activeScenarioSlug: string;
  setActiveScenarioSlug: (slug: string) => void;
  scenariosList: ScenarioDataset[];
  onSaveCurrent: () => void;
  isSaving: boolean;
  copiedLink: boolean;
  onCopyLink: () => void;
  isLightMode: boolean;
  onToggleTheme: () => void;
}

export default function Topbar({
  title,
  activeScenarioSlug,
  setActiveScenarioSlug,
  scenariosList,
  onSaveCurrent,
  isSaving,
  copiedLink,
  onCopyLink,
  isLightMode,
  onToggleTheme,
}: TopbarProps) {
  const topbarBg = isLightMode
    ? 'bg-white/90 border-slate-200/90 text-slate-900 shadow-sm'
    : 'bg-[#0B0F19]/90 border-slate-800/80 text-white shadow-md';

  const selectBg = isLightMode
    ? 'bg-slate-100 border-slate-300 text-slate-800'
    : 'bg-slate-900 border-slate-700/80 text-white';

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-6 py-3.5 flex items-center justify-between transition-colors duration-300 ${topbarBg}`}>
      <div className="flex items-center gap-3">
        <h1 className="font-bold text-sm tracking-tight">{title}</h1>
        <div className={`h-4 w-px ${isLightMode ? 'bg-slate-300' : 'bg-slate-800'}`} />
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Active Deck:</span>
          <select
            value={activeScenarioSlug}
            onChange={(e) => setActiveScenarioSlug(e.target.value)}
            className={`text-xs rounded-lg border px-2.5 py-1 font-semibold outline-none focus:border-blue-500 transition-colors ${selectBg}`}
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
      <div className="flex items-center gap-2.5">
        {/* Theme Switcher Toggle (Night / Light Mode) */}
        <button
          onClick={onToggleTheme}
          title={isLightMode ? 'Switch to Night Mode' : 'Switch to Light Mode'}
          className={`p-2 rounded-lg border transition-all ${
            isLightMode
              ? 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-700'
              : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-amber-400'
          }`}
        >
          {isLightMode ? <Moon size={14} /> : <Sun size={14} />}
        </button>

        {/* Quick Save Button */}
        <button
          onClick={onSaveCurrent}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50"
        >
          <Save size={13} />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>

        {/* Copy Link Button */}
        <button
          onClick={onCopyLink}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all active:scale-95 ${
            isLightMode
              ? 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-700'
              : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
          }`}
        >
          {copiedLink ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          {copiedLink ? 'Copied' : 'Copy Deck Link'}
        </button>

        {/* Launch Presentation Button */}
        <Link
          href={`/p/${activeScenarioSlug}`}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 transition-all active:scale-95"
        >
          <MonitorPlay size={13} />
          Launch 16:9 Deck
        </Link>
      </div>
    </header>
  );
}
