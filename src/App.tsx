import { useCallback, useMemo, useState } from 'react';
import { ParkSwitcher } from './components/ParkSwitcher';
import { FilterBar, type Filter } from './components/FilterBar';
import { LandSection } from './components/LandSection';
import { SearchBar } from './components/SearchBar';
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
          // Only hide if we know it's closed. Unknown stays visible.
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
  const filteredLands = useMemo(
    () => applyFilters(lands, filters, starred.has, visited.has, getInfo),
    [lands, filters, starred, visited, getInfo],
  );

  const normalizedQuery = normalize(query);
  const sectionsToRender = useMemo<Land[]>(() => {
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
  }, [filteredLands, normalizedQuery]);

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

        <p className="mt-4 text-center text-[11px] text-wdw-mute">
          {starred.size} starred · {visited.size} visited
        </p>
      </main>
    </div>
  );
}
