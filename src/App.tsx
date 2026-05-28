import { useCallback, useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
const MORE_LAND_ID = 998;

// Stable positive ID derived from a name, for live-discovered attractions that
// aren't in the curated list. Offset far above curated IDs to avoid collisions.
function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return 800000000 + (h >>> 0) % 100000000;
}

// Builds a "More" land from live-feed entries (attractions / shows only) that
// no curated ride covers, so the list stays complete without manual curation.
function buildMoreLand(lands: Land[], byName: LiveMap): Land | null {
  if (byName.size === 0) return null;
  const staticKeys: string[] = [];
  for (const land of lands) for (const r of land.rides) staticKeys.push(normalize(r.name));
  const covered = (liveKey: string) =>
    staticKeys.some((sk) => sk === liveKey || (sk.length >= 6 && liveKey.includes(sk)));

  const extras: Ride[] = [];
  for (const [liveKey, info] of byName) {
    if (info.entityType !== 'ATTRACTION' && info.entityType !== 'SHOW') continue;
    if (!info.name || covered(liveKey)) continue;
    extras.push({ id: hashId(liveKey), name: info.name });
  }
  if (extras.length === 0) return null;
  extras.sort((a, b) => a.name.localeCompare(b.name));
  return { id: MORE_LAND_ID, name: 'More', rides: extras };
}

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
  const { byName, error, lastUpdated, loading, refresh } = useLiveData(currentPark);
  const getInfo = useCallback(
    (name: string) => lookupLive(name, byName as LiveMap),
    [byName],
  );

  const lands = useMemo(() => {
    const base = getAttractions(parkId);
    const more = buildMoreLand(base, byName as LiveMap);
    return more ? [...base, more] : base;
  }, [parkId, byName]);

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
            onReorder={starred.reorderSubset}
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
  onReorder: (newOrder: string[]) => void;
}

function StarredView({
  items,
  visited,
  getInfo,
  onToggleStar,
  onToggleVisited,
  onReorder,
}: StarredViewProps) {
  // Drag is initiated only from the dedicated handle (touch-action: none),
  // so the rest of the row scrolls naturally. A small TouchSensor delay
  // keeps incidental contact on the handle from triggering a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const ids = items.map((i) => String(i.ride.id));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(ids, oldIndex, newIndex));
  };

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
        <span className="text-xs text-wdw-mute">{items.length} · drag ⋮⋮ to reorder</span>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul>
            {items.map((item) => (
              <SortableStarredRow
                key={item.ride.id}
                item={item}
                visited={visited(item.ride.id)}
                info={getInfo(item.ride.name)}
                onToggleStar={() => onToggleStar(item.ride.id)}
                onToggleVisited={() => onToggleVisited(item.ride.id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  );
}

interface SortableStarredRowProps {
  item: { ride: Ride; landName: string };
  visited: boolean;
  info: LiveInfo | undefined;
  onToggleStar: () => void;
  onToggleVisited: () => void;
}

function SortableStarredRow({
  item,
  visited,
  info,
  onToggleStar,
  onToggleVisited,
}: SortableStarredRowProps) {
  const { setNodeRef, transform, transition, attributes, listeners, isDragging } = useSortable({
    id: String(item.ride.id),
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <AttractionRow
      ride={item.ride}
      starred
      visited={visited}
      info={info}
      landName={item.landName}
      outerRef={setNodeRef}
      outerStyle={style}
      outerProps={attributes}
      handleProps={listeners}
      isDragging={isDragging}
      onToggleStar={onToggleStar}
      onToggleVisited={onToggleVisited}
    />
  );
}
