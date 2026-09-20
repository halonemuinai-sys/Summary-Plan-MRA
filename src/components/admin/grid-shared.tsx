'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createTextColumn, keyColumn, Column, DataSheetGridProps } from 'react-datasheet-grid';
import clsx from 'clsx';
import { formatForEdit, formatGrowth, parseNumberInput } from '@/lib/number-format';

// Pieces shared by the P&L grid and the Brand Revenue Matrix

/** Actual up to 2025, projection for 2026, plan after that (as in the workbook) */
export function yearTag(year: string) {
  const value = parseInt(year, 10);
  if (value <= 2025) return { text: 'Actual', className: 'pnl-tag-actual' };
  if (value === 2026) return { text: 'Projection', className: 'pnl-tag-proj' };
  return { text: 'Plan', className: 'pnl-tag-plan' };
}

export function YearHeader({ year }: { year: string }) {
  const tag = yearTag(year);
  return (
    <div className="pnl-head-year">
      <b>{year}</b>
      <span className={clsx('pnl-tag', tag.className)}>{tag.text}</span>
    </div>
  );
}

export function LabelHeader({ title, caption }: { title: string; caption: string }) {
  return (
    <div className="pnl-head-label">
      {title} <span>{caption}</span>
    </div>
  );
}

interface FigureWithGrowthProps {
  text: string;
  /** Growth over the previous year, in %; null or undefined when there is nothing to compare with */
  growth?: number | null;
  /** Added after the percentage, e.g. " YoY" on a single summary row */
  suffix?: string;
  negative?: boolean;
}

/** A figure with its growth underneath: used for the rows a deck is built on */
export function FigureWithGrowth({ text, growth, suffix = '', negative = false }: FigureWithGrowthProps) {
  return (
    <div className="pnl-figure">
      <span className={clsx('pnl-figure-value', negative && 'pnl-figure-value-down')}>{text}</span>
      {typeof growth === 'number' && (
        <span className={clsx('pnl-figure-growth', growth < 0 && 'pnl-figure-growth-down')}>
          {formatGrowth(growth)}
          {suffix}
        </span>
      )}
    </div>
  );
}

interface NumberColumnOptions {
  /** How a figure is shown in a cell */
  format: (value: number | undefined) => string;
  /** How a figure looks while it is edited and on the clipboard; plain digits in the browser locale by default */
  formatForEdit?: (value: number | undefined) => string;
  /** Reads what the user typed or pasted; null means "not a number", and the edit is then ignored */
  parse?: (text: string) => number | null;
}

/**
 * Editable number column for one flat field of the row (e.g. `y2027`).
 * Figures are committed when the cell is left (Enter, Tab, click away), so nothing is recalculated per keystroke.
 */
export function makeNumberColumn<Row>(field: string, options: NumberColumnOptions): Partial<Column<Row, any, string>> {
  // Text that is not a number becomes undefined; the change handler ignores it and the old figure comes back
  const parse = (text: string) => (options.parse ?? parseNumberInput)(text) ?? undefined;
  const editText = options.formatForEdit ?? formatForEdit;

  return keyColumn<any, string>(
    field,
    createTextColumn<number | undefined>({
      alignRight: true,
      continuousUpdates: false,
      deletedValue: 0,
      formatBlurredInput: options.format,
      formatInputOnFocus: editText,
      formatForCopy: editText,
      parseUserInput: parse,
      parsePastedValue: parse,
    })
  ) as Partial<Column<Row, any, string>>;
}

/** Height for the grid: the window minus `offset` px of page around it, kept between `min` and `max` */
export function useGridMaxHeight(offset: number, min = 380, max = Infinity) {
  const [height, setHeight] = useState(560);

  useEffect(() => {
    const update = () => setHeight(Math.min(max, Math.max(min, window.innerHeight - offset)));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [offset, min, max]);

  return height;
}

type ActiveCellHandler = NonNullable<DataSheetGridProps['onActiveCellChange']>;

/**
 * The grid library has no undo of its own. This makes Ctrl+Z / Ctrl+Y work while a cell is selected,
 * but not while typing in a cell (then the browser undoes the text, as in any input).
 * Pass the returned function to the grid as `onActiveCellChange`.
 */
export function useGridUndoKeys(onUndo: () => void, onRedo: () => void): ActiveCellHandler {
  const [active, setActive] = useState(false);
  const handlers = useRef({ onUndo, onRedo });
  handlers.current = { onUndo, onRedo };

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if ((event.target as HTMLElement | null)?.tagName === 'INPUT') return;
      const key = event.key.toLowerCase();
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault();
        handlers.current.onUndo();
      } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
        event.preventDefault();
        handlers.current.onRedo();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [active]);

  return useCallback<ActiveCellHandler>(({ cell }) => setActive(cell !== null), []);
}
