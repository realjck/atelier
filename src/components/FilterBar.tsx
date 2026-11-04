import type { Filter } from "../lib/projectList";
import { STATES } from "../lib/states";
import { GridIcon } from "./Icons";

const CHIPS: { id: Filter; label: string; color?: string }[] = [
  { id: "all", label: "All" },
  { id: "online", label: "Online", color: "var(--online)" },
  ...STATES.map((s) => ({ id: s.id, label: s.label, color: s.color })),
];

export function FilterBar({ value, onChange }: { value: Filter; onChange: (filter: Filter) => void }) {
  return (
    <div className="filters" role="group" aria-label="Filter projects">
      {CHIPS.map((chip) => (
        <button
          key={chip.id}
          type="button"
          className="chip"
          aria-pressed={value === chip.id}
          onClick={() => onChange(chip.id)}
        >
          {chip.color ? <span className="dot" style={{ background: chip.color }} /> : <GridIcon />}
          {chip.label}
        </button>
      ))}
    </div>
  );
}
