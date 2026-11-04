import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { sortProjects, type SortDir, type SortKey } from "../lib/projectList";
import { detectProvider } from "../lib/repo";
import { stateMeta } from "../lib/states";
import type { Category, Project } from "../types";
import { GitIcon, GithubIcon, GitlabIcon, SortIcon } from "./Icons";
import { Pill } from "./Pill";

interface ProjectTableProps {
  projects: Project[];
  categories: Category[];
  onOpen: (project: Project) => void;
  onOpenFolder: (path: string) => void;
  onOpenUrl: (url: string) => void;
}

/**
 * Fixed table layout: the table never scrolls sideways, cells truncate instead.
 * Columns with predictable content get fixed widths; Path takes what is left.
 */
const COLUMNS: { key: SortKey; label: string; width?: string }[] = [
  { key: "name", label: "Name", width: "22%" },
  { key: "category", label: "Category", width: "13%" },
  { key: "created", label: "Created", width: "130px" },
  { key: "state", label: "State", width: "15%" },
  { key: "path", label: "Path" },
  { key: "repo", label: "Repo", width: "84px" },
  { key: "status", label: "Status", width: "112px" },
];

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return dateFormat.format(new Date(y, m - 1, d));
}

const PROVIDER_ICONS = { github: GithubIcon, gitlab: GitlabIcon, git: GitIcon };

export function ProjectTable({ projects, categories, onOpen, onOpenFolder, onOpenUrl }: ProjectTableProps) {
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "created", dir: "desc" });
  const rows = sortProjects(projects, sort.key, sort.dir, categories);

  function toggleSort(key: SortKey) {
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));
  }

  /** Runs a link action without also opening the row's edit modal. */
  const link = (action: () => void) => (e: MouseEvent) => {
    e.stopPropagation();
    action();
  };

  function onRowKey(e: KeyboardEvent, project: Project) {
    if (e.target === e.currentTarget && e.key === "Enter") onOpen(project);
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <colgroup>
          {COLUMNS.map((col) => (
            <col key={col.key} style={{ width: col.width }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                aria-sort={sort.key === col.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
              >
                <button type="button" className="th-btn" onClick={() => toggleSort(col.key)}>
                  <span className="th-label">{col.label}</span>
                  <SortIcon className={sort.key === col.key ? "sort-active" : undefined} />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td className="empty" colSpan={COLUMNS.length}>
                No projects yet
              </td>
            </tr>
          )}
          {rows.map((p) => {
            const category = categories.find((c) => c.id === p.categoryId);
            const state = stateMeta(p.state);
            const provider = detectProvider(p.repoUrl);
            const ProviderIcon = provider ? PROVIDER_ICONS[provider] : null;
            return (
              <tr key={p.id} className="row" tabIndex={0} onClick={() => onOpen(p)} onKeyDown={(e) => onRowKey(e, p)}>
                <td className="cell-name" title={p.name}>
                  {p.name}
                </td>
                <td>
                  <div className="cell-box">{category && <Pill color={category.color} label={category.name} />}</div>
                </td>
                <td className="cell-muted">{formatDate(p.created)}</td>
                <td>
                  <div className="cell-box">
                    <Pill color={state.color} label={state.label} />
                  </div>
                </td>
                <td>
                  {p.localPath && (
                    <button type="button" className="link-btn cell-path" title={p.localPath} onClick={link(() => onOpenFolder(p.localPath!))}>
                      {p.localPath}
                    </button>
                  )}
                </td>
                <td>
                  {ProviderIcon && (
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Open repository"
                      title={p.repoUrl!}
                      onClick={link(() => onOpenUrl(p.repoUrl!))}
                    >
                      <ProviderIcon />
                    </button>
                  )}
                </td>
                <td>
                  {p.prodUrl ? (
                    <button type="button" className="link-btn status status-online" title={p.prodUrl} onClick={link(() => onOpenUrl(p.prodUrl!))}>
                      <span className="dot" />
                      Online
                    </button>
                  ) : (
                    <span className="status status-offline">
                      <span className="dot" />
                      Offline
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
