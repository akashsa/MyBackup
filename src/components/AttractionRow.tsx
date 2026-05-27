import type { Ride, WaitInfo } from '../types';
import { WaitBadge } from './WaitBadge';

interface Props {
  ride: Ride;
  starred: boolean;
  visited: boolean;
  waitInfo?: WaitInfo;
  onToggleStar: () => void;
  onToggleVisited: () => void;
}

export function AttractionRow({
  ride,
  starred,
  visited,
  waitInfo,
  onToggleStar,
  onToggleVisited,
}: Props) {
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
      </button>

      {waitInfo && <WaitBadge info={waitInfo} />}
    </li>
  );
}
