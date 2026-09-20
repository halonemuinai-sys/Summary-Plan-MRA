'use client';

import React from 'react';
import { Redo2, Undo2 } from 'lucide-react';

interface EditHistoryButtonsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isLightMode: boolean;
}

/** Undo / Redo pair shown above an editable grid */
export function EditHistoryButtons({ canUndo, canRedo, onUndo, onRedo, isLightMode }: EditHistoryButtonsProps) {
  const base = 'px-2.5 py-1.5 transition-all disabled:opacity-35 disabled:cursor-not-allowed';
  const tone = isLightMode
    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
    : 'bg-slate-800 hover:bg-slate-700 text-slate-200';

  return (
    <div className={`flex rounded-lg border overflow-hidden ${isLightMode ? 'border-slate-300' : 'border-slate-700'}`}>
      <button
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
        className={`${base} ${tone} border-r ${isLightMode ? 'border-slate-300' : 'border-slate-700'}`}
      >
        <Undo2 size={14} />
      </button>
      <button onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)" aria-label="Redo" className={`${base} ${tone}`}>
        <Redo2 size={14} />
      </button>
    </div>
  );
}

/** Small badge that shows while the page holds edits that are not saved yet */
export function UnsavedBadge({ isLightMode }: { isLightMode: boolean }) {
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border bg-amber-500/15 border-amber-500/40 ${
        isLightMode ? 'text-amber-700' : 'text-amber-300'
      }`}
    >
      Unsaved changes
    </span>
  );
}
