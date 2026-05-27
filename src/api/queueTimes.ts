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

export async function fetchWaitMap(parkId: number, signal?: AbortSignal): Promise<WaitMap> {
  const res = await fetch(`https://queue-times.com/parks/${parkId}/queue_times.json`, { signal });
  if (!res.ok) throw new Error(`queue-times responded ${res.status}`);
  const json = (await res.json()) as RawResponse;
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
