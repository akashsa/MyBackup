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
  // When defined, render an up / down arrow. Disabled state if undefined.
  onMoveUp?: () => void;
  onMoveDown?: () => void;
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
  onMoveUp,
  onMoveDown,
  onToggleStar,
  onToggleVisited,
}: Props) {
  const effectiveInfo: LiveInfo | undefined =
    info ?? (ride.staticStatus ? { status: ride.staticStatus } : undefined);
  const showLine = showtimesLine(effectiveInfo, Date.now());
  const showReorder = onMoveUp !== undefined || onMoveDown !== undefined;

  return (
    <li className="flex items-center gap-2 border-b border-wdw-line/60 px-3 py-3 last:border-b-0">
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

      {showReorder && (
        <div className="flex flex-col">
          <button
            type="button"
            aria-label="Move up"
            onClick={onMoveUp}
            disabled={!onMoveUp}
            className="flex h-5 w-7 items-center justify-center rounded text-xs text-wdw-mute hover:bg-white/5 active:bg-white/10 disabled:opacity-30"
          >
            ▲
          </button>
          <button
            type="button"
            aria-label="Move down"
            onClick={onMoveDown}
            disabled={!onMoveDown}
            className="flex h-5 w-7 items-center justify-center rounded text-xs text-wdw-mute hover:bg-white/5 active:bg-white/10 disabled:opacity-30"
          >
            ▼
          </button>
        </div>
      )}
    </li>
  );
}
