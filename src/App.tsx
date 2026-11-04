import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { DbFolderButton } from "./components/DbFolderButton";
import { ErrorToast } from "./components/ErrorToast";
import { FilterBar } from "./components/FilterBar";
import { Header } from "./components/Header";
import { ProjectModal } from "./components/ProjectModal";
import { ProjectTable } from "./components/ProjectTable";
import { filterProjects, type Filter } from "./lib/projectList";
import type { Category, Project, ProjectInput } from "./types";

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Project | "new" | null>(null);

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

  const clearError = useCallback(() => setError(null), []);
  const closeModal = useCallback(() => setEditing(null), []);

  function saveProject(input: ProjectInput) {
    run(async () => {
      if (editing === "new") await api.createProject(input);
      else if (editing) await api.updateProject(editing.id, input);
      setEditing(null);
      await reload();
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
    <div className="app">
      <Header query={query} onQueryChange={setQuery} onNewProject={() => setEditing("new")} />
      <div className="toolbar">
        <FilterBar value={filter} onChange={setFilter} />
      </div>
      <ProjectTable
        projects={filterProjects(projects, filter, query, categories)}
        categories={categories}
        onOpen={setEditing}
        onOpenFolder={(path) => run(() => api.openFolder(path))}
        onOpenUrl={(url) => run(() => api.openUrl(url))}
      />
      <DbFolderButton onClick={() => run(api.openDbFolder)} />
      {editing && (
        <ProjectModal
          project={editing === "new" ? null : editing}
          categories={categories}
          onSave={saveProject}
          onDelete={deleteProject}
          onClose={closeModal}
        />
      )}
      {error && <ErrorToast message={error} onClose={clearError} />}
    </div>
  );
}

export default App;
