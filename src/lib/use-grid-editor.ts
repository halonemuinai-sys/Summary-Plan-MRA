import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditHistory } from './use-edit-history';

interface GridEditorOptions<Snapshot, Edit> {
  /** The data the grid is showing right now */
  snapshot: Snapshot;
  /** Applies edits and returns the updated data, or the same object when nothing effectively changed */
  apply: (snapshot: Snapshot, edits: Edit[]) => Snapshot;
  /** Keys of the rows that differ between two versions, so they can be highlighted for a moment */
  changedKeys: (before: Snapshot, after: Snapshot) => string[];
  /** Stores new data in the page state. Called for every edit, undo and redo. */
  onCommit: (snapshot: Snapshot) => void;
}

/**
 * Everything a spreadsheet grid needs around its data: applying edits, undo/redo and the highlight of
 * the rows that just changed. Used by both the P&L grid and the Brand Revenue Matrix.
 * The returned callbacks are stable and always work from the latest data.
 */
export function useGridEditor<Snapshot, Edit>(options: GridEditorOptions<Snapshot, Edit>) {
  const { push, undo, redo, clear, canUndo, canRedo } = useEditHistory<Snapshot>();
  const [flashKeys, setFlashKeys] = useState<string[]>([]);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>();

  const latest = useRef(options.snapshot);
  latest.current = options.snapshot;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    []
  );

  const commit = useCallback((before: Snapshot, after: Snapshot) => {
    // Remember the new data at once, so a second edit before the next render does not start from old data
    latest.current = after;
    optionsRef.current.onCommit(after);
    setFlashKeys(optionsRef.current.changedKeys(before, after));
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashKeys([]), 1300);
  }, []);

  const onEdits = useCallback(
    (edits: Edit[]) => {
      const before = latest.current;
      const after = optionsRef.current.apply(before, edits);
      if (after === before) return;
      push(before);
      commit(before, after);
    },
    [push, commit]
  );

  const onUndo = useCallback(() => {
    const before = latest.current;
    const previous = undo(before);
    if (previous !== null) commit(before, previous);
  }, [undo, commit]);

  const onRedo = useCallback(() => {
    const before = latest.current;
    const next = redo(before);
    if (next !== null) commit(before, next);
  }, [redo, commit]);

  return { onEdits, onUndo, onRedo, canUndo, canRedo, flashKeys, clearHistory: clear };
}
