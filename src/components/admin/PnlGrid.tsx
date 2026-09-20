'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
// The Dynamic variant is needed: the default export freezes columns and rowClassName after the first render
import { DynamicDataSheetGrid, CellProps, Column } from 'react-datasheet-grid';
import 'react-datasheet-grid/dist/style.css';
import clsx from 'clsx';
import { Lock, Search, X, SlidersHorizontal, PencilLine } from 'lucide-react';
import { FinancialRowData } from '@/lib/types';
import { CellEdit } from '@/lib/formula-engine';
import { buildGridRows, GridRow } from '@/lib/pl-layout';
import { YearField, yearField, growthField } from '@/lib/grid-fields';
import { formatBn, formatPct } from '@/lib/number-format';
import { FigureWithGrowth, LabelHeader, YearHeader, makeNumberColumn, useGridMaxHeight, useGridUndoKeys } from './grid-shared';

const SECTION_HEIGHT = 32;
const HEADER_HEIGHT = 64;

interface PnlGridProps {
  items: Record<string, FinancialRowData>;
  years: string[];
  isLightMode: boolean;
  /** Rows whose figures just changed, briefly highlighted so the effect of an edit is visible */
  flashKeys: string[];
  onEdits: (edits: CellEdit[]) => void;
  onUndo: () => void;
  onRedo: () => void;
}

function LabelCell({ rowData }: CellProps<GridRow>) {
  const kind = rowData.section ? 'section' : rowData.style;
  const isCalculated = !rowData.section && !rowData.editable;

  return (
    <div
      title={rowData.hint}
      className={clsx(
        'pnl-label',
        `pnl-label-${kind}`,
        rowData.indent === 1 && 'pnl-label-indent',
        isCalculated && 'pnl-label-derived'
      )}
    >
      <span className="pnl-label-text">{rowData.label}</span>
      {isCalculated && <Lock className="pnl-lock" size={11} aria-label="Calculated automatically" />}
    </div>
  );
}

// Sticky first column: react-datasheet-grid only keeps its "gutter" column pinned while scrolling sideways
const LABEL_COLUMN = {
  basis: 320,
  grow: 0,
  shrink: 0,
  minWidth: 320,
  title: <LabelHeader title="Financial Line Item" caption="IDR Billion" />,
  component: LabelCell,
};

function cellClassName(row: GridRow, columnId?: string): string {
  if (row.section) return 'pnl-cell pnl-cell-section';
  const value = columnId ? row[columnId as YearField] ?? 0 : 0;
  return clsx(
    'pnl-cell',
    row.editable ? 'pnl-cell-input' : 'pnl-cell-derived',
    row.style === 'total' && 'pnl-cell-total',
    row.style === 'ratio' && 'pnl-cell-ratio',
    value <= -0.005 && 'pnl-cell-negative'
  );
}

function makeYearColumn(year: string): Partial<Column<GridRow>> {
  const field = yearField(year);
  const amount = makeNumberColumn<GridRow>(field, { format: formatBn });
  const ratio = makeNumberColumn<GridRow>(field, { format: formatPct });
  const AmountCell = amount.component!;
  const RatioCell = ratio.component!;

  return {
    ...amount,
    title: <YearHeader year={year} />,
    basis: 112,
    grow: 1,
    shrink: 0,
    minWidth: 100,
    // Ratio rows (GP %, OPEX %) show a % sign, every other row shows an IDR Billion amount
    component: (props: CellProps<GridRow>) =>
      props.rowData.headline ? (
        <FigureWithGrowth text={formatBn(props.rowData[field])} growth={props.rowData[growthField(year)]} suffix=" YoY" negative={(props.rowData[field] ?? 0) < 0} />
      ) : props.rowData.unit === 'pct' ? (
        <RatioCell {...props} columnData={ratio.columnData!} />
      ) : (
        <AmountCell {...props} columnData={amount.columnData!} />
      ),
    disabled: ({ rowData }) => !rowData.editable,
    cellClassName: ({ rowData, columnId }) => cellClassName(rowData, columnId),
  };
}

