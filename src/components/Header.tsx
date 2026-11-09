import { Logo } from "./Logo";
import { PlusIcon, SearchIcon } from "./Icons";

interface HeaderProps {
  query: string;
  onQueryChange: (query: string) => void;
  onNewProject: () => void;
}

export function Header({ query, onQueryChange, onNewProject }: HeaderProps) {
  return (
    <header className="header">
      <div className="brand">
        <Logo size={56} />
        <div className="brand-title">
          <h1 className="brand-name">Atelier</h1>
          <span className="brand-version">v{__APP_VERSION__}</span>
        </div>
      </div>
      <div className="header-actions">
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
