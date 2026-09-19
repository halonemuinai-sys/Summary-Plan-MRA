'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  FileSpreadsheet, Layers, Sparkles, MonitorPlay,
  ChevronLeft, ChevronRight, DollarSign, Activity,
  Database, User, ShieldCheck, ChevronUp, Table2,
  FolderKanban, ArrowUpRight
} from 'lucide-react';
import { ScenarioDataset } from '@/lib/types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dataset: ScenarioDataset;
  activeScenarioSlug: string;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  dataset,
  activeScenarioSlug
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Dynamic Mini Stats from dataset
  const rev2031 = dataset.items['total_revenue']?.values['2031'] ?? 3408.6;
  const ebitdaMargin2031 = dataset.items['total_revenue']?.values['2031'] && dataset.items['ebitda_after_holding']?.values['2031']
    ? ((dataset.items['ebitda_after_holding'].values['2031'] / dataset.items['total_revenue'].values['2031']) * 100).toFixed(1)
    : '26.9';

  const navItems = [
    { id: 'grid', label: 'P&L Combine Grid', icon: Table2, badge: 'Live' },
    { id: 'divisions', label: 'Division Breakdown', icon: Layers, badge: null },
    { id: 'scenarios', label: 'Scenario Manager', icon: FolderKanban, badge: null },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#0D1322] flex flex-col z-50 border-r border-slate-800/80 shadow-2xl transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-6 -right-3 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white flex items-center justify-center shadow-lg z-50 hover:bg-slate-700 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Brand Header */}
      <div className={`pt-6 pb-5 transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-5'}`}>
        <div className="flex flex-col gap-2.5 group cursor-pointer">
          {isCollapsed ? (
            <div className="w-10 h-10 flex items-center justify-center mx-auto bg-slate-800/80 rounded-xl border border-slate-700/60 p-1 shadow-md">
              <span className="font-extrabold text-blue-400 text-sm tracking-wider">MRA</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-blue-600/30">
                    M
                  </div>
                  <div>
                    <h2 className="text-white text-sm font-extrabold tracking-tight leading-none">MRA Group</h2>
                    <span className="text-slate-400 text-[10px] font-semibold">Consolidated Plan</span>
                  </div>
                </div>
                <span className="inline-block bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded shadow-sm">
                  Executive
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Mini Stats */}
        {!isCollapsed && (
          <div className="mt-5 space-y-2 transition-all duration-300">
            <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-900/60 border border-slate-800/70 rounded-xl hover:border-slate-700 transition-colors">
              <div className="p-1.5 rounded-lg shrink-0 border border-blue-500/20 bg-blue-500/10 text-blue-400">
                <DollarSign size={13} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider leading-none mb-1">
                  2031 Plan Rev
                </p>
                <p className="text-xs font-black text-slate-200 tracking-wide tabular-nums leading-none">
                  {rev2031.toLocaleString()} IDRbn
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-900/60 border border-slate-800/70 rounded-xl hover:border-slate-700 transition-colors">
              <div className="p-1.5 rounded-lg shrink-0 border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <Activity size={13} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider leading-none mb-1">
                  EBITDA Margin
                </p>
                <p className="text-xs font-black text-emerald-400 tracking-wide tabular-nums leading-none">
                  {ebitdaMargin2031}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-900/60 border border-slate-800/70 rounded-xl hover:border-slate-700 transition-colors">
              <div className="p-1.5 rounded-lg shrink-0 border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                <Database size={13} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider leading-none mb-1">
                  Storage Backend
                </p>
                <p className="text-xs font-bold text-slate-200 tracking-wide leading-none flex items-center gap-1">
                  PostgreSQL <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="h-px bg-slate-800/60 mx-4" />

      {/* Navigation Section */}
      <nav className={`flex-1 py-4 space-y-1 overflow-y-auto scrollbar-thin ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {!isCollapsed ? (
          <p className="text-slate-500 text-[9px] font-extrabold uppercase tracking-widest px-3 mb-2.5">
            Data Management
          </p>
        ) : (
          <div className="h-2" />
        )}

        {navItems.map(({ id, label, icon: Icon, badge }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center rounded-xl text-xs font-bold transition-all relative group overflow-hidden ${
                isCollapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-3'
              } ${
                isActive
                  ? 'bg-slate-800/90 text-blue-400 border border-slate-700/80 shadow-md'
                  : 'text-slate-400 hover:bg-slate-850 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent hover:translate-x-1'
              }`}
            >
              {/* Active Blue Indicator Strip */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
              )}
              <Icon
                size={16}
                className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                }`}
              />
              {!isCollapsed && (
                <span className="flex-1 text-left truncate">{label}</span>
              )}
              {!isCollapsed && badge && (
                <span className="px-1.5 py-0.5 text-[8px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-md">
                  {badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Dedicated Presentation Link */}
        <div className="pt-3">
          {!isCollapsed && (
            <p className="text-slate-500 text-[9px] font-extrabold uppercase tracking-widest px-3 mb-2">
              Presentation
            </p>
          )}
          <Link
            href={`/p/${activeScenarioSlug}`}
            className={`flex items-center rounded-xl text-xs font-bold transition-all relative group overflow-hidden ${
              isCollapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-3'
            } text-emerald-400 bg-emerald-950/20 border border-emerald-800/40 hover:bg-emerald-900/30 hover:border-emerald-700/60 shadow-sm`}
          >
            <MonitorPlay size={16} className="shrink-0 group-hover:scale-110 transition-transform" />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left truncate">16:9 Cockpit Deck</span>
                <ArrowUpRight size={14} className="text-emerald-400/80" />
              </>
            )}
          </Link>
        </div>
      </nav>

      <div className="h-px bg-slate-800/60 mx-4" />

      {/* User Profile at Bottom (Matching Reference UI) */}
      <div className="p-3 bg-[#0A0E1A] border-t border-slate-800/60">
        <div
          className={`flex items-center rounded-xl hover:bg-slate-800/60 border border-transparent hover:border-slate-700/40 transition-all group cursor-pointer ${
            isCollapsed ? 'justify-center p-1.5' : 'gap-2.5 px-2.5 py-2'
          }`}
        >
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-white">
              AS
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0A0E1A] rounded-full shadow-sm shadow-emerald-500/40" />
          </div>

          {!isCollapsed && (
            <div className="flex-1 text-left min-w-0">
              <p className="text-white text-xs font-bold truncate leading-none mb-1 group-hover:text-blue-400 transition-colors">
                Aris Setiyono
              </p>
              <div className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border border-blue-500/20 bg-blue-500/10 text-blue-400 tracking-wider">
                  Corporate Planning
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
