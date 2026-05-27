import { useMemo, useState } from 'react';
import { ParkSwitcher } from './components/ParkSwitcher';
import { FilterBar, type Filter } from './components/FilterBar';
import { LandSection } from './components/LandSection';
import { useLocalStorageSet, useLocalStorageString } from './hooks/useLocalStorageSet';
import { DEFAULT_PARK_ID, WDW_PARKS } from './parks';
import { getAttractions } from './data/wdwAttractions';
import type { Land } from './types';

function applyFilters(
  lands: Land[],
  filters: Set<Filter>,
  starred: (id: number) => boolean,
  visited: (id: number) => boolean,
): Land[] {
  if (filters.size === 0) return lands;
  return lands
    .map((land) => ({
      ...land,
      rides: land.rides.filter((r) => {
        if (filters.has('starred') && !starred(r.id)) return false;
        if (filters.has('unvisited') && visited(r.id)) return false;
        return true;
      }),
    }))
    .filter((l) => l.rides.length > 0);
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

  const toggleFilter = (f: Filter) => {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  };

  const lands = useMemo(() => getAttractions(parkId), [parkId]);
  const filteredLands = useMemo(
    () => applyFilters(lands, filters, starred.has, visited.has),
    [lands, filters, starred, visited],
  );

  const currentPark = WDW_PARKS.find((p) => p.id === parkId);

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col">
      <header className="sticky top-0 z-10 bg-wdw-bg/95 px-3 pb-3 pt-3 backdrop-blur">
        <h1 className="mb-3 text-lg font-bold tracking-tight">
          {currentPark?.name ?? 'WDW Attractions'}
        </h1>
        <ParkSwitcher selectedId={parkId} onSelect={setParkId} />
        <div className="mt-3">
          <FilterBar filters={filters} onToggle={toggleFilter} />
        </div>
      </header>

      <main className="px-3 pb-8">
        {filteredLands.length === 0 && (
          <div className="mt-6 text-center text-sm text-wdw-mute">
            No attractions match your filters.
          </div>
        )}

        {filteredLands.map((land) => (
          <LandSection
            key={land.id}
            land={land}
            isStarred={starred.has}
            isVisited={visited.has}
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
