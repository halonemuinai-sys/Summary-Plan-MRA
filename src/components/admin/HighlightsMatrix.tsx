'use client';

import React, { useCallback, useMemo, useRef } from 'react';
// The Dynamic variant is needed: the default export freezes columns after the first render, and the
// year headers here change when a year is switched between Actual and Forecast
import { DynamicDataSheetGrid, CellProps, Column } from 'react-datasheet-grid';
import 'react-datasheet-grid/dist/style.css';
import clsx from 'clsx';
import { formatBn, formatPct } from '@/lib/number-format';
import { YearField, yearField } from '@/lib/grid-fields';
import { Lock } from 'lucide-react';
import { LabelHeader, makeNumberColumn, useGridUndoKeys } from './grid-shared';

const ROW_HEIGHT = 38;
const HEADER_HEIGHT = 54;

/** One editable line of a trajectory, e.g. "Gross Profit" reading the `gp` field of each point */
export interface MatrixRowDef {
  field: string;
  label: string;
  unit?: 'bn' | 'pct';
}

/** A trajectory point: a year plus one number per line. Each trajectory has its own typed shape,
 *  so the fields are read by name at runtime. */
export interface MatrixPoint {
  year: string;
  isForecast?: boolean;
}

type MatrixGridRow = {
  field: string;
  label: string;
  unit: 'bn' | 'pct';
} & { [year in YearField]?: number };

interface HighlightsMatrixProps {
  rows: MatrixRowDef[];
  points: MatrixPoint[];
  /** Shown under the first column header, e.g. "IDR Billion" */
  caption: string;
  isLightMode: boolean;
  onEdit?: (field: string, year: string, value: number) => void;
  /** Figures worked out from other tables: shown, never typed into */
  readOnly?: boolean;
  /** When given, each year header carries a button that switches it between Actual and Forecast */
  onToggleForecast?: (year: string) => void;
  onUndo: () => void;
  onRedo: () => void;
}

function LabelCell({ rowData, columnData }: CellProps<MatrixGridRow, { readOnly?: boolean }>) {
  return (
    <div className={clsx('pnl-label', columnData?.readOnly && 'pnl-label-derived')}>
      <span className="pnl-label-text">{rowData.label}</span>
      {rowData.unit === 'pct' && <span className="hl-unit">%</span>}
      {columnData?.readOnly && <Lock className="pnl-lock" size={11} aria-label="Worked out automatically" />}
    </div>
  );
}

const LABEL_COLUMN_BASE = { basis: 240, grow: 0, shrink: 0, minWidth: 240, component: LabelCell };

export default function HighlightsMatrix({
  rows,
  points,
  caption,
  isLightMode,
  onEdit,
  readOnly = false,
  onToggleForecast,
  onUndo,
  onRedo,
}: HighlightsMatrixProps) {
  const gridRows = useMemo<MatrixGridRow[]>(
    () =>
      rows.map((row) => {
        const gridRow: MatrixGridRow = { field: row.field, label: row.label, unit: row.unit ?? 'bn' };
        for (const point of points) {
          gridRow[yearField(point.year)] = Number((point as unknown as Record<string, unknown>)[row.field] ?? 0);
        }
        return gridRow;
      }),
    [rows, points]
  );

  const columns = useMemo<Partial<Column<MatrixGridRow>>[]>(
    () =>
      points.map((point) => {
        const field = yearField(point.year);
        const amount = makeNumberColumn<MatrixGridRow>(field, { format: formatBn });
        const ratio = makeNumberColumn<MatrixGridRow>(field, { format: formatPct });
        const AmountCell = amount.component!;
        const RatioCell = ratio.component!;

        return {
          ...amount,
          title: (
            <div className="pnl-head-year">
              <b>{point.year}</b>
              {onToggleForecast && (
                <button
                  type="button"
                  onClick={() => onToggleForecast(point.year)}
                  className={clsx('hl-type', point.isForecast ? 'hl-type-forecast' : 'hl-type-actual')}
                  title="Switch this year between Actual and Forecast"
                >
                  {point.isForecast ? 'Forecast' : 'Actual'}
                </button>
              )}
            </div>
          ),
          basis: 104,
          grow: 1,
          shrink: 0,
          minWidth: 92,
          component: (props: CellProps<MatrixGridRow>) =>
            props.rowData.unit === 'pct' ? (
              <RatioCell {...props} columnData={ratio.columnData!} />
            ) : (
              <AmountCell {...props} columnData={amount.columnData!} />
            ),
          disabled: readOnly,
          cellClassName: () => (readOnly ? 'pnl-cell pnl-cell-derived' : 'pnl-cell pnl-cell-input'),
        };
      }),
    [points, onToggleForecast, readOnly]
  );

  const labelColumn = useMemo(
    () => ({ ...LABEL_COLUMN_BASE, title: <LabelHeader title="Line" caption={caption} />, columnData: { readOnly } }),
    [caption, readOnly]
  );

  const rowsRef = useRef(gridRows);
  rowsRef.current = gridRows;
  const onEditRef = useRef(onEdit);
  onEditRef.current = onEdit;

  const onActiveCellChange = useGridUndoKeys(onUndo, onRedo);

  // Typing, pasting from Excel, the fill handle and Delete all arrive as a fresh copy of the rows
  const handleChange = useCallback(
    (next: MatrixGridRow[]) => {
      if (readOnly) return;
      const previous = rowsRef.current;
      next.forEach((row, index) => {
        const before = previous[index];
        if (!before || before.field !== row.field) return;
        for (const point of points) {
          const field = yearField(point.year);
          const value = row[field];
          // Text that could not be read comes back undefined: ignoring it puts the old figure back
          if (typeof value !== 'number' || Number.isNaN(value)) continue;
          const current = before[field] ?? 0;
          const shown = before.unit === 'pct' ? formatPct : formatBn;
          // The grid can hand back its own rounded display text as if it were typed
          if (value === current || shown(value) === shown(current)) continue;
          onEditRef.current?.(row.field, point.year, value);
        }
      });
    },
    [points, readOnly]
  );

  return (
    <div className="pnl-grid hl-matrix" data-theme={isLightMode ? 'light' : 'dark'}>
      <DynamicDataSheetGrid<MatrixGridRow>
        value={gridRows}
        onChange={handleChange}
        columns={columns}
        gutterColumn={labelColumn}
        rowKey="field"
        height={HEADER_HEIGHT + rows.length * ROW_HEIGHT + 2}
        rowHeight={ROW_HEIGHT}
        headerRowHeight={HEADER_HEIGHT}
        lockRows
        disableContextMenu
        addRowsComponent={false}
        onActiveCellChange={onActiveCellChange}
      />
    </div>
  );
}
