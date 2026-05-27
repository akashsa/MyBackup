import { useCallback, useMemo, useState } from 'react';
import { ParkSwitcher } from './components/ParkSwitcher';
import { FilterBar, type Filter } from './components/FilterBar';
import { LandSection } from './components/LandSection';
import { SearchBar } from './components/SearchBar';
import { AttractionRow } from './components/AttractionRow';
import { useLocalStorageSet, useLocalStorageString } from './hooks/useLocalStorageSet';
import { useLiveData } from './hooks/useLiveData';
import { DEFAULT_PARK_ID, WDW_PARKS, getPark } from './parks';
import { getAttractions } from './data/wdwAttractions';
import { lookupLive, type LiveMap } from './api/themeparks';
import { normalize } from './utils/normalize';
import type { Land, LiveInfo, Ride } from './types';

const MATCHES_LAND_ID = -100;

function applyFilters(
  lands: Land[],
  filters: Set<Filter>,
  starred: (id: number) => boolean,
  visited: (id: number) => boolean,
  getInfo: (name: string) => LiveInfo | undefined,
): Land[] {
  if (filters.size === 0) return lands;
  return lands
    .map((land) => ({
      ...land,
      rides: land.rides.filter((r) => {
        if (filters.has('starred') && !starred(r.id)) return false;
        if (filters.has('unvisited') && visited(r.id)) return false;
        if (filters.has('open')) {
          const info = getInfo(r.name);
          if (info && info.status !== 'OPERATING' && !info.showtimes?.length) return false;
        }
        return true;
      }),
    }))
    .filter((l) => l.rides.length > 0);
}

function formatTime(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function passesNonStarredFilters(
  ride: Ride,
  filters: Set<Filter>,
  visited: (id: number) => boolean,
  getInfo: (name: string) => LiveInfo | undefined,
): boolean {
  if (filters.has('unvisited') && visited(ride.id)) return false;
  if (filters.has('open')) {
    const info = getInfo(ride.name);
    if (info && info.status !== 'OPERATING' && !info.showtimes?.length) return false;
  }
  return true;
}

export default function App() {
  const [lastParkIdRaw, setLastParkIdRaw] = useLocalStorageString(
    'wdw:lastPark',
    String(DEFAULT_PARK_ID),
  );
  const parkId = Number(lastParkIdRaw) || DEFAULT_PARK_ID;
  const setParkId = (id: number) => setLastParkIdRaw(String(id));

  const starred = useLocalStorageSet('wdw:starred');
  const visited = useLocalStorageSet('wdw:visited');
  const [filters, setFilters] = useState<Set<Filter>>(new Set());
  const [query, setQuery] = useState('');

  const toggleFilter = (f: Filter) => {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  };

  const currentPark = getPark(parkId) ?? WDW_PARKS[0];
  const { byName, error, lastUpdated, loading, refresh } = useLiveData(currentPark.themeparksId);
  const getInfo = useCallback(
    (name: string) => lookupLive(name, byName as LiveMap),
    [byName],
  );

  const lands = useMemo(() => getAttractions(parkId), [parkId]);

  const normalizedQuery = normalize(query);
  const isStarredView = filters.has('starred');

  // --- Flat list of starred rides for the starred view ---
  // Walks the user's saved star order, keeps only rides in the current park,
  // applies the non-starred filters and search, and pairs each ride with its
  // land name so the row can show its location.
  const starredItems = useMemo<{ ride: Ride; landName: string }[]>(() => {
    if (!isStarredView) return [];
    const rideById = new Map<number, { ride: Ride; landName: string }>();
    for (const land of lands) {
      for (const ride of land.rides) rideById.set(ride.id, { ride, landName: land.name });
    }
    const result: { ride: Ride; landName: string }[] = [];
    for (const idStr of starred.list) {
      const id = Number(idStr);
      const entry = rideById.get(id);
      if (!entry) continue;
      if (!passesNonStarredFilters(entry.ride, filters, visited.has, getInfo)) continue;
      if (normalizedQuery && !normalize(entry.ride.name).includes(normalizedQuery)) continue;
      result.push(entry);
    }
    return result;
  }, [isStarredView, starred.list, lands, filters, visited, getInfo, normalizedQuery]);

  // --- Land sections for the normal (non-starred) view ---
  const filteredLands = useMemo(
    () => applyFilters(lands, filters, starred.has, visited.has, getInfo),
    [lands, filters, starred, visited, getInfo],
  );

  const sectionsToRender = useMemo<Land[]>(() => {
    if (isStarredView) return []; // not used in starred view
    if (!normalizedQuery) return filteredLands;

    const matches: Ride[] = [];
    for (const land of filteredLands) {
      for (const ride of land.rides) {
        if (normalize(ride.name).includes(normalizedQuery)) matches.push(ride);
      }
    }
    const matchedIds = new Set(matches.map((r) => r.id));

    const remainder = filteredLands
      .map((l) => ({ ...l, rides: l.rides.filter((r) => !matchedIds.has(r.id)) }))
      .filter((l) => l.rides.length > 0);

    const matchesSection: Land = {
      id: MATCHES_LAND_ID,
      name: `Matches (${matches.length})`,
      rides: matches,
    };
    return matches.length > 0 ? [matchesSection, ...remainder] : remainder;
  }, [isStarredView, filteredLands, normalizedQuery]);

  const hasLiveData = byName.size > 0;

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col">
      <header className="sticky top-0 z-10 bg-wdw-bg/95 px-3 pb-3 pt-3 backdrop-blur">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h1 className="truncate text-lg font-bold tracking-tight">{currentPark.name}</h1>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="shrink-0 rounded-md px-2 py-1 text-xs text-wdw-mute hover:text-wdw-ink disabled:opacity-50"
            title="Refresh live data"
          >
            {loading ? 'Refreshing…' : `${hasLiveData ? formatTime(lastUpdated) : 'Live data'} ↻`}
          </button>
        </div>
        <ParkSwitcher selectedId={parkId} onSelect={setParkId} />
        <div className="mt-3">
          <SearchBar value={query} onChange={setQuery} />
        </div>
        <div className="mt-3">
          <FilterBar filters={filters} onToggle={toggleFilter} />
        </div>
        {error && !hasLiveData && (
          <div className="mt-3 rounded-md bg-amber-500/15 px-3 py-2 text-xs text-amber-200 ring-1 ring-amber-400/30">
            <p>Couldn't load live data — showing attractions without wait times / showtimes.</p>
            <p className="mt-1 font-mono text-[10px] text-amber-200/70 break-all">{error}</p>
          </div>
        )}
      </header>

      <main className="px-3 pb-8">
        {isStarredView ? (
          <StarredView
            items={starredItems}
            visited={visited.has}
            getInfo={getInfo}
            onToggleStar={starred.toggle}
            onToggleVisited={visited.toggle}
            onSwap={starred.swap}
          />
        ) : (
          <>
            {sectionsToRender.length === 0 && (
              <div className="mt-6 text-center text-sm text-wdw-mute">
                {normalizedQuery ? 'No attractions match your search.' : 'No attractions match your filters.'}
              </div>
            )}
            {sectionsToRender.map((land) => (
              <LandSection
                key={land.id}
                land={land}
                isStarred={starred.has}
                isVisited={visited.has}
                getInfo={getInfo}
                onToggleStar={starred.toggle}
                onToggleVisited={visited.toggle}
              />
            ))}
          </>
        )}

        <p className="mt-4 text-center text-[11px] text-wdw-mute">
          {starred.size} starred · {visited.size} visited
        </p>
      </main>
    </div>
  );
}

