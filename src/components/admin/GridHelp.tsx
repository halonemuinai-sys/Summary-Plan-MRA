'use client';

import React, { useId } from 'react';
import { Info, Lock } from 'lucide-react';

interface GridHelpProps {
  /** Which grid is being explained */
  variant: 'pnl' | 'brand';
  isLightMode: boolean;
}

const SHORTCUTS: Array<{ keys: string; action: string }> = [
  { keys: 'Enter', action: 'Confirm and move down' },
  { keys: 'Arrow keys / Tab', action: 'Move between cells' },
  { keys: 'Ctrl+C / Ctrl+V', action: 'Copy and paste, also from Excel' },
  { keys: 'Ctrl+Z / Ctrl+Y', action: 'Undo / redo' },
];

/** Info icon that explains a grid in a hover/focus tooltip, so the page needs no permanent helper text */
export default function GridHelp({ variant, isLightMode }: GridHelpProps) {
  const tooltipId = useId();

  const divider = isLightMode ? 'border-slate-200' : 'border-slate-700';
  const heading = isLightMode ? 'text-slate-900' : 'text-white';
  const inputColor = isLightMode ? 'text-blue-700' : 'text-sky-300';
  const lockIcon = <Lock size={11} className="inline -mt-0.5" />;

  return (
    // The tooltip sits inside the group, so it stays open while the pointer moves from the icon onto it
    <span className="relative inline-flex group">
      <button
        type="button"
        aria-label={variant === 'pnl' ? 'How this grid works' : 'How this matrix works'}
        aria-describedby={tooltipId}
        onKeyDown={(event) => {
          if (event.key === 'Escape') event.currentTarget.blur();
        }}
        className={`rounded-full p-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          isLightMode
            ? 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
            : 'text-slate-500 hover:text-sky-300 hover:bg-slate-800'
        }`}
      >
        <Info size={16} />
      </button>

      <div
        id={tooltipId}
        role="tooltip"
        className="absolute left-0 top-full z-50 hidden pt-2 group-hover:block group-focus-within:block"
      >
        <div
          className={`w-[340px] max-w-[85vw] rounded-xl border p-4 text-xs font-normal leading-relaxed shadow-xl ${
            isLightMode
              ? 'bg-white border-slate-200 text-slate-600'
              : 'bg-[#0F172A] border-slate-700 text-slate-300'
          }`}
        >
          <p className={`mb-2 text-[11px] font-bold uppercase tracking-wider ${heading}`}>
            {variant === 'pnl' ? 'How this grid works' : 'How this matrix works'}
          </p>

          <ul className="space-y-1.5">
            <li>
              <span className={`font-semibold ${inputColor}`}>Blue figures</span> are inputs. Click a cell and type.
            </li>
            {variant === 'pnl' ? (
              <>
                <li>
                  <span className={`font-semibold ${heading}`}>Grey rows</span> {lockIcon} are calculated for you (GP,
                  OPEX, EBITDA, NPAT).
                </li>
                <li>All figures are in IDR Billion.</li>
              </>
            ) : (
              <>
                <li>
                  <span className={`font-semibold ${heading}`}>TOTAL REVENUE</span> {lockIcon} and the growth figures are
                  calculated for you.
                </li>
                <li>
                  The buttons above the table switch between IDR Billion, Full Rupiah and % YoY Growth. Growth is view
                  only.
                </li>
                <li>
                  The small green or red figure in a cell is growth compared with the previous year (2026 is the base
                  year).
                </li>
              </>
            )}
          </ul>

          <div className={`my-3 border-t ${divider}`} />

          <dl className="space-y-1.5">
            {SHORTCUTS.map(({ keys, action }) => (
              <div key={keys} className="flex items-baseline justify-between gap-3">
                <dt>
                  <kbd
                    className={`rounded border px-1.5 py-0.5 font-mono text-[10.5px] ${
                      isLightMode ? 'bg-slate-50 border-slate-300 text-slate-700' : 'bg-slate-800 border-slate-600 text-slate-200'
                    }`}
                  >
                    {keys}
                  </kbd>
                </dt>
                <dd className="text-right">{action}</dd>
              </div>
            ))}
          </dl>

          <p className={`mt-3 border-t pt-3 ${divider}`}>
            {variant === 'pnl'
              ? 'Hover a row name to see how it is calculated.'
              : 'Changes here update this matrix only. They do not change the P&L grid.'}
          </p>
        </div>
      </div>
    </span>
  );
}
