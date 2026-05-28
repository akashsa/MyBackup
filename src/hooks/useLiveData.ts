import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchLiveMap, resolveParkId, type LiveMap } from '../api/themeparks';
import type { Park } from '../parks';

const POLL_MS = 60_000;

// Returns the park's themeparks.wiki UUID, resolving and caching it by name
// for parks that don't hardcode one (the water parks).
async function effectiveId(park: Park, signal?: AbortSignal): Promise<string> {
  if (park.themeparksId) return park.themeparksId;
  const cacheKey = `wdw:tpid:${park.id}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;
  } catch {
    // ignore
  }
  if (!park.resolveName) throw new Error('Park has no live-data ID');
  const resolved = await resolveParkId(park.resolveName, signal);
  if (!resolved) throw new Error(`Couldn't find ${park.name} in the live feed`);
  try {
    localStorage.setItem(cacheKey, resolved);
  } catch {
    // ignore
  }
  return resolved;
}

export interface LiveState {
  byName: LiveMap;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

export function useLiveData(park: Park): LiveState {
  const [byName, setByName] = useState<LiveMap>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      const id = await effectiveId(park, ctrl.signal);
      const map = await fetchLiveMap(id, ctrl.signal);
      if (ctrl.signal.aborted) return;
      setByName(map);
      setError(null);
      setLastUpdated(new Date());
    } catch (e) {
      if (ctrl.signal.aborted) return;
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, [park]);

  useEffect(() => {
    setByName(new Map());
    setError(null);
    setLastUpdated(null);
    load();

    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer != null) return;
      timer = setInterval(() => {
        if (!document.hidden) load();
      }, POLL_MS);
    };
    const stop = () => {
      if (timer != null) {
        clearInterval(timer);
        timer = null;
      }
    };

    start();
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        load();
        start();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      abortRef.current?.abort();
    };
  }, [load]);

  return { byName, loading, error, lastUpdated, refresh: load };
}
