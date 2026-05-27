import { useState } from 'react';
import type { Land, WaitInfo } from '../types';
import { AttractionRow } from './AttractionRow';

interface Props {
  land: Land;
  isStarred: (id: number) => boolean;
  isVisited: (id: number) => boolean;
  getWait: (name: string) => WaitInfo | undefined;
  onToggleStar: (id: number) => void;
  onToggleVisited: (id: number) => void;
}

export function LandSection({
  land,
  isStarred,
  isVisited,
  getWait,
  onToggleStar,
  onToggleVisited,
}: Props) {
  const [open, setOpen] = useState(true);

  if (land.rides.length === 0) return null;

  return (
    <section className="mb-3 overflow-hidden rounded-xl bg-wdw-card ring-1 ring-wdw-line/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <span className="text-sm font-semibold uppercase tracking-wide text-wdw-mute">
          {land.name}
        </span>
        <span className="text-xs text-wdw-mute">
          {land.rides.length} · {open ? '▾' : '▸'}
        </span>
      </button>
      {open && (
        <ul>
          {land.rides.map((ride) => (
            <AttractionRow
              key={ride.id}
              ride={ride}
              starred={isStarred(ride.id)}
              visited={isVisited(ride.id)}
              waitInfo={getWait(ride.name)}
              onToggleStar={() => onToggleStar(ride.id)}
              onToggleVisited={() => onToggleVisited(ride.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
