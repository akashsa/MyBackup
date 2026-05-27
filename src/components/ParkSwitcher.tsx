import { WDW_PARKS } from '../parks';

interface Props {
  selectedId: number;
  onSelect: (id: number) => void;
}

export function ParkSwitcher({ selectedId, onSelect }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Walt Disney World parks"
      className="flex gap-1 rounded-xl bg-wdw-card p-1 ring-1 ring-wdw-line/60"
    >
      {WDW_PARKS.map((park) => {
        const active = park.id === selectedId;
        return (
          <button
            key={park.id}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onSelect(park.id)}
            className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${
              active
                ? 'bg-slate-700 text-wdw-ink shadow-sm'
                : 'text-wdw-mute hover:bg-white/5'
            }`}
            title={park.name}
          >
            <span className="block sm:hidden">{park.short}</span>
            <span className="hidden sm:block">{park.name}</span>
          </button>
        );
      })}
    </div>
  );
}
