import type { CSSProperties, HTMLAttributes, Ref } from 'react';
import type { LiveInfo, Ride } from '../types';
import { LiveBadge } from './LiveBadge';

interface Props {
  ride: Ride;
  starred: boolean;
  visited: boolean;
  info?: LiveInfo;
  // When set, shown as small caption under the ride name. Useful in flat
  // views (e.g. starred mode) where the parent land header is not visible.
  landName?: string;
  // Drag-and-drop integration. The caller can pass dnd-kit's setNodeRef,
  // transform style, and combined attributes + listeners to make this row
  // sortable without leaking dnd-kit types into the row.
  outerRef?: Ref<HTMLLIElement>;
  outerStyle?: CSSProperties;
  outerProps?: HTMLAttributes<HTMLLIElement>;
  isDragging?: boolean;
  onToggleStar: () => void;
  onToggleVisited: () => void;
}

function formatShowtime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function showtimesLine(info: LiveInfo | undefined, now: number): { text: string; upcoming: boolean } | null {
  if (!info?.showtimes || info.showtimes.length === 0) return null;
  const upcoming = info.showtimes.filter((s) => new Date(s.startTime).getTime() > now);
  if (upcoming.length > 0) {
    return { text: upcoming.map((s) => formatShowtime(s.startTime)).join(' · '), upcoming: true };
  }
  const last = info.showtimes[info.showtimes.length - 1];
  return { text: `Last show: ${formatShowtime(last.startTime)}`, upcoming: false };
}

export function AttractionRow({
  ride,
  starred,
  visited,
  info,
  landName,
  outerRef,
  outerStyle,
  outerProps,
  isDragging,
  onToggleStar,
  onToggleVisited,
}: Props) {
  const effectiveInfo: LiveInfo | undefined =
    info ?? (ride.staticStatus ? { status: ride.staticStatus } : undefined);
  const showLine = showtimesLine(effectiveInfo, Date.now());
  const sortable = outerRef !== undefined || outerProps !== undefined;

  return (
    <li
      ref={outerRef}
      style={outerStyle}
      {...outerProps}
      className={`flex items-center gap-2 border-b border-wdw-line/60 px-3 py-3 last:border-b-0 ${
        sortable ? 'select-none' : ''
      } ${isDragging ? 'bg-wdw-line/40 shadow-lg ring-1 ring-wdw-accent/40' : ''}`}
    >
      {sortable && (
        <span
          aria-hidden="true"
          className="flex h-9 w-5 shrink-0 flex-col items-center justify-center text-wdw-mute"
          title="Drag to reorder"
        >
          <span className="leading-none">⋮</span>
          <span className="leading-none">⋮</span>
        </span>
      )}

      <button
        type="button"
        aria-label={starred ? 'Unstar attraction' : 'Star attraction'}
        aria-pressed={starred}
        onClick={onToggleStar}
        className="flex h-9 w-9 items-center justify-center rounded-full text-xl transition-colors hover:bg-white/5 active:bg-white/10"
      >
        <span className={starred ? 'text-wdw-accent' : 'text-slate-500'}>{starred ? '★' : '☆'}</span>
      </button>

      <button
        type="button"
        onClick={onToggleVisited}
        aria-pressed={visited}
        aria-label={visited ? 'Mark as not visited' : 'Mark as visited'}
        className="min-w-0 flex-1 text-left"
      >
        <p
          className={`truncate text-sm font-medium ${
            visited ? 'text-slate-500 line-through' : 'text-wdw-ink'
          }`}
        >
          {ride.name}
        </p>
        {landName && (
          <p className="mt-0.5 truncate text-[10px] uppercase tracking-wide text-wdw-mute">
            {landName}
          </p>
        )}
        {showLine && (
          <p
            className={`mt-0.5 truncate text-[11px] ${
              showLine.upcoming ? 'text-sky-300' : 'text-wdw-mute'
            }`}
          >
            {showLine.text}
          </p>
        )}
      </button>

      {effectiveInfo && <LiveBadge info={effectiveInfo} />}
    </li>
  );
}
