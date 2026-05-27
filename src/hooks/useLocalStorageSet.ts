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
  // Swap two IDs' positions in the ordered list. No-op if either is missing.
  swap: (a: string | number, b: string | number) => void;
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

  const swap = useCallback((a: string | number, b: string | number) => {
    const ak = String(a);
    const bk = String(b);
    if (ak === bk) return;
    setList((prev) => {
      const ai = prev.indexOf(ak);
      const bi = prev.indexOf(bk);
      if (ai === -1 || bi === -1) return prev;
      const next = [...prev];
      next[ai] = bk;
      next[bi] = ak;
      return next;
    });
  }, []);

  return { has, toggle, clear, size: list.length, list, swap };
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
