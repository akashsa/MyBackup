import type { LiveInfo, Showtime } from '../types';
import { normalize } from '../utils/normalize';

// themeparks.wiki docs claim CORS is enabled, but we try direct first and
// fall back to public proxies if that fails. The proxies are identical to the
// queue-times setup we used before.
const ATTEMPTS: Array<(url: string) => string> = [
  (u) => u,
  (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}`,
];

const ATTEMPT_TIMEOUT_MS = 8000;

interface RawShowtime {
  startTime?: string;
  endTime?: string;
}

interface RawLiveItem {
  name?: string;
  status?: string;
  queue?: { STANDBY?: { waitTime?: number | null } | null } | null;
  showtimes?: RawShowtime[];
}

interface RawResponse {
  liveData?: RawLiveItem[];
}

export type LiveMap = Map<string, LiveInfo>;

async function fetchWithTimeout(url: string, outerSignal: AbortSignal | undefined): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ATTEMPT_TIMEOUT_MS);
  const onAbort = () => ctrl.abort();
  outerSignal?.addEventListener('abort', onAbort);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
    outerSignal?.removeEventListener('abort', onAbort);
  }
}

async function fetchTarget(target: string, signal?: AbortSignal): Promise<RawResponse> {
  let lastError: unknown = new Error('No attempts configured');
  for (const wrap of ATTEMPTS) {
    if (signal?.aborted) throw new DOMException('aborted', 'AbortError');
    try {
      const res = await fetchWithTimeout(wrap(target), signal);
      if (res.ok) return (await res.json()) as RawResponse;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (e) {
      if (signal?.aborted) throw e;
      lastError = e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function fetchLiveMap(themeparksId: string, signal?: AbortSignal): Promise<LiveMap> {
  const url = `https://api.themeparks.wiki/v1/entity/${themeparksId}/live`;
  const json = await fetchTarget(url, signal);
  const map: LiveMap = new Map();
  for (const item of json.liveData ?? []) {
    if (!item.name) continue;
    const waitTime = item.queue?.STANDBY?.waitTime;
    const showtimes: Showtime[] = (item.showtimes ?? [])
      .filter((s): s is Required<RawShowtime> => !!s.startTime && !!s.endTime)
      .map((s) => ({ startTime: s.startTime, endTime: s.endTime }));
    map.set(normalize(item.name), {
      status: item.status ?? 'CLOSED',
      waitTime: typeof waitTime === 'number' ? waitTime : undefined,
      showtimes: showtimes.length > 0 ? showtimes : undefined,
    });
  }
  return map;
}

// Substring fallback handles cases like "Mission: SPACE - Green Mission" being
// split into Green/Orange variants on the API side.
export function lookupLive(name: string, map: LiveMap): LiveInfo | undefined {
  const key = normalize(name);
  if (!key) return undefined;
  const exact = map.get(key);
  if (exact) return exact;
  if (key.length < 6) return undefined;
  for (const [k, v] of map) {
    if (k.includes(key)) return v;
  }
  return undefined;
}
