import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { dropIndex, edgeScrollSpeed, nameEmphasis, sortProjects, type SortDir, type SortKey } from "../lib/projectList";
import { detectProvider } from "../lib/repo";
import { stateMeta } from "../lib/states";
import type { Category, Project } from "../types";
import { GitIcon, GithubIcon, GitlabIcon, GripIcon, SortDirIcon } from "./Icons";
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

/**
 * A row being dragged. Row centers are measured once, when the press starts;
 * scrolling since then is added back so they stay valid in list coordinates.
 */
interface Drag {
  id: number;
  from: number;
  startY: number;
  pointerY: number;
  startScroll: number;
  scroll: number;
  centers: number[];
  height: number;
}

/**
 * Fixed table layout: the table never scrolls sideways, cells truncate instead.
 * Columns with short, predictable content get fixed widths (see `.col-*` in app.css);
 * Name and Path have none, so they share the remaining space equally.
 */
const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "priority", label: "#" },
  { key: "name", label: "Name" },
  { key: "category", label: "Category" },
  { key: "created", label: "Created" },
  { key: "state", label: "State" },
  { key: "path", label: "Path" },
  { key: "repo", label: "Repo" },
  { key: "status", label: "Status" },
];

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return dateFormat.format(new Date(y, m - 1, d));
}

/** Limits an offset from `origin` so that origin + offset stays within [min, max]. */
function clamp(offset: number, min: number, max: number, origin: number): number {
  return Math.min(Math.max(offset, min - origin), max - origin);
}

const PROVIDER_ICONS ={ github: GithubIcon, gitlab: GitlabIcon, git: GitIcon };

export function ProjectTable({ projects, categories, onOpen, onOpenFolder, onOpenUrl, onMove }: ProjectTableProps) {
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "created", dir: "desc" });
  const [drag, setDrag] = useState<Drag | null>(null);
  const rows = sortProjects(projects, sort.key, sort.dir, categories);
  const reorderable = sort.key === "priority";

  const wrapRef = useRef<HTMLDivElement>(null);
  const pointerY = useRef(0);
  const dragging = drag !== null;

  const offset = drag ? drag.pointerY - drag.startY + drag.scroll - drag.startScroll : 0;
  const to = drag ? dropIndex(drag.centers, drag.from, drag.centers[drag.from] + offset) : -1;
  /** The dragged row is kept between the first and last slots so it cannot stretch the list. */
  const dy = drag ? clamp(offset, drag.centers[0], drag.centers[drag.centers.length - 1], drag.centers[drag.from]) : 0;

  useEffect(() => {
    if (!drag) return;
    function onPointerMove(e: globalThis.PointerEvent) {
      pointerY.current = e.clientY;
      setDrag((d) => d && { ...d, pointerY: e.clientY });
    }
    function onPointerUp() {
      if (drag && to !== drag.from) drop(drag.id, to > drag.from ? "after" : "before");
      setDrag(null);
    }
    const cancel = () => setDrag(null);
    const wrap = wrapRef.current!;
    const onScroll = () => setDrag((d) => d && { ...d, scroll: wrap.scrollTop });
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", cancel);
    wrap.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", cancel);
      wrap.removeEventListener("scroll", onScroll);
    };
  });

  /** Auto-scrolls while the pointer is near the list's top (below the sticky header) or bottom edge. */
  useEffect(() => {
    if (!dragging) return;
    const wrap = wrapRef.current!;
    // The th cells are sticky, not the thead, which scrolls away with the rows.
    const header = wrap.querySelector("th")!;
    let frame = requestAnimationFrame(function step() {
      const speed = edgeScrollSpeed(
        pointerY.current,
        header.getBoundingClientRect().bottom,
        wrap.getBoundingClientRect().bottom,
      );
      if (speed) wrap.scrollTop += speed;
      frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [dragging]);

  /** "Above on screen" means a lower priority number only in ascending order. */
  function drop(movedId: number, onScreen: "before" | "after") {
    const before = (onScreen === "before") === (sort.dir === "asc");
    onMove(movedId, rows[to].id, before ? "before" : "after");
  }

  function startDrag(e: PointerEvent<HTMLElement>, id: number) {
    if (e.button !== 0) return;
    e.preventDefault();
    const tbody = e.currentTarget.closest("tbody")!;
    const rects = [...tbody.querySelectorAll("tr[data-id]")].map((tr) => tr.getBoundingClientRect());
    const from = rows.findIndex((p) => p.id === id);
    const scroll = wrapRef.current!.scrollTop;
    pointerY.current = e.clientY;
    setDrag({
      id,
      from,
      startY: e.clientY,
      pointerY: e.clientY,
      startScroll: scroll,
      scroll,
      centers: rects.map((r) => r.top + r.height / 2),
      height: rects[from].height,
    });
  }

  /** The dragged row follows the pointer; rows between its origin and target shift by one slot. */
  function rowStyle(index: number): CSSProperties | undefined {
    if (!drag) return undefined;
    if (index === drag.from) return { transform: `translateY(${dy}px)` };
    if (drag.from < index && index <= to) return { transform: `translateY(${-drag.height}px)` };
    if (to <= index && index < drag.from) return { transform: `translateY(${drag.height}px)` };
    return undefined;
  }

  /** A new order starts from its first row. */
  function toggleSort(key: SortKey) {
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));
    wrapRef.current!.scrollTop = 0;
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
    <div className="table-wrap" ref={wrapRef}>
      <table className={`table${reorderable ? " table-reorderable" : ""}${drag ? " table-dragging" : ""}`}>
        <colgroup>
          {COLUMNS.map((col) => (
            <col key={col.key} className={`col-${col.key}`} />
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
                  {sort.key === col.key && <SortDirIcon dir={sort.dir} className="sort-active" />}
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
          {rows.map((p, index) => {
            const category = categories.find((c) => c.id === p.categoryId);
            const state = stateMeta(p.state);
            const provider = detectProvider(p.repoUrl);
            const ProviderIcon = provider ? PROVIDER_ICONS[provider] : null;
            return (
              <tr
                key={p.id}
                data-id={p.id}
                className={drag?.id === p.id ? "row row-dragging" : "row"}
                style={rowStyle(index)}
                tabIndex={0}
                onClick={() => onOpen(p)}
                onKeyDown={(e) => onRowKey(e, p)}
              >
                <td className="cell-priority">
                  {reorderable ? (
                    <button
                      type="button"
                      className="grip"
                      aria-label={`Drag to reorder ${p.name}`}
                      onPointerDown={(e) => startDrag(e, p.id)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripIcon />
                      <span className="priority">{p.priority}</span>
                    </button>
                  ) : (
                    <span className="priority">{p.priority}</span>
                  )}
                </td>
                <td className="cell-name" title={p.name} style={nameEmphasis(p.priority)}>
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
