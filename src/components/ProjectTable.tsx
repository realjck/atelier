import { useEffect, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { sortProjects, type SortDir, type SortKey } from "../lib/projectList";
import { detectProvider } from "../lib/repo";
import { stateMeta } from "../lib/states";
import type { Category, Project } from "../types";
import { GitIcon, GithubIcon, GitlabIcon, GripIcon, SortIcon } from "./Icons";
import { Pill } from "./Pill";

interface ProjectTableProps {
  projects: Project[];
  categories: Category[];
  onOpen: (project: Project) => void;
  onOpenFolder: (path: string) => void;
  onOpenUrl: (url: string) => void;
  /** Asks to move a project just before or after another, in priority order. */
  onMove: (movedId: number, targetId: number, place: "before" | "after") => void;
}

/** A row being dragged, and where it would land relative to the hovered row. */
interface Drag {
  id: number;
  over: { id: number; half: "upper" | "lower" } | null;
}

/**
 * Fixed table layout: the table never scrolls sideways, cells truncate instead.
 * Columns with predictable content get fixed widths; Path takes what is left.
 */
const COLUMNS: { key: SortKey; label: string; width?: string }[] = [
  { key: "priority", label: "#", width: "84px" },
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

export function ProjectTable({ projects, categories, onOpen, onOpenFolder, onOpenUrl, onMove }: ProjectTableProps) {
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "created", dir: "desc" });
  const [drag, setDrag] = useState<Drag | null>(null);
  const rows = sortProjects(projects, sort.key, sort.dir, categories);
  const reorderable = sort.key === "priority";

  useEffect(() => {
    if (!drag) return;
    function onMove(e: globalThis.PointerEvent) {
      const row = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("tr[data-id]");
      if (!row) return;
      const rect = row.getBoundingClientRect();
      const half = e.clientY < rect.top + rect.height / 2 ? "upper" : "lower";
      setDrag((d) => d && { ...d, over: { id: Number(row.dataset.id), half } });
    }
    function onUp() {
      if (drag?.over) drop(drag.id, drag.over.id, drag.over.half);
      setDrag(null);
    }
    const cancel = () => setDrag(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", cancel);
    };
  });

  /** Upper half means "above on screen", which is a lower priority number only in ascending order. */
  function drop(movedId: number, targetId: number, half: "upper" | "lower") {
    if (movedId === targetId) return;
    const before = (half === "upper") === (sort.dir === "asc");
    const neighbor = rows[rows.findIndex((p) => p.id === targetId) + (half === "upper" ? -1 : 1)];
    if (neighbor?.id === movedId) return;
    onMove(movedId, targetId, before ? "before" : "after");
  }

  function startDrag(e: PointerEvent, id: number) {
    if (e.button !== 0) return;
    e.preventDefault();
    setDrag({ id, over: null });
  }

  function rowClass(id: number): string {
    if (!drag) return "row";
    if (drag.id === id) return "row row-dragging";
    if (drag.over?.id === id) return `row drop-${drag.over.half === "upper" ? "above" : "below"}`;
    return "row";
  }

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
      <table className={`table${reorderable ? " table-reorderable" : ""}${drag ? " table-dragging" : ""}`}>
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
                title={col.key === "priority" && reorderable ? "Drag rows to reorder" : undefined}
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
              <tr
                key={p.id}
                data-id={p.id}
                className={rowClass(p.id)}
                tabIndex={0}
                onClick={() => onOpen(p)}
                onKeyDown={(e) => onRowKey(e, p)}
              >
                <td className="cell-priority">
                  {reorderable && (
                    <button
                      type="button"
                      className="grip"
                      aria-label={`Drag to reorder ${p.name}`}
                      onPointerDown={(e) => startDrag(e, p.id)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripIcon />
                    </button>
                  )}
                  <span className="priority">{p.priority}</span>
                </td>
                <td className="cell-name" title={p.name}>
                  {p.name}
                </td>
                <td>
                  <div className="cell-box">{category && <Pill color={category.color} label={category.name} />}</div>
                </td>
                <td className="cell-muted">{formatDate(p.created)}</td>
                <td title={state.label}>
                  <span className="dot" style={{ background: state.color }} />
                  <span className="state-label">{state.label}</span>
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
