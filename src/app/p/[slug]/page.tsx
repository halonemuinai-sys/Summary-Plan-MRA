'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CockpitCharts from '@/components/CockpitCharts';
import {
  Maximize2, Minimize2, ArrowLeft, Share2,
  Check, RefreshCw, Sun, Moon, TrendingUp, DollarSign, Layers, Compass,
  Building2, X, ExternalLink
} from 'lucide-react';
import { ScenarioDataset, BrandRowData } from '@/lib/types';
import { INITIAL_DATASET, INITIAL_BRAND_BREAKDOWN } from '@/lib/initial-data';

export default function PresentationPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || 'mra-altius-base-2025-2031';

  const [dataset, setDataset] = useState<ScenarioDataset>(INITIAL_DATASET);
  const [loading, setLoading] = useState(true);
  const [zoomedQuadrant, setZoomedQuadrant] = useState<number | null>(null);
  const [unitMode, setUnitMode] = useState<'idrbn' | 'pct'>('idrbn');
  const [isCopied, setIsCopied] = useState(false);
  const [blackout, setBlackout] = useState(false);
  const [isLightMode, setIsLightMode] = useState(true);

  useEffect(() => {
    async function loadScenario() {
      try {
        setLoading(true);
        const res = await fetch(`/api/scenarios/${slug}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setDataset(json.data);
          }
        }
      } catch (err) {
        console.error('Error fetching scenario, using default:', err);
      } finally {
        setLoading(false);
      }
    }
    loadScenario();
  }, [slug]);

  // Keyboard navigation & presentation hotkeys
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.closest('input, select, textarea, [contenteditable="true"]')) return;
      if (e.key === 'Escape') {
        if (zoomedQuadrant !== null) setZoomedQuadrant(null);
        if (blackout) setBlackout(false);
        setShowBrandModal(false);
      } else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      } else if (e.key === 'b' || e.key === 'B') {
        setBlackout(prev => !prev);
      } else if (e.key === 't' || e.key === 'T') {
        setIsLightMode(prev => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomedQuadrant, blackout]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brandViewMode, setBrandViewMode] = useState<'bn' | 'full' | 'growth'>('bn');

  const brandsList: BrandRowData[] =
    dataset.brandBreakdown && dataset.brandBreakdown.length > 0
      ? dataset.brandBreakdown
      : INITIAL_BRAND_BREAKDOWN;

  const brandYears = ['2026', '2027', '2028', '2029', '2030', '2031'];

  const brandChartData = brandYears.map((yr) => {
    const pt: Record<string, any> = { year: yr };
    const bulgari = brandsList.find((b) => b.name === 'Bulgari')?.valuesBn[yr] || 0;
    const haagen = brandsList.find((b) => b.name === 'Haagendazs')?.valuesBn[yr] || 0;
    const lululemon = brandsList.find((b) => b.name === 'Lulu Lemon')?.valuesBn[yr] || 0;
    const invincible = brandsList.find((b) => b.name === 'Invicible')?.valuesBn[yr] || 0;
    const omega = brandsList.find((b) => b.name === 'Omega')?.valuesBn[yr] || 0;
    const media = brandsList.find((b) => b.name === 'MRA Media - Publisher')?.valuesBn[yr] || 0;
    const total = brandsList.find((b) => b.category === 'total')?.valuesBn[yr] || 0;
    const others = Math.max(0, total - (bulgari + haagen + lululemon + invincible + omega + media));

    pt['Bulgari'] = bulgari;
    pt['Haagendazs'] = haagen;
    pt['Lulu Lemon'] = lululemon;
    pt['Invincible'] = invincible;
    pt['Omega'] = omega;
    pt['Media'] = media;
    pt['Others'] = Number(others.toFixed(1));
    pt['Total'] = total;
    return pt;
  });

  const bgClass = isLightMode ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#070B14] text-slate-100';
  const cardClass = isLightMode 
    ? 'bg-white border-slate-200/90 shadow-md ring-1 ring-black/5' 
    : 'bg-[#101726]/90 border-slate-800/80 shadow-2xl backdrop-blur-md ring-1 ring-white/5';

  if (blackout) {
    return (
      <div 
        onClick={() => setBlackout(false)}
        className="fixed inset-0 bg-black z-50 flex items-center justify-center cursor-pointer select-none"
      >
        <span className="text-slate-700 text-sm font-mono tracking-wider animate-pulse">
          Presentation Paused — Press 'B' or click anywhere to resume
        </span>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} flex flex-col transition-colors duration-300 select-none overflow-x-hidden`}>
      {/* Top Glassmorphic Navigation Bar */}
      <header className={`cockpit-toolbar px-6 py-3 border-b flex flex-wrap gap-3 items-center justify-between ${
        isLightMode ? 'border-slate-200 bg-white/90' : 'border-slate-800/80 bg-[#0B0F19]/90'
      } backdrop-blur-md sticky top-0 z-40`}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              isLightMode 
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' 
                : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200 shadow'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Admin Studio
          </button>
          <a href={`/p/${slug}/revenue`} className="text-xs font-semibold text-emerald-600 hover:underline">
            Revenue Breakdown
          </a>
          <div className="h-4 w-px bg-slate-700/60" />
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20 shadow-sm flex items-center gap-1">
              <Compass className="w-3 h-3" />
              MRA Cockpit
            </span>
            <span className={`text-sm font-bold tracking-tight truncate max-w-md ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              {dataset.title}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Unit Toggle */}
          <div className={`flex rounded-lg border p-0.5 ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-700'}`}>
            <button
              onClick={() => setUnitMode('idrbn')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                unitMode === 'idrbn' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow' 
                  : isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              IDR Billion
            </button>
            <button
              onClick={() => setUnitMode('pct')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                unitMode === 'pct' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow' 
                  : isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              % of Sales
            </button>
          </div>

          {/* Theme Switcher */}
          <button
            onClick={() => setIsLightMode(!isLightMode)}
            title="Toggle Light / Dark Mode (T)"
            className={`p-2 rounded-lg border transition-all ${
              isLightMode ? 'bg-slate-100 border-slate-300 hover:bg-slate-200' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isLightMode ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Share Link Button */}
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-md active:scale-95 ${
              isCopied 
                ? 'bg-emerald-600 text-white border-emerald-500' 
                : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500/80 shadow-blue-600/30'
            }`}
          >
            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            {isCopied ? 'Link Copied!' : 'Share Deck'}
          </button>
        </div>
      </header>

      <CockpitCharts dataset={dataset} isLightMode={isLightMode} percentage={unitMode === 'pct'} zoom={zoomedQuadrant} setZoom={setZoomedQuadrant} onOpenBrands={() => setShowBrandModal(true)} brandData={brandChartData} />

      {/* Presentation Footer Bar */}
      <footer className={`cockpit-footer px-6 py-2.5 border-t flex items-center justify-between text-xs ${
        isLightMode ? 'border-slate-200 bg-white text-slate-500' : 'border-slate-800/80 bg-[#0B0F19] text-slate-400'
      }`}>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-400">Hotkeys:</span>
          <span className="font-mono bg-slate-800/90 px-2 py-0.5 rounded text-[11px] text-slate-300 border border-slate-700/60">F: Fullscreen</span>
          <span className="font-mono bg-slate-800/90 px-2 py-0.5 rounded text-[11px] text-slate-300 border border-slate-700/60">T: Theme</span>
          <span className="font-mono bg-slate-800/90 px-2 py-0.5 rounded text-[11px] text-slate-300 border border-slate-700/60">B: Blackout</span>
          <span className="font-mono bg-slate-800/90 px-2 py-0.5 rounded text-[11px] text-slate-300 border border-slate-700/60">Esc: Restore Zoom</span>
        </div>
        <div className="text-slate-500 font-medium">
          MRA Corporate Planning & Finance &copy; 2026. Confidential Presentation.
        </div>
      </footer>

      {/* 15 Brands Breakdown Modal */}
      {showBrandModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-5xl max-h-[85vh] rounded-2xl border p-6 flex flex-col shadow-2xl ${cardClass} overflow-hidden`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-4">
              <div>
                <h3 className={`text-base font-bold flex items-center gap-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  <Building2 className="w-5 h-5 text-blue-500" />
                  MRA Group Brand Revenue Matrix (2026–2031)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Extracted directly from sheet: PL MRA Group+Holding (Combine) Rows 97–117
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className={`flex rounded-lg border p-0.5 ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-700'}`}>
                  <button
                    onClick={() => setBrandViewMode('bn')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${brandViewMode === 'bn' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                  >
                    IDR Billion
                  </button>
                  <button
                    onClick={() => setBrandViewMode('full')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${brandViewMode === 'full' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                  >
                    Full Rupiah
                  </button>
                  <button
                    onClick={() => setBrandViewMode('growth')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${brandViewMode === 'growth' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                  >
                    % YoY Growth
                  </button>
                </div>

                <button
                  onClick={() => setShowBrandModal(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-xl border border-slate-700/60">
              <table className="w-full text-xs text-left border-collapse">
                <thead className={`sticky top-0 z-20 ${isLightMode ? 'bg-slate-100 text-slate-800' : 'bg-[#162032] text-slate-200'}`}>
                  <tr>
                    <th className="py-2.5 px-4 font-semibold border-b border-r w-64">Brand / Business Unit</th>
                    {brandYears.map((yr) => (
                      <th key={yr} className="py-2.5 px-3 font-semibold border-b border-r text-right min-w-[110px]">
                        {yr}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLightMode ? 'divide-slate-200' : 'divide-slate-800/80'}`}>
                  {brandsList.map((brand) => {
                    const isSectionHeader = ['header_fnb', 'header_retail'].includes(brand.category);
                    const isTotal = brand.category === 'total';

                    if (isSectionHeader) {
                      return (
                        <tr key={brand.id} className={isLightMode ? 'bg-slate-200/80' : 'bg-slate-800/80'}>
                          <td colSpan={brandYears.length + 1} className="py-2 px-4 font-bold text-xs uppercase tracking-wider">
                            {brand.name}
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr
                        key={brand.id}
                        className={isTotal ? (isLightMode ? 'bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300' : 'bg-[#141E2E] font-bold text-slate-100 border-t-2 border-slate-700') : (isLightMode ? 'hover:bg-slate-50 text-slate-700' : 'hover:bg-slate-800/40 text-slate-300')}
                      >
                        <td className="py-2 px-4 border-r font-medium flex items-center justify-between">
                          <span className={['fnb_new', 'retail_new'].includes(brand.category) ? 'pl-4' : isTotal ? 'font-black' : ''}>
                            {brand.name}
                          </span>
                        </td>
                        {brandYears.map((yr) => {
                          const valBn = brand.valuesBn[yr] ?? 0;
                          const valIdr = brand.valuesIdr[yr] ?? 0;
                          const growth = brand.growthPct?.[yr];
                          return (
                            <td key={yr} className="py-1.5 px-3 border-r text-right font-mono">
                              {brandViewMode === 'growth' ? (
                                growth === null || growth === undefined ? (
                                  <span className="text-slate-500">-</span>
                                ) : growth < 0 ? (
                                  <span className="text-rose-500 font-bold">{growth}%</span>
                                ) : (
                                  <span className="text-emerald-500 font-bold">+{growth}%</span>
                                )
                              ) : brandViewMode === 'full' ? (
                                valIdr > 0 ? valIdr.toLocaleString('id-ID') : '-'
                              ) : (
                                <span>
                                  {valBn > 0 ? valBn.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 }) : '-'}
                                  {growth !== undefined && growth !== null && valBn > 0 && (
                                    <span className="text-[9px] text-emerald-500 ml-1">
                                      (+{growth}%)
                                    </span>
                                  )}
                                </span>
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
    </div>
  );
}