interface StarredViewProps {
  items: { ride: Ride; landName: string }[];
  visited: (id: number) => boolean;
  getInfo: (name: string) => LiveInfo | undefined;
  onToggleStar: (id: number) => void;
  onToggleVisited: (id: number) => void;
  onSwap: (a: string | number, b: string | number) => void;
}

function StarredView({
  items,
  visited,
  getInfo,
  onToggleStar,
  onToggleVisited,
  onSwap,
}: StarredViewProps) {
  if (items.length === 0) {
    return (
      <div className="mt-6 text-center text-sm text-wdw-mute">
        No starred attractions in this park yet. Tap ☆ on any row to add one.
      </div>
    );
  }
  return (
    <section className="mb-3 overflow-hidden rounded-xl bg-wdw-card ring-1 ring-wdw-line/60">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-sm font-semibold uppercase tracking-wide text-wdw-mute">
          Your Plan
        </span>
        <span className="text-xs text-wdw-mute">{items.length} · use ▲▼ to reorder</span>
      </div>
      <ul>
        {items.map((item, i) => {
          const prev = items[i - 1]?.ride.id;
          const next = items[i + 1]?.ride.id;
          return (
            <AttractionRow
              key={item.ride.id}
              ride={item.ride}
              starred={true}
              visited={visited(item.ride.id)}
              info={getInfo(item.ride.name)}
              landName={item.landName}
              onMoveUp={prev !== undefined ? () => onSwap(item.ride.id, prev) : undefined}
              onMoveDown={next !== undefined ? () => onSwap(item.ride.id, next) : undefined}
              onToggleStar={() => onToggleStar(item.ride.id)}
              onToggleVisited={() => onToggleVisited(item.ride.id)}
            />
          );
        })}
      </ul>
    </section>
  );
}
