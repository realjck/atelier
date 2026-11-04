import { invoke } from "@tauri-apps/api/core";
import type { Category, CategoryDraft, Project, ProjectInput } from "./types";

/** Typed wrappers around the Rust commands. Rejections carry the error message as a string. */
export const api = {
  listProjects: () => invoke<Project[]>("list_projects"),
  createProject: (input: ProjectInput) => invoke<Project>("create_project", { input }),
  updateProject: (id: number, input: ProjectInput) => invoke<Project>("update_project", { id, input }),
  deleteProject: (id: number) => invoke<void>("delete_project", { id }),
  listCategories: () => invoke<Category[]>("list_categories"),
  saveCategories: (drafts: CategoryDraft[], deleted: number[]) =>
    invoke<Category[]>("save_categories", { drafts, deleted }),
  openFolder: (path: string) => invoke<void>("open_folder", { path }),
  openUrl: (url: string) => invoke<void>("open_url", { url }),
  openDbFolder: () => invoke<void>("open_db_folder"),
};
