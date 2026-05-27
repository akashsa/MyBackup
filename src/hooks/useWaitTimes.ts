import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchQueueTimes, type Land } from '../api/queueTimes';

const POLL_MS = 60_000;

export interface WaitTimesState {
  data: Land[] | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

export function useWaitTimes(parkId: number): WaitTimesState {
  const [data, setData] = useState<Land[] | null>(null);
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
      const lands = await fetchQueueTimes(parkId, ctrl.signal);
      if (ctrl.signal.aborted) return;
      setData(lands);
      setError(null);
      setLastUpdated(new Date());
    } catch (e) {
      if (ctrl.signal.aborted) return;
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, [parkId]);

  useEffect(() => {
    setData(null);
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

  return { data, loading, error, lastUpdated, refresh: load };
}
