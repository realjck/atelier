import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { CategoryPanel, PANEL_TRIGGER_ATTR } from "./components/CategoryPanel";
import { DbFolderButton } from "./components/DbFolderButton";
import { ErrorToast } from "./components/ErrorToast";
import { FilterBar } from "./components/FilterBar";
import { Header } from "./components/Header";
import { ChevronDownIcon, PencilIcon } from "./components/Icons";
import { ProjectModal } from "./components/ProjectModal";
import { ProjectTable } from "./components/ProjectTable";
import { ThemeSwitch } from "./components/ThemeSwitch";
import { filterProjects, moveProject, type Filter } from "./lib/projectList";
import { loadNameEmphasis, saveNameEmphasis } from "./lib/settings";
import { applyTheme, initialTheme, saveTheme, type Theme } from "./lib/theme";
import type { Category, CategoryDraft, Project, ProjectInput } from "./types";

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Project | "new" | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  /** The last theme chosen with the switch, else the OS preference. */
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [emphasis, setEmphasis] = useState(loadNameEmphasis);

  /** Runs an API call, surfacing any rejection in the error toast. */
  const run = useCallback(async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (e) {
      setError(String(e));
    }
  }, []);

  const reload = useCallback(
    () =>
      run(async () => {
        const [p, c] = await Promise.all([api.listProjects(), api.listCategories()]);
        setProjects(p);
        setCategories(c);
      }),
    [run],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    applyTheme(theme);
    run(() => api.setWindowTheme(theme));
  }, [theme, run]);

  const clearError = useCallback(() => setError(null), []);
  const closeModal = useCallback(() => setEditing(null), []);
  const closeCategories = useCallback(() => setCategoriesOpen(false), []);

  function switchEmphasis(on: boolean) {
    saveNameEmphasis(on);
    setEmphasis(on);
  }

  function switchTheme(next: Theme) {
    saveTheme(next);
    setTheme(next);
  }

  function saveCategories(drafts: CategoryDraft[], deleted: number[]) {
    run(async () => {
      await api.saveCategories(drafts, deleted);
      setCategoriesOpen(false);
      // Projects may have lost a deleted category.
      await reload();
    });
  }

  function saveProject(input: ProjectInput) {
    run(async () => {
      if (editing === "new") await api.createProject(input);
      else if (editing) await api.updateProject(editing.id, input);
      setEditing(null);
      await reload();
    });
  }

  /**
   * Reorders against the full list, hidden projects included, since the backend
   * requires every id. Renumbers locally first so the row does not jump back while saving.
   */
  function moveInPriority(movedId: number, targetId: number, place: "before" | "after") {
    const ids = moveProject(projects, movedId, targetId, place);
    setProjects((list) => list.map((p) => ({ ...p, priority: ids.indexOf(p.id) + 1 })));
    run(async () => {
      try {
        await api.reorderProjects(ids);
      } finally {
        await reload();
      }
    });
  }

  function deleteProject() {
    if (!editing || editing === "new") return;
    const id = editing.id;
    run(async () => {
      await api.deleteProject(id);
      setEditing(null);
      await reload();
    });
  }

  return (
    <>
      {/* Inert while the modal is open so keyboard focus cannot reach rows behind it. */}
      <div className="app" inert={editing !== null}>
        <Header
          query={query}
          onQueryChange={setQuery}
          onNewProject={() => setEditing("new")}
          emphasis={emphasis}
          onEmphasisChange={switchEmphasis}
        />
        <div className="toolbar">
          <FilterBar value={filter} onChange={setFilter} />
          <button
            type="button"
            className="btn btn-manage"
            aria-expanded={categoriesOpen}
            {...{ [PANEL_TRIGGER_ATTR]: "" }}
            onClick={() => setCategoriesOpen((o) => !o)}
          >
            <PencilIcon width={15} height={15} />
            Manage Categories
            <ChevronDownIcon width={15} height={15} />
          </button>
          {categoriesOpen && (
            <CategoryPanel categories={categories} onSave={saveCategories} onClose={closeCategories} />
          )}
        </div>
        <ProjectTable
          projects={filterProjects(projects, filter, query, categories)}
          categories={categories}
          onOpen={setEditing}
          onOpenFolder={(path) => run(() => api.openFolder(path))}
          onOpenUrl={(url) => run(() => api.openUrl(url))}
          emphasis={emphasis}
          viewKey={`${filter}|${query}`}
          onMove={moveInPriority}
        />
        <span className="app-version">v{__APP_VERSION__}</span>
        <ThemeSwitch theme={theme} onChange={switchTheme} />
        <DbFolderButton onClick={() => run(api.openDbFolder)} />
      </div>
      {editing && (
        <ProjectModal
          key={editing === "new" ? "new" : editing.id}
          project={editing === "new" ? null : editing}
          categories={categories}
          onSave={saveProject}
          onDelete={deleteProject}
          onClose={closeModal}
        />
      )}
      {error && <ErrorToast message={error} onClose={clearError} />}
    </>
  );
}

export default App;
