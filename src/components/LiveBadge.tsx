import type { LiveInfo } from '../types';

function pillBase(extra: string) {
  return `inline-flex min-w-[3.25rem] items-center justify-center rounded-md px-2 py-1 text-xs font-semibold ${extra}`;
}

const CLOSED_LABELS: Record<string, string> = {
  CLOSED: 'Closed',
  REFURBISHMENT: 'Refurb',
  DOWN: 'Down',
};

export function LiveBadge({ info }: { info: LiveInfo }) {
  // For shows, the "Closed" status just means there's no performance right now —
  // the showtimes list under the row is the more useful signal, so suppress the
  // badge entirely in that case.
  if (info.showtimes && info.showtimes.length > 0) {
    return null;
  }

  const label = CLOSED_LABELS[info.status];
  if (label) {
    return (
      <span className={pillBase('bg-slate-700/60 text-slate-300 font-medium')}>{label}</span>
    );
  }

  if (info.waitTime !== undefined) {
    const w = info.waitTime;
    const tone =
      w < 20
        ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-inset ring-emerald-400/30'
        : w < 45
          ? 'bg-amber-500/20 text-amber-300 ring-1 ring-inset ring-amber-400/30'
          : 'bg-rose-500/20 text-rose-300 ring-1 ring-inset ring-rose-400/30';
    return <span className={pillBase(tone)}>{w} min</span>;
  }

  return null;
}
