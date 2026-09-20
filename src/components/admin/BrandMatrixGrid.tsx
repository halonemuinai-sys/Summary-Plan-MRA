'use client';

import React, { useCallback, useMemo, useRef } from 'react';
// The Dynamic variant is needed: the default export freezes columns and rowClassName after the first render
import { DynamicDataSheetGrid, CellProps, Column, keyColumn } from 'react-datasheet-grid';
import 'react-datasheet-grid/dist/style.css';
import clsx from 'clsx';
import { Lock } from 'lucide-react';
import { BrandRowData } from '@/lib/types';
import { BrandEdit } from '@/lib/brand-engine';
import { BrandGridMode, BrandGridRow, buildBrandGridRows } from '@/lib/brand-layout';
import { GrowthField, growthField, yearField } from '@/lib/grid-fields';
import { formatBn, formatGrowth, formatRupiah, formatRupiahForEdit, parseNumberInput } from '@/lib/number-format';
import { FigureWithGrowth, LabelHeader, YearHeader, makeNumberColumn, useGridUndoKeys } from './grid-shared';

const LINE_HEIGHT = 38;
const SECTION_HEIGHT = 30;
const TOTAL_HEIGHT = 50;
const HEADER_HEIGHT = 54;
// The grid shrinks to its content up to this height. The matrix is about 820px, so it always shows every
// row (TOTAL included) and the page scrolls, instead of hiding the total row inside a scroll area.
const MAX_HEIGHT = 2000;

const MODE_CAPTION: Record<BrandGridMode, string> = {
  bn: 'IDR Billion',
  full: 'Full Rupiah',
  growth: 'Growth vs previous year',
};

interface BrandMatrixGridProps {
  brands: BrandRowData[];
  years: string[];
  mode: BrandGridMode;
  isLightMode: boolean;
  /** Rows whose figures just changed, briefly highlighted */
  flashKeys: string[];
  onEdits: (edits: BrandEdit[]) => void;
  onUndo: () => void;
  onRedo: () => void;
}

function BrandLabelCell({ rowData }: CellProps<BrandGridRow>) {
  const kind = rowData.section ? 'section' : rowData.total ? 'total' : 'line';

  return (
    <div
      title={rowData.hint}
      className={clsx(
        'pnl-label',
        `pnl-label-${kind}`,
        rowData.indent === 1 && 'pnl-label-indent',
        rowData.total && 'pnl-label-derived'
      )}
    >
      <span className="pnl-label-text">{rowData.label}</span>
      {rowData.badge && (
        <span className={clsx('brand-badge', `brand-badge-${rowData.badge.tone}`)}>{rowData.badge.label}</span>
      )}
      {rowData.total && <Lock className="pnl-lock" size={11} aria-label="Calculated automatically" />}
    </div>
  );
}

/** Small tag on the corner of a cell, showing growth over the previous year */
function GrowthChip({ value }: { value: number }) {
  return (
    <span className={clsx('brand-chip', value < 0 ? 'brand-chip-down' : 'brand-chip-up')}>{formatGrowth(value)}</span>
  );
}

/** TOTAL REVENUE cell: the figure with its growth underneath */
function TotalCell({ value, growth, mode }: { value?: number; growth?: number | null; mode: 'bn' | 'full' }) {
  return <FigureWithGrowth text={mode === 'full' ? formatRupiah(value) : formatBn(value)} growth={growth} suffix=" YoY" />;
}

/** Cell of the "% YoY Growth" view */
function GrowthCell({ rowData }: CellProps<number | null | undefined>) {
  // Section headings have no growth at all
  if (rowData === undefined) return <></>;
  const tone = rowData === null || rowData === 0 ? 'none' : rowData < 0 ? 'down' : 'up';
  return <span className={clsx('brand-growth', `brand-growth-${tone}`)}>{formatGrowth(rowData)}</span>;
}

function brandCellClass(row: BrandGridRow): string {
  if (row.section) return 'pnl-cell pnl-cell-section';
  if (row.total) return 'pnl-cell pnl-cell-derived pnl-cell-total';
  return clsx('pnl-cell', row.editable ? 'pnl-cell-input' : 'pnl-cell-view');
}

function makeGrowthColumn(year: string): Partial<Column<BrandGridRow>> {
  return {
    ...keyColumn<BrandGridRow, GrowthField>(growthField(year), {
      component: GrowthCell,
      copyValue: ({ rowData }) => (rowData === null || rowData === undefined ? '' : String(rowData)),
    }),
    title: <YearHeader year={year} />,
    basis: 120,
    grow: 1,
    shrink: 0,
    minWidth: 100,
    disabled: true,
    cellClassName: ({ rowData }) => brandCellClass(rowData),
  };
}

