import { useMemo, useRef, useState } from 'react';

/**
 * Undo/redo stack for whole-snapshot edits. The returned functions are stable, so they can be
 * used inside callbacks without re-creating them on every render.
 */
export function useEditHistory<T>(limit = 100) {
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const [depth, setDepth] = useState({ undo: 0, redo: 0 });

  const api = useMemo(() => {
    const sync = () => setDepth({ undo: past.current.length, redo: future.current.length });

    return {
      /** Remember the state as it was before an edit */
      push(snapshot: T) {
        past.current.push(snapshot);
        if (past.current.length > limit) past.current.shift();
        future.current = [];
        sync();
      },
      /** Returns the previous state, or null when there is nothing to undo */
      undo(current: T): T | null {
        const previous = past.current.pop();
        if (previous === undefined) return null;
        future.current.push(current);
        sync();
        return previous;
      },
      /** Returns the state that was undone, or null when there is nothing to redo */
      redo(current: T): T | null {
        const next = future.current.pop();
        if (next === undefined) return null;
        past.current.push(current);
        sync();
        return next;
      },
      clear() {
        past.current = [];
        future.current = [];
        sync();
      },
    };
  }, [limit]);

  return { ...api, canUndo: depth.undo > 0, canRedo: depth.redo > 0 };
}
