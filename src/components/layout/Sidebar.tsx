'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Table2, Layers, FolderKanban, MonitorPlay,
  ChevronLeft, ChevronRight, DollarSign, Activity,
  TrendingUp, ArrowUpRight, Calendar, Sparkles, Percent
} from 'lucide-react';
import { ScenarioDataset } from '@/lib/types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dataset: ScenarioDataset;
  activeScenarioSlug: string;
  isLightMode?: boolean;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  dataset,
  activeScenarioSlug,
  isLightMode = false,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Dynamic Mini Stats from dataset
  const rev2031 = dataset.items['total_revenue']?.values['2031'] ?? 3408.6;
  const ebitdaMargin2031 =
    dataset.items['total_revenue']?.values['2031'] &&
    dataset.items['ebitda_after_holding']?.values['2031']
      ? (
          (dataset.items['ebitda_after_holding'].values['2031'] /
            dataset.items['total_revenue'].values['2031']) *
          100
        ).toFixed(1)
      : '26.9';

  const navItems = [
    { id: 'grid', label: 'P&L Combine Grid', icon: Table2, badge: 'Live' },
    { id: 'divisions', label: 'Division & Brands', icon: Layers, badge: '15 Brands' },
    { id: 'highlights', label: 'Financial Highlights', icon: Sparkles, badge: 'Deck' },
    { id: 'scenarios', label: 'Scenario Manager', icon: FolderKanban, badge: null },
  ];

  const sidebarBg = isLightMode
    ? 'bg-white border-slate-200/90 shadow-lg text-slate-800'
    : 'bg-[#0D1322] border-slate-800/80 shadow-2xl text-slate-100';

  const borderLine = isLightMode ? 'bg-slate-200' : 'bg-slate-800/60';

  return (
    <aside
      className={`fixed left-0 top-0 h-screen flex flex-col z-50 border-r transition-all duration-300 ease-in-out ${sidebarBg} ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`absolute top-6 -right-3 w-6 h-6 rounded-full border flex items-center justify-center shadow-lg z-50 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer ${
          isLightMode
            ? 'bg-white border-slate-300 hover:border-slate-400 text-slate-600 hover:text-slate-900'
            : 'bg-slate-800 border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white'
        }`}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Brand Header */}
      <div className={`pt-5 pb-5 transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        <div className="flex flex-col gap-2.5">
          {isCollapsed ? (
            <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl border p-1.5 shadow-sm ${isLightMode ? 'border-slate-200 bg-white' : 'border-slate-700 bg-slate-900'}`}>
              <Image src="/mra-clover.png" alt="MRA Group" width={28} height={28} className="object-contain" />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border p-1.5 shadow-sm ${isLightMode ? 'border-slate-200 bg-white' : 'border-slate-700 bg-slate-900'}`}>
                    <Image src="/mra-clover.png" alt="MRA Group" width={26} height={26} className="object-contain" />
                  </div>
                  <div>
                    <h2 className={`text-sm font-extrabold tracking-tight leading-none ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      MRA Group
                    </h2>
                    <span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.13em] text-slate-400">Consolidated Plan</span>
                  </div>
                </div>
                <span className={`inline-block shrink-0 rounded-md border px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] ${isLightMode ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-emerald-700/50 bg-emerald-500/10 text-emerald-300'}`}>
                  Executive
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Mini Stats (No technical IT terms) */}
        {!isCollapsed && (
          <div className="mt-5 space-y-2 transition-all duration-300">
            <div className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 shadow-sm transition-all ${isLightMode ? 'border-slate-200 bg-gradient-to-br from-white to-blue-50/60 hover:border-blue-200' : 'border-slate-700/80 bg-gradient-to-br from-slate-900 to-blue-950/30 hover:border-blue-800'}`}>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isLightMode ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400'}`}>
                <DollarSign size={16} strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="mb-1.5 text-[8px] font-bold uppercase leading-none tracking-[0.14em] text-slate-400">
                  FY2031 Plan Revenue
                </p>
                <p className={`text-[13px] font-extrabold tracking-tight tabular-nums leading-none ${isLightMode ? 'text-slate-900' : 'text-slate-100'}`}>
                  {/* Fixed locale: the server and the browser must format this the same way */}
                  {rev2031.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] font-semibold text-slate-400">IDR Bn</span>
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 shadow-sm transition-all ${isLightMode ? 'border-slate-200 bg-gradient-to-br from-white to-emerald-50/60 hover:border-emerald-200' : 'border-slate-700/80 bg-gradient-to-br from-slate-900 to-emerald-950/20 hover:border-emerald-800'}`}>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isLightMode ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-500/10 text-emerald-400'}`}>
                <Activity size={16} strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="mb-1.5 text-[8px] font-bold uppercase leading-none tracking-[0.14em] text-slate-400">
                  EBITDA Margin
                </p>
                <p className="text-[13px] font-extrabold leading-none tracking-tight text-emerald-600 tabular-nums">
                  {ebitdaMargin2031}%
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 shadow-sm transition-all ${isLightMode ? 'border-slate-200 bg-gradient-to-br from-white to-indigo-50/60 hover:border-indigo-200' : 'border-slate-700/80 bg-gradient-to-br from-slate-900 to-indigo-950/20 hover:border-indigo-800'}`}>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isLightMode ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/10 text-indigo-400'}`}>
                <Calendar size={16} strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="mb-1.5 text-[8px] font-bold uppercase leading-none tracking-[0.14em] text-slate-400">
                  Planning Horizon
                </p>
                <p className={`text-[12px] font-extrabold tracking-tight leading-none ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                  2025 – 2031 (7 Years)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={`h-px mx-4 ${borderLine}`} />

      {/* Navigation Section */}
      <nav className={`flex-1 py-4 space-y-1 overflow-y-auto scrollbar-thin ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {!isCollapsed ? (
          <p className="text-slate-400 text-[9px] font-extrabold uppercase tracking-widest px-3 mb-2.5">
            Planning Modules
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
                  ? isLightMode
                    ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm'
                    : 'bg-slate-800/90 text-blue-400 border border-slate-700/80 shadow-md'
                  : isLightMode
                  ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent hover:translate-x-1'
              }`}
            >
              {/* Active Blue Indicator Strip */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
              )}
              <Icon
                size={16}
                className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? (isLightMode ? 'text-blue-600' : 'text-blue-400') : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              {!isCollapsed && (
                <span className="flex-1 text-left truncate">{label}</span>
              )}
              {!isCollapsed && badge && (
                <span className="px-1.5 py-0.5 text-[8px] font-black bg-blue-500/20 text-blue-500 border border-blue-500/30 rounded-md">
                  {badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Dedicated Presentation Link */}
        <div className="pt-3">
          {!isCollapsed && (
            <p className="text-slate-400 text-[9px] font-extrabold uppercase tracking-widest px-3 mb-2">
              Presentation
            </p>
          )}
          <div className="space-y-1.5">
            <Link
              href={`/deck/${activeScenarioSlug}?slide=highlights`}
              className={`flex items-center rounded-xl text-xs font-bold transition-all relative group overflow-hidden ${
                isCollapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-3'
              } ${
                isLightMode
                  ? 'text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100/70'
                  : 'text-amber-400 bg-amber-950/20 border border-amber-800/40 hover:bg-amber-900/30'
              } shadow-sm`}
            >
              <Sparkles size={16} className="shrink-0 group-hover:scale-110 transition-transform text-amber-500" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left truncate">Highlights Deck</span>
                  <ArrowUpRight size={14} className="opacity-80" />
                </>
              )}
            </Link>
            {!isCollapsed && <p className="px-3 pt-1 text-[10px] font-semibold text-slate-400">Brand Revenue & Division Breakdown</p>}
            {([
              { mode: 'percentage', label: 'By Percentage (%)', icon: Percent },
              { mode: 'value', label: 'By Value (IDR)', icon: DollarSign },
            ] as const).map(({ mode, label, icon: Icon }) => <Link
              key={mode}
              href={`/deck/${activeScenarioSlug}?slide=${mode}`}
              title={`Brand Revenue & Division Breakdown — ${label}`}
              aria-label={`Brand Revenue & Division Breakdown — ${label}`}
              className={`flex items-center rounded-xl text-xs font-bold gap-3 py-3 ${isCollapsed ? 'justify-center px-2' : 'px-3.5'} ${isLightMode ? 'text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100' : 'text-emerald-400 bg-emerald-950/20 border border-emerald-800/40 hover:bg-emerald-900/30'}`}
            >
              <Icon size={16} className="shrink-0" />
              {!isCollapsed && <><span className="flex-1">{label}</span><ArrowUpRight size={14} /></>}
            </Link>)}



          </div>
        </div>
      </nav>

      <div className={`h-px mx-4 ${borderLine}`} />

      {/* User Profile at Bottom */}
      <div className={`p-3 border-t ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#0A0E1A] border-slate-800/60'}`}>
        <div
          className={`flex items-center rounded-xl transition-all group cursor-pointer ${
            isCollapsed ? 'justify-center p-1.5' : 'gap-2.5 px-2.5 py-2'
          }`}
        >
          <div className="relative shrink-0">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-black ${
              isLightMode ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-800 text-white border-slate-700'
            }`}>
              IT
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#0A0E1A] rounded-full shadow-sm shadow-emerald-500/40" />
          </div>

          {!isCollapsed && (
            <div className="flex-1 text-left min-w-0">
              <p className={`text-xs font-bold truncate leading-none mb-1 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                IT Business Partner MRA
              </p>
              <div className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border border-blue-500/20 bg-blue-500/10 text-blue-500 tracking-wider">
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