export default function PnlGrid({ items, years, isLightMode, flashKeys, onEdits, onUndo, onRedo }: PnlGridProps) {
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'all' | 'summary' | 'inputs'>('all');
  const [compact, setCompact] = useState(false);
  const [selected, setSelected] = useState<{ key: string; year: string } | null>(null);
  // Parents often pass a fresh array every render: key everything on its content so columns stay stable
  const yearsKey = years.join(',');
  const yearList = useMemo(() => (yearsKey ? yearsKey.split(',') : []), [yearsKey]);

  const allRows = useMemo(() => buildGridRows(items, yearList), [items, yearList]);
  const rows = useMemo(() => {
    const result: GridRow[] = [];
    let section: GridRow | undefined;
    let addedSection = '';
    const search = query.trim().toLowerCase();
    for (const row of allRows) {
      if (row.section) { section = row; continue; }
      if (view === 'summary' && row.style !== 'total' && row.style !== 'ratio') continue;
      if (view === 'inputs' && !row.editable) continue;
      if (search && !`${row.label} ${section?.label ?? ''}`.toLowerCase().includes(search)) continue;
      if (section && section.key !== addedSection) { result.push(section); addedSection = section.key; }
      result.push(row);
    }
    return result;
  }, [allRows, query, view]);
  const columns = useMemo(() => yearList.map(makeYearColumn), [yearList]);
  const flashSet = useMemo(() => new Set(flashKeys), [flashKeys]);

  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const onEditsRef = useRef(onEdits);
  onEditsRef.current = onEdits;

  // Fill the screen below the page header; the grid scrolls inside, with header and labels pinned
  const maxHeight = useGridMaxHeight(360);
  const onActiveCellChange = useGridUndoKeys(onUndo, onRedo);
  const selectedRow = rows.find(row => row.key === selected?.key);

  // Typing, pasting from Excel, dragging the fill handle and Delete all arrive here as a new copy of the rows.
  // Compare with what is on screen and pass on only the input cells whose number really changed.
  const handleChange = useCallback(
    (next: GridRow[]) => {
      const previous = rowsRef.current;
      const edits: CellEdit[] = [];

      next.forEach((row, index) => {
        const before = previous[index];
        if (!before || before.key !== row.key || !before.editable) return;
        const shown = before.unit === 'pct' ? formatPct : formatBn;
        for (const year of yearList) {
          const field = yearField(year);
          const value = row[field];
          // Not a number means the text could not be read: ignoring it puts the old figure back
          if (typeof value !== 'number' || Number.isNaN(value)) continue;
          const current = before[field] ?? 0;
          // Cells show rounded figures, and the grid can hand back its own displayed text as if it were typed.
          // An edit that leaves the cell reading the same is not a real edit.
          if (value === current || shown(value) === shown(current)) continue;
          edits.push({ key: row.key, year, value });
        }
      });

      if (edits.length > 0) onEditsRef.current(edits);
    },
    [yearList]
  );

  return (
    <div className="pnl-grid pnl-workbench" data-theme={isLightMode ? 'light' : 'dark'}>
      <div className="pnl-workbench-toolbar">
        <div className="pnl-view-switch" role="group" aria-label="Visible financial rows">
          {([['all', 'Full P&L'], ['summary', 'Summary'], ['inputs', 'Inputs only']] as const).map(([key, label]) => <button key={key} aria-pressed={view === key} onClick={() => { setView(key); setSelected(null); }}>{label}</button>)}
        </div>
        <div className="pnl-workbench-tools">
          <label className="pnl-search"><Search size={15} /><input aria-label="Search financial line items" placeholder="Find a line item…" value={query} onChange={e => { setQuery(e.target.value); setSelected(null); }} />{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={13} /></button>}</label>
          <button className="pnl-density" aria-pressed={compact} onClick={() => setCompact(v => !v)} title="Toggle row density"><SlidersHorizontal size={14} />{compact ? 'Compact' : 'Comfortable'}</button>
        </div>
      </div>
      <div className="pnl-cell-context" aria-live="polite">
        <span className="pnl-cell-address">{selectedRow && selected ? `FY${selected.year}` : 'IDR Bn'}</span>
        {selectedRow && !selectedRow.section ? <><span className="pnl-context-label">{selectedRow.label}</span><span className="pnl-context-hint">{selectedRow.hint ?? (selectedRow.editable ? 'Editable input. Press Enter to confirm your changes.' : 'Calculated from the financial model.')}</span><span className="pnl-context-kind">{selectedRow.editable ? <PencilLine size={12} /> : <Lock size={12} />}{selectedRow.editable ? 'Input' : 'Calculated'}</span></> : <span className="pnl-context-hint">Select a cell to inspect its line item. Blue figures are editable; locked rows calculate automatically.</span>}
      </div>
      {rows.length === 0 ? <div className="pnl-empty"><Search size={24} /><strong>No matching line items</strong><span>Try another name or return to the full P&L.</span><button onClick={() => { setQuery(''); setView('all'); }}>Reset filters</button></div> :
      <DynamicDataSheetGrid<GridRow>
        key={`${view}:${query}`}
        value={rows}
        onChange={handleChange}
        columns={columns}
        gutterColumn={LABEL_COLUMN}
        rowKey="key"
        height={maxHeight}
        rowHeight={({ rowData }) => (rowData.section ? SECTION_HEIGHT : rowData.headline ? (compact ? 48 : 58) : (compact ? 32 : 42))}
        headerRowHeight={HEADER_HEIGHT}
        lockRows
        disableContextMenu
        addRowsComponent={false}
        rowClassName={({ rowData }) =>
          clsx(
            rowData.section && 'pnl-row-section',
            rowData.style === 'total' && 'pnl-row-total',
            rowData.headline && 'pnl-row-headline',
            flashSet.has(rowData.key) && 'pnl-row-flash'
          )
        }
        onActiveCellChange={(event) => {
          onActiveCellChange(event);
          const cell = event.cell;
          setSelected(cell && rows[cell.row] ? { key: rows[cell.row].key, year: yearList[cell.col] } : null);
        }}
      />
      }
      <div className="pnl-workbench-footer"><span>{rows.filter(row => !row.section).length} line items <span className="pnl-footer-dot">·</span> {yearList.length} fiscal years</span><div><span className="pnl-input-legend"><PencilLine size={11} />Editable</span><span><Lock size={11} />Calculated</span><span className="pnl-keyboard-hint">Tab to navigate · Ctrl+Z to undo</span></div></div>
    </div>
  );
}
