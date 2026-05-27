interface Props {
  waitTime: number;
  isOpen: boolean;
}

export function WaitBadge({ waitTime, isOpen }: Props) {
  if (!isOpen) {
    return (
      <span className="inline-flex min-w-[3.25rem] items-center justify-center rounded-md bg-slate-700/60 px-2 py-1 text-xs font-medium text-slate-300">
        Closed
      </span>
    );
  }
  const tone =
    waitTime < 20
      ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-inset ring-emerald-400/30'
      : waitTime < 45
        ? 'bg-amber-500/20 text-amber-300 ring-1 ring-inset ring-amber-400/30'
        : 'bg-rose-500/20 text-rose-300 ring-1 ring-inset ring-rose-400/30';
  return (
    <span className={`inline-flex min-w-[3.25rem] items-center justify-center rounded-md px-2 py-1 text-xs font-semibold ${tone}`}>
      {waitTime} min
    </span>
  );
}
