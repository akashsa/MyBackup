export interface Ride {
  id: number;
  name: string;
  is_open: boolean;
  wait_time: number;
  last_updated: string;
}

export interface Land {
  id: number;
  name: string;
  rides: Ride[];
}

interface RawResponse {
  lands?: Land[];
  rides?: Ride[];
}

const ORPHAN_LAND_ID = -1;
const ORPHAN_LAND_NAME = 'Other';

export async function fetchQueueTimes(parkId: number, signal?: AbortSignal): Promise<Land[]> {
  const res = await fetch(`https://queue-times.com/parks/${parkId}/queue_times.json`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Queue-times responded ${res.status}`);
  }
  const json = (await res.json()) as RawResponse;
  const lands = [...(json.lands ?? [])];
  if (json.rides && json.rides.length > 0) {
    lands.push({ id: ORPHAN_LAND_ID, name: ORPHAN_LAND_NAME, rides: json.rides });
  }
  return lands;
}
