import { useEffect, useState, type FormEvent } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { detectProvider } from "../lib/repo";
import { STATES } from "../lib/states";
import type { Category, Project, ProjectInput, StateId } from "../types";
import { CloseIcon, FolderIcon, GitIcon, GithubIcon, GitlabIcon, GlobeIcon } from "./Icons";

interface ProjectModalProps {
  /** null to create a new project. */
  project: Project | null;
  categories: Category[];
  onSave: (input: ProjectInput) => void;
  onDelete: () => void;
  onClose: () => void;
}

/** Today's local date as YYYY-MM-DD. */
export function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface FormState {
  name: string;
  categoryId: string;
  created: string;
  state: StateId;
  localPath: string;
  repoUrl: string;
  prodUrl: string;
}

function initialForm(project: Project | null): FormState {
  return {
    name: project?.name ?? "",
    categoryId: project?.categoryId != null ? String(project.categoryId) : "",
    created: project?.created ?? todayIso(),
    state: project?.state ?? "draft",
    localPath: project?.localPath ?? "",
    repoUrl: project?.repoUrl ?? "",
    prodUrl: project?.prodUrl ?? "",
  };
}

const orNull = (value: string) => value.trim() || null;

const PROVIDER_ICONS = { github: GithubIcon, gitlab: GitlabIcon, git: GitIcon };

export function ProjectModal({ project, categories, onSave, onDelete, onClose }: ProjectModalProps) {
  const [form, setForm] = useState(() => initialForm(project));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canSave = form.name.trim() !== "" && form.created !== "";
  const RepoIcon = PROVIDER_ICONS[detectProvider(form.repoUrl) ?? "git"];

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    onSave({
      name: form.name.trim(),
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      created: form.created,
      state: form.state,
      localPath: orNull(form.localPath),
      repoUrl: orNull(form.repoUrl),
      prodUrl: orNull(form.prodUrl),
    });
  }

  async function browse() {
    const folder = await open({ directory: true, multiple: false });
    if (folder) set("localPath", folder);
  }

  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" role="dialog" aria-modal="true" aria-labelledby="project-modal-title" onSubmit={submit}>
        <div className="modal-head">
          <h2 id="project-modal-title">{project ? "Edit Project" : "New Project"}</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <input
          className="input input-title"
          aria-label="Project name"
          placeholder="Project name"
          autoFocus
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />

        <div className="field-row">
          <label className="field">
            <span className="field-label">Category</span>
            <select className="input" value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Created</span>
            <input className="input" type="date" required value={form.created} onChange={(e) => set("created", e.target.value)} />
          </label>
        </div>

        <div className="field">
          <span className="field-label" id="state-label">
            State
          </span>
          <div className="state-pills" role="group" aria-labelledby="state-label">
            {STATES.map((s) => (
              <button
                key={s.id}
                type="button"
                className="state-pill"
                aria-pressed={form.state === s.id}
                style={{ ["--pill-color" as string]: s.color }}
                onClick={() => set("state", s.id)}
              >
                <span className="dot" style={{ background: s.color }} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <h3 className="section-title">Links</h3>
        <div className="input-icon">
          <FolderIcon />
          <input
            className="input"
            aria-label="Local path"
            placeholder="Folder on this computer"
            value={form.localPath}
            onChange={(e) => set("localPath", e.target.value)}
          />
          <button type="button" className="btn btn-inline" onClick={browse}>
            Browse
          </button>
        </div>
        <div className="input-icon">
          <RepoIcon width={18} height={18} />
          <input
            className="input"
            aria-label="Repository URL"
            placeholder="Repository URL (GitHub, GitLab...)"
            value={form.repoUrl}
            onChange={(e) => set("repoUrl", e.target.value)}
          />
        </div>
        <div className="input-icon">
          <GlobeIcon />
          <input
            className="input"
            aria-label="Production URL"
            placeholder="Production URL"
            value={form.prodUrl}
            onChange={(e) => set("prodUrl", e.target.value)}
          />
        </div>
        <p className="hint">A project with a production URL is shown as Online.</p>

        <div className="modal-foot">
          <div>
            {project &&
              (confirmDelete ? (
                <span className="confirm">
                  Delete this project?
                  <button type="button" className="btn btn-danger" onClick={onDelete}>
                    Yes, delete
                  </button>
                  <button type="button" className="btn" onClick={() => setConfirmDelete(false)}>
                    No
                  </button>
                </span>
              ) : (
                <button type="button" className="text-danger" onClick={() => setConfirmDelete(true)}>
                  Delete project
                </button>
              ))}
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!canSave}>
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
