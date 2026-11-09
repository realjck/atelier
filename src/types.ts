export type StateId = "idea" | "draft" | "in_progress" | "on_hold" | "completed" | "archived";

export interface Category {
  id: number;
  name: string;
  color: string;
}

/** A category as edited in the Manage Categories panel; `id` is null for new ones. */
export interface CategoryDraft {
  id: number | null;
  name: string;
  color: string;
}

export interface Project {
  id: number;
  name: string;
  categoryId: number | null;
  /** YYYY-MM-DD */
  created: string;
  state: StateId;
  localPath: string | null;
  repoUrl: string | null;
  prodUrl: string | null;
  /** 1-based rank, unique across all projects; changed only by reordering. */
  priority: number;
}

export type ProjectInput = Omit<Project, "id" | "priority">;
