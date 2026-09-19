'use client';

import React from 'react';
import Link from 'next/link';
import {
  ExternalLink, Copy, Check, Save, PlusCircle,
  Database, MonitorPlay, Sparkles, FolderKanban
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
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between transition-colors duration-300">
      <div className="flex items-center gap-3">
        <h1 className="text-white font-bold text-sm tracking-tight">{title}</h1>
        <div className="h-4 w-px bg-slate-800" />
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Scenario:</span>
          <select
            value={activeScenarioSlug}
            onChange={(e) => setActiveScenarioSlug(e.target.value)}
            className="text-xs rounded-lg bg-slate-900 border border-slate-700/80 px-2.5 py-1 text-white font-semibold outline-none focus:border-blue-500 transition-colors"
          >
            {scenariosList.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.title} ({s.slug})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Save Button */}
        <button
          onClick={onSaveCurrent}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50"
        >
          <Save size={13} />
          {isSaving ? 'Saving...' : 'Save to PostgreSQL'}
        </button>

        {/* Copy Link Button */}
        <button
          onClick={onCopyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
        >
          {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
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
