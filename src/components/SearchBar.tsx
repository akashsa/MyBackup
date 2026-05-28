interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function SearchBar({ value, onChange }: Props) {
  return (
    <div className="relative">
      <input
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="Search attractions…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-wdw-card py-2 pl-9 pr-9 text-sm text-wdw-ink ring-1 ring-wdw-line/60 placeholder:text-wdw-mute focus:outline-none focus:ring-2 focus:ring-wdw-accent/40"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-wdw-mute"
      >
        🔍
      </span>
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-1 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full text-wdw-mute hover:bg-white/5 active:bg-white/10"
        >
          ✕
        </button>
      )}
    </div>
  );
}
