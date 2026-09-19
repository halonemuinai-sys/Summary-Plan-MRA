import Link from 'next/link';
import { getAllScenarios } from '@/lib/data-service';
import { INITIAL_DATASET } from '@/lib/initial-data';
import { MonitorPlay, Settings, ArrowRight, BarChart3, ExternalLink } from 'lucide-react';

export default function HomePage() {
  const scenarios = getAllScenarios();

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-between">
      <header className="px-8 py-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-600/30">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">MRA Group P&L Presentation Engine</h1>
            <p className="text-xs text-slate-400">Business Plan 2025 - 2031 | Altius Rev3 Executive Cockpit</p>
          </div>
        </div>

        <Link
          href="/admin"
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shadow"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          Admin Data Studio
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 w-full space-y-8">
        <div className="text-center space-y-3">
          <span className="text-xs uppercase font-bold tracking-widest text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            Corporate Planning & Finance Deck
          </span>
          <h2 className="text-3xl font-extrabold text-white">
            Interactive P&L Presentation Platform
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Dynamic executive presentation engine powered by Next.js and live Excel backend. 
            Select an active scenario below or enter Admin Studio to modify figures.
          </p>
        </div>

        {/* Available Scenarios List */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Available Presentation Decks
          </h3>

          <div className="grid gap-3">
            {scenarios.map((scenario) => (
              <div
                key={scenario.slug}
                className="bg-[#111827] border border-slate-800 hover:border-blue-500/60 rounded-xl p-5 flex items-center justify-between transition-all group shadow-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                      {scenario.title}
                    </h4>
                    {scenario.slug === INITIAL_DATASET.slug && (
                      <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                        Master Baseline
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    URL: /p/{scenario.slug}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/p/${scenario.slug}`}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 transition-all"
                  >
                    <MonitorPlay className="w-4 h-4" />
                    Launch Deck
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Guide */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 text-xs text-slate-400 space-y-2">
          <div className="font-bold text-slate-200 uppercase text-[11px] tracking-wider">
            💡 How it works:
          </div>
          <p>
            1. Open <strong>Admin Data Studio</strong> to edit numbers in the in-browser spreadsheet grid or upload an updated Excel file.
          </p>
          <p>
            2. Publish your revisions under a <strong>New Scenario Link</strong> (e.g. <code>/p/mra-scenario-optimistic</code>). Each scenario generates a permanent unique URL.
          </p>
          <p>
            3. In presentation mode, use <strong>1-Click Zoom</strong> on any quadrant, press <strong>F</strong> for Fullscreen, and <strong>B</strong> to pause/blackout the screen.
          </p>
        </div>
      </main>

      <footer className="px-8 py-4 border-t border-slate-800/80 text-center text-xs text-slate-500">
        MRA Group Corporate Planning & Finance &copy; 2026. Altius Rev3 P&L Consolidation Engine.
      </footer>
    </div>
  );
}
