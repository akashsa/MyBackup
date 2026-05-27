import type { WaitInfo } from '../types';
import { normalize } from '../utils/normalize';

interface RawRide {
  name?: string;
  wait_time?: number;
  is_open?: boolean;
}

interface RawResponse {
  lands?: { rides?: RawRide[] }[];
  rides?: RawRide[];
}

export type WaitMap = Map<string, WaitInfo>;

// Public CORS proxies. queue-times.com fails direct from GitHub Pages (Safari
// reports a generic "Load failed", almost certainly CORS). Each public proxy
// has its own outages / rate limits, so we try them in order with a per-attempt
// timeout. Long-term fix is a Cloudflare Worker we control.
const PROXIES: Array<(url: string) => string> = [
  (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}`,
];

const ATTEMPT_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, outerSignal: AbortSignal | undefined): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ATTEMPT_TIMEOUT_MS);
  const onOuterAbort = () => ctrl.abort();
  outerSignal?.addEventListener('abort', onOuterAbort);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
    outerSignal?.removeEventListener('abort', onOuterAbort);
  }
}

async function fetchTarget(target: string, signal?: AbortSignal): Promise<RawResponse> {
  let lastError: unknown = new Error('No proxies configured');
  for (const wrap of PROXIES) {
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

export async function fetchWaitMap(parkId: number, signal?: AbortSignal): Promise<WaitMap> {
  const target = `https://queue-times.com/parks/${parkId}/queue_times.json`;
  const json = await fetchTarget(target, signal);
  const map: WaitMap = new Map();
  const ingest = (r: RawRide) => {
    if (typeof r?.name !== 'string') return;
    map.set(normalize(r.name), {
      wait_time: typeof r.wait_time === 'number' ? r.wait_time : 0,
      is_open: !!r.is_open,
    });
  };
  for (const land of json.lands ?? []) for (const r of land.rides ?? []) ingest(r);
  for (const r of json.rides ?? []) ingest(r);
  return map;
}

// Looks up a ride by name with a fallback to keys that contain our normalized
// name (e.g. queue-times splits "Mission: SPACE" into "Green Mission" /
// "Orange Mission" variants).
export function lookupWait(name: string, map: WaitMap): WaitInfo | undefined {
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
