import Link from 'next/link';
import { getAllScenarios } from '@/lib/data-service';
import { INITIAL_DATASET } from '@/lib/initial-data';
import { MonitorPlay, Settings, ArrowRight, BarChart3, Database, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const scenarios = await getAllScenarios();

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <header className="px-8 py-5 border-b border-slate-800/80 bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">MRA Group P&L Presentation Engine</h1>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                <Database className="w-3 h-3" />
                PostgreSQL Connected
              </span>
            </div>
            <p className="text-xs text-slate-400">Business Plan 2025 - 2031 | Altius Rev3 Executive Cockpit</p>
          </div>
        </div>

        <Link
          href="/admin"
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 hover:border-slate-600 transition-all shadow-md"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          Admin Data Studio
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 w-full space-y-8">
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 text-xs uppercase font-bold tracking-widest text-blue-400 bg-blue-500/10 px-3.5 py-1.5 rounded-full border border-blue-500/20 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Executive Presentation Platform
          </span>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
            MRA Group Financial Cockpit
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Directly connected to your local <strong>PostgreSQL</strong> database. No Excel manual re-uploading required. 
            Select an active scenario below or edit figures in the Admin Studio.
          </p>
        </div>

        {/* Available Scenarios List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Scenarios in PostgreSQL ({scenarios.length})
            </h3>
            <Link href="/admin" className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
              Create New Scenario <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid gap-3.5">
            {scenarios.map((scenario) => (
              <div
                key={scenario.slug}
                className="bg-[#111827]/90 border border-slate-800/90 hover:border-blue-500/60 rounded-xl p-5 flex items-center justify-between transition-all group shadow-xl hover:shadow-2xl hover:shadow-blue-900/10 backdrop-blur-sm"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                      {scenario.title}
                    </h4>
                    {scenario.slug === INITIAL_DATASET.slug ? (
                      <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                        Master Baseline
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded">
                        Custom Scenario
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    URL: /p/{scenario.slug}
                  </p>
                  {scenario.updatedAt && (
                    <p className="text-[10px] text-slate-500">
                      Last modified: {new Date(scenario.updatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/p/${scenario.slug}`}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all active:scale-95"
                  >
                    <MonitorPlay className="w-4 h-4" />
                    Launch Deck
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Highlights Card */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-5 text-xs text-slate-400 space-y-2.5 backdrop-blur-sm">
          <div className="font-bold text-slate-200 uppercase text-[11px] tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            PostgreSQL Live Sync Features:
          </div>
          <p>
            • <strong>Instant Database Persistence:</strong> Any edits made in the Admin Studio are immediately committed to your local PostgreSQL (<code className="text-blue-300">mra_summary_plan</code>) database.
          </p>
          <p>
            • <strong>Multi-Scenario Isolation:</strong> Save your revised budgets as unique presentation links. Previous links remain locked and untouched for auditing.
          </p>
          <p>
            • <strong>Executive 16:9 Experience:</strong> Presentation mode features fluid framer-motion animations, one-click zoom, and synced cursor hovering.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-4 border-t border-slate-800/80 text-center text-xs text-slate-500">
        MRA Group Corporate Planning & Finance &copy; 2026. Altius Rev3 P&L Engine.
      </footer>
    </div>
  );
}
