import { useMemo, useState } from 'react';
import { ParkSwitcher } from './components/ParkSwitcher';
import { FilterBar, type Filter } from './components/FilterBar';
import { LandSection } from './components/LandSection';
import { useWaitTimes } from './hooks/useWaitTimes';
import { useLocalStorageSet, useLocalStorageString } from './hooks/useLocalStorageSet';
import { DEFAULT_PARK_ID, WDW_PARKS } from './parks';
import type { Land } from './api/queueTimes';

function formatTime(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

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
        if (filters.has('open') && !r.is_open) return false;
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

  const { data, loading, error, lastUpdated, refresh } = useWaitTimes(parkId);
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

  const filteredLands = useMemo(
    () => (data ? applyFilters(data, filters, starred.has, visited.has) : []),
    [data, filters, starred, visited],
  );

  const currentPark = WDW_PARKS.find((p) => p.id === parkId);
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col">
      <header className="sticky top-0 z-10 bg-wdw-bg/95 px-3 pb-3 pt-3 backdrop-blur">
        <div className="mb-3 flex items-baseline justify-between">
          <h1 className="text-lg font-bold tracking-tight">
            {currentPark?.name ?? 'WDW Wait Times'}
          </h1>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="rounded-md px-2 py-1 text-xs text-wdw-mute hover:text-wdw-ink disabled:opacity-50"
            title="Refresh now"
          >
            {loading ? 'Refreshing…' : `Updated ${formatTime(lastUpdated)} ↻`}
          </button>
        </div>
        <ParkSwitcher selectedId={parkId} onSelect={setParkId} />
        <div className="mt-3">
          <FilterBar filters={filters} onToggle={toggleFilter} />
        </div>
        {isOffline && (
          <div className="mt-3 rounded-md bg-amber-500/15 px-3 py-2 text-xs text-amber-200 ring-1 ring-amber-400/30">
            You're offline — wait times may be stale.
          </div>
        )}
      </header>

      <main className="px-3 pb-8">
        {error && !data && (
          <div className="mt-4 rounded-lg bg-rose-500/15 p-4 text-sm text-rose-200 ring-1 ring-rose-400/30">
            <p className="font-medium">Couldn't load wait times.</p>
            <p className="mt-1 text-rose-200/80">{error}</p>
            <button
              type="button"
              onClick={refresh}
              className="mt-3 rounded-md bg-rose-500/30 px-3 py-1 text-rose-100 hover:bg-rose-500/40"
            >
              Try again
            </button>
          </div>
        )}

        {!data && loading && (
          <div className="mt-6 text-center text-sm text-wdw-mute">Loading attractions…</div>
        )}

        {data && filteredLands.length === 0 && (
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

        {data && (
          <p className="mt-4 text-center text-[11px] text-wdw-mute">
            Data from queue-times.com · {starred.size} starred · {visited.size} visited
          </p>
        )}
      </main>
    </div>
  );
}
