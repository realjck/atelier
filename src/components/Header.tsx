import { EmphasisSwitch } from "./EmphasisSwitch";
import { Logo } from "./Logo";
import { PlusIcon, SearchIcon } from "./Icons";

interface HeaderProps {
  query: string;
  onQueryChange: (query: string) => void;
  onNewProject: () => void;
  emphasis: boolean;
  onEmphasisChange: (on: boolean) => void;
}

export function Header({ query, onQueryChange, onNewProject, emphasis, onEmphasisChange }: HeaderProps) {
  return (
    <header className="header">
      <div className="brand">
        <Logo size={56} />
        <h1 className="brand-name">Atelier</h1>
      </div>
      <div className="header-actions">
        <EmphasisSwitch on={emphasis} onChange={onEmphasisChange} />
        <label className="search">
          <SearchIcon />
          <input
            type="search"
            placeholder="Search..."
            aria-label="Search projects"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </label>
        <button type="button" className="btn btn-primary btn-cta" onClick={onNewProject}>
          <PlusIcon />
          New Project
        </button>
      </div>
    </header>
  );
}
