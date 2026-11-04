import { useEffect, useRef, useState } from "react";
import type { Category, CategoryDraft } from "../types";
import { CloseIcon, PlusIcon, TrashIcon } from "./Icons";

export const PALETTE = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#22c55e",
  "#a855f7",
  "#eab308",
  "#14b8a6",
  "#ef4444",
  "#64748b",
];

interface CategoryPanelProps {
  categories: Category[];
  onSave: (drafts: CategoryDraft[], deleted: number[]) => void;
  onClose: () => void;
}

interface Row extends CategoryDraft {
  key: number;
}

/** Clicks on elements carrying this attribute (the panel's toggle) do not count as outside clicks. */
export const PANEL_TRIGGER_ATTR = "data-category-trigger";

export function CategoryPanel({ categories, onSave, onClose }: CategoryPanelProps) {
  const [rows, setRows] = useState<Row[]>(() => categories.map((c) => ({ ...c, key: c.id })));
  const [deleted, setDeleted] = useState<number[]>([]);
  const [picking, setPicking] = useState<number | null>(null);
  const nextKey = useRef(-1);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastInput = useRef<HTMLInputElement>(null);
  const [focusLast, setFocusLast] = useState(false);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const target = e.target as Element;
      if (panelRef.current?.contains(target) || target.closest(`[${PANEL_TRIGGER_ATTR}]`)) return;
      onClose();
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    if (focusLast) {
      lastInput.current?.focus();
      setFocusLast(false);
    }
  }, [focusLast]);

  const update = (key: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  function remove(row: Row) {
    setRows((rs) => rs.filter((r) => r.key !== row.key));
    if (row.id !== null) setDeleted((d) => [...d, row.id as number]);
  }

  function add() {
    const color = PALETTE[rows.length % PALETTE.length];
    setRows((rs) => [...rs, { key: nextKey.current--, id: null, name: "", color }]);
    setFocusLast(true);
  }

  const kept = rows.filter((r) => r.id !== null || r.name.trim() !== "");
  const lowerNames = kept.map((r) => r.name.trim().toLowerCase());
  const isDuplicate = (row: Row) => {
    const name = row.name.trim().toLowerCase();
    return name !== "" && lowerNames.filter((n) => n === name).length > 1;
  };
  const hasBlankExisting = kept.some((r) => r.name.trim() === "");
  const canSave = !kept.some(isDuplicate) && !hasBlankExisting;

  function save() {
    onSave(
      kept.map(({ id, name, color }) => ({ id, name: name.trim(), color })),
      deleted,
    );
  }

  return (
    <div className="cat-panel" ref={panelRef} role="dialog" aria-labelledby="cat-panel-title">
      <div className="cat-head">
        <h2 id="cat-panel-title">Manage Categories</h2>
        <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      <ul className="cat-list">
        {rows.map((row, index) => {
          const label = row.name.trim() || "new category";
          return (
            <li key={row.key} className="cat-row">
              <button
                type="button"
                className="cat-swatch"
                aria-label={`Color for ${label}`}
                aria-expanded={picking === row.key}
                style={{ background: row.color }}
                onClick={() => setPicking(picking === row.key ? null : row.key)}
              />
              <input
                ref={index === rows.length - 1 ? lastInput : undefined}
                className="cat-name"
                aria-label="Category name"
                placeholder="Category name"
                value={row.name}
                onChange={(e) => update(row.key, { name: e.target.value })}
              />
              <button type="button" className="icon-btn" aria-label={`Delete ${label}`} onClick={() => remove(row)}>
                <TrashIcon />
              </button>
              {isDuplicate(row) && <span className="cat-error">Name already used</span>}
              {picking === row.key && (
                <div className="palette" role="group" aria-label="Colors">
                  {PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="palette-swatch"
                      aria-label={color}
                      aria-pressed={row.color === color}
                      style={{ background: color }}
                      onClick={() => {
                        update(row.key, { color });
                        setPicking(null);
                      }}
                    />
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <button type="button" className="cat-add" onClick={add}>
        <PlusIcon />
        Add a Category
      </button>

      <div className="cat-actions">
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" disabled={!canSave} onClick={save}>
          Save
        </button>
      </div>
    </div>
  );
}
