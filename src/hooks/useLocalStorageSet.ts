import { useCallback, useEffect, useMemo, useState } from 'react';

function read(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export interface LocalStorageSet {
  has: (id: string | number) => boolean;
  toggle: (id: string | number) => void;
  clear: () => void;
  size: number;
  // Ordered list of IDs. For starred items this order is the user's
  // preference for visit priority and is preserved across renders.
  list: string[];
  // Replace the positions of items in `newOrder` with `newOrder`'s ordering,
  // keeping any IDs not present in `newOrder` exactly where they were. Used
  // by the drag-and-drop reorder UI which only reorders the currently
  // displayed subset (e.g. one park at a time).
  reorderSubset: (newOrder: string[]) => void;
}

export function useLocalStorageSet(key: string): LocalStorageSet {
  const [list, setList] = useState<string[]>(() => read(key));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(list));
    } catch {
      // ignore quota / disabled storage
    }
  }, [key, list]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setList(read(key));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  const set = useMemo(() => new Set(list), [list]);

  const has = useCallback((id: string | number) => set.has(String(id)), [set]);

  const toggle = useCallback((id: string | number) => {
    const k = String(id);
    setList((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  }, []);

  const clear = useCallback(() => setList([]), []);

  const reorderSubset = useCallback((newOrder: string[]) => {
    setList((prev) => {
      const subset = new Set(newOrder);
      const positions: number[] = [];
      prev.forEach((id, idx) => {
        if (subset.has(id)) positions.push(idx);
      });
      if (positions.length !== newOrder.length) return prev;
      const next = [...prev];
      positions.forEach((pos, i) => {
        next[pos] = newOrder[i];
      });
      return next;
    });
  }, []);

  return { has, toggle, clear, size: list.length, list, reorderSubset };
}

export function useLocalStorageString(key: string, fallback: string): [string, (v: string) => void] {
  const [value, setValue] = useState<string>(() => {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  });
  const update = useCallback(
    (v: string) => {
      setValue(v);
      try {
        localStorage.setItem(key, v);
      } catch {
        // ignore
      }
    },
    [key],
  );
  return [value, update];
}
