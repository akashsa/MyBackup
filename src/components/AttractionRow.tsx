import type { Ride } from '../api/queueTimes';
import { WaitBadge } from './WaitBadge';

interface Props {
  ride: Ride;
  starred: boolean;
  visited: boolean;
  onToggleStar: () => void;
  onToggleVisited: () => void;
}

export function AttractionRow({ ride, starred, visited, onToggleStar, onToggleVisited }: Props) {
  return (
    <li className="flex items-center gap-3 border-b border-wdw-line/60 px-3 py-3 last:border-b-0">
      <button
        type="button"
        aria-label={starred ? 'Unstar attraction' : 'Star attraction'}
        aria-pressed={starred}
        onClick={onToggleStar}
        className="flex h-9 w-9 items-center justify-center rounded-full text-xl transition-colors hover:bg-white/5 active:bg-white/10"
      >
        <span className={starred ? 'text-wdw-accent' : 'text-slate-500'}>{starred ? '★' : '☆'}</span>
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium ${visited ? 'text-slate-500 line-through' : 'text-wdw-ink'}`}
        >
          {ride.name}
        </p>
      </div>

      <WaitBadge waitTime={ride.wait_time} isOpen={ride.is_open} />

      <button
        type="button"
        aria-label={visited ? 'Mark as not visited' : 'Mark as visited'}
        aria-pressed={visited}
        onClick={onToggleVisited}
        className={`flex h-9 w-9 items-center justify-center rounded-full text-base transition-colors ${
          visited ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500 hover:bg-white/5 active:bg-white/10'
        }`}
      >
        ✓
      </button>
    </li>
  );
}
