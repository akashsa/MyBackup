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

async function fetchJson<T>(target: string, signal?: AbortSignal): Promise<T> {
  let lastError: unknown = new Error('No attempts configured');
  for (const wrap of ATTEMPTS) {
    if (signal?.aborted) throw new DOMException('aborted', 'AbortError');
    try {
      const res = await fetchWithTimeout(wrap(target), signal);
      if (res.ok) return (await res.json()) as T;
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
  const json = await fetchJson<RawResponse>(url, signal);
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

// Walt Disney World Resort destination on themeparks.wiki. Its children are
// all the parks (theme + water), each with a stable UUID and name.
const WDW_DESTINATION_ID = 'e957da41-3552-4cf6-b636-5babc5cbc4e5';

interface RawChild {
  id?: string;
  name?: string;
}

interface RawChildrenResponse {
  children?: RawChild[];
}

// Resolves a park's themeparks.wiki UUID by matching a name fragment against
// the WDW destination's children. Used for parks whose UUID we don't hardcode
// (the water parks), so we never have to guess an ID.
export async function resolveParkId(
  nameFragment: string,
  signal?: AbortSignal,
): Promise<string | undefined> {
  const url = `https://api.themeparks.wiki/v1/entity/${WDW_DESTINATION_ID}/children`;
  const json = await fetchJson<RawChildrenResponse>(url, signal);
  const frag = normalize(nameFragment);
  const found = (json.children ?? []).find((c) => c.name && normalize(c.name).includes(frag));
  return found?.id;
}
