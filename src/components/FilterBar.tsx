export type Filter = 'starred' | 'unvisited';

interface Props {
  filters: Set<Filter>;
  onToggle: (f: Filter) => void;
}

const CHIPS: { id: Filter; label: string }[] = [
  { id: 'starred', label: '★ Starred' },
  { id: 'unvisited', label: 'Unvisited' },
];

export function FilterBar({ filters, onToggle }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {CHIPS.map((chip) => {
        const active = filters.has(chip.id);
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onToggle(chip.id)}
            aria-pressed={active}
            className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors ${
              active
                ? 'bg-wdw-accent/20 text-wdw-accent ring-wdw-accent/40'
                : 'bg-wdw-card text-wdw-mute ring-wdw-line/60 hover:text-wdw-ink'
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
