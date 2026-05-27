import { useCallback, useEffect, useState } from 'react';

function read(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.map(String)) : new Set();
  } catch {
    return new Set();
  }
}

export interface LocalStorageSet {
  has: (id: string | number) => boolean;
  toggle: (id: string | number) => void;
  clear: () => void;
  size: number;
}

export function useLocalStorageSet(key: string): LocalStorageSet {
  const [set, setSet] = useState<Set<string>>(() => read(key));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify([...set]));
    } catch {
      // Quota exceeded or storage unavailable — ignore.
    }
  }, [key, set]);

  // Sync across tabs.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setSet(read(key));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  const has = useCallback((id: string | number) => set.has(String(id)), [set]);
  const toggle = useCallback((id: string | number) => {
    setSet((prev) => {
      const next = new Set(prev);
      const k = String(id);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }, []);
  const clear = useCallback(() => setSet(new Set()), []);

  return { has, toggle, clear, size: set.size };
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