function makeAmountColumn(year: string, mode: 'bn' | 'full'): Partial<Column<BrandGridRow>> {
  const field = yearField(year);
  const growthOfYear = growthField(year);
  const amount =
    mode === 'full'
      ? makeNumberColumn<BrandGridRow>(field, {
          format: formatRupiah,
          formatForEdit: formatRupiahForEdit,
          // Rupiah amounts are whole numbers, so "312.195.489.682" is always grouping and never a decimal
          parse: (text) => parseNumberInput(text, { wholeNumber: true }),
        })
      : makeNumberColumn<BrandGridRow>(field, { format: formatBn });
  const AmountCell = amount.component!;

  return {
    ...amount,
    title: <YearHeader year={year} />,
    basis: mode === 'full' ? 150 : 118,
    grow: 1,
    shrink: 0,
    minWidth: mode === 'full' ? 140 : 108,
    component: (props: CellProps<BrandGridRow>) => {
      const growth = props.rowData[growthOfYear];
      if (props.rowData.total) {
        return <TotalCell value={props.rowData[field]} growth={growth} mode={mode} />;
      }
      // Growth shows on the corner of the cell, but not while typing and not next to an empty figure
      const showGrowth =
        mode === 'bn' &&
        !props.focus &&
        !props.rowData.section &&
        (props.rowData[field] ?? 0) > 0 &&
        typeof growth === 'number';

      return (
        <>
          {showGrowth && <GrowthChip value={growth} />}
          <AmountCell {...props} columnData={amount.columnData!} />
        </>
      );
    },
    disabled: ({ rowData }) => !rowData.editable,
    cellClassName: ({ rowData }) => brandCellClass(rowData),
  };
}

export default function BrandMatrixGrid({
  brands,
  years,
  mode,
  isLightMode,
  flashKeys,
  onEdits,
  onUndo,
  onRedo,
}: BrandMatrixGridProps) {
  // Parents often pass a fresh array every render: key everything on its content so columns stay stable
  const yearsKey = years.join(',');
  const yearList = useMemo(() => (yearsKey ? yearsKey.split(',') : []), [yearsKey]);

  const rows = useMemo(() => buildBrandGridRows(brands, yearList, mode), [brands, yearList, mode]);
  const columns = useMemo(
    () => yearList.map((year) => (mode === 'growth' ? makeGrowthColumn(year) : makeAmountColumn(year, mode))),
    [yearList, mode]
  );
  const labelColumn = useMemo(
    () => ({
      basis: 300,
      grow: 0,
      shrink: 0,
      minWidth: 300,
      title: <LabelHeader title="Brand / Business Unit" caption={MODE_CAPTION[mode]} />,
      component: BrandLabelCell,
    }),
    [mode]
  );
  const flashSet = useMemo(() => new Set(flashKeys), [flashKeys]);

  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const onEditsRef = useRef(onEdits);
  onEditsRef.current = onEdits;

  const onActiveCellChange = useGridUndoKeys(onUndo, onRedo);

  // Typing, pasting from Excel, dragging the fill handle and Delete all arrive here as a new copy of the rows.
  // Compare with what is on screen and pass on only the brand cells whose number really changed.
  const handleChange = useCallback(
    (next: BrandGridRow[]) => {
      if (mode === 'growth') return;
      const previous = rowsRef.current;
      const shown = mode === 'full' ? formatRupiah : formatBn;
      const edits: BrandEdit[] = [];

      next.forEach((row, index) => {
        const before = previous[index];
        if (!before || before.key !== row.key || !before.editable) return;
        for (const year of yearList) {
          const field = yearField(year);
          const value = row[field];
          // Not a number means the text could not be read: ignoring it puts the old figure back
          if (typeof value !== 'number' || Number.isNaN(value)) continue;
          const current = before[field] ?? 0;
          // Cells show rounded figures, and the grid can hand back its own displayed text as if it were typed
          // (it does that when the display mode changes). An edit that leaves the cell reading the same is not
          // a real edit, and taking it would quietly replace exact figures with their rounded version.
          if (value === current || shown(value) === shown(current)) continue;
          edits.push({ id: row.key, year, value, unit: mode === 'full' ? 'idr' : 'bn' });
        }
      });

      if (edits.length > 0) onEditsRef.current(edits);
    },
    [yearList, mode]
  );

  return (
    <div className="pnl-grid" data-theme={isLightMode ? 'light' : 'dark'}>
      <DynamicDataSheetGrid<BrandGridRow>
        // A change of display mode changes both the figures and their units: start the grid fresh, so cells
        // from the previous mode cannot hand their value to the new one
        key={mode}
        value={rows}
        onChange={handleChange}
        columns={columns}
        gutterColumn={labelColumn}
        rowKey="key"
        height={MAX_HEIGHT}
        rowHeight={({ rowData }) =>
          rowData.section ? SECTION_HEIGHT : rowData.total ? TOTAL_HEIGHT : LINE_HEIGHT
        }
        headerRowHeight={HEADER_HEIGHT}
        lockRows
        disableContextMenu
        addRowsComponent={false}
        rowClassName={({ rowData }) =>
          clsx(
            rowData.section && 'pnl-row-section',
            rowData.total && 'pnl-row-total',
            flashSet.has(rowData.key) && 'pnl-row-flash'
          )
        }
        onActiveCellChange={onActiveCellChange}
      />
    </div>
  );
}
