import type { Category, Project, StateId } from "../types";
import { STATES } from "./states";

export type Filter = "all" | "online" | StateId;
export type SortKey = "name" | "category" | "created" | "state" | "path" | "repo" | "status";
export type SortDir = "asc" | "desc";

export function filterProjects(
  projects: Project[],
  filter: Filter,
  query: string,
  categories: Category[],
): Project[] {
  const needle = query.trim().toLowerCase();
  return projects.filter((p) => matchesFilter(p, filter) && (!needle || matchesQuery(p, needle, categories)));
}

function matchesFilter(p: Project, filter: Filter): boolean {
  if (filter === "archived") return p.state === "archived";
  if (p.state === "archived") return false;
  if (filter === "all") return true;
  if (filter === "online") return p.prodUrl !== null;
  return p.state === filter;
}

function matchesQuery(p: Project, needle: string, categories: Category[]): boolean {
  const category = categories.find((c) => c.id === p.categoryId)?.name;
  return [p.name, p.localPath, category].some((field) => field?.toLowerCase().includes(needle));
}

/** Stable sort; empty values always go last regardless of direction. */
export function sortProjects(
  projects: Project[],
  key: SortKey,
  dir: SortDir,
  categories: Category[],
): Project[] {
  const value = sortValue(key, categories);
  const sign = dir === "asc" ? 1 : -1;
  return [...projects].sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    if (va === null || vb === null) return va === vb ? 0 : va === null ? 1 : -1;
    return sign * (typeof va === "number" ? va - (vb as number) : collator.compare(va, vb as string));
  });
}

const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

function sortValue(key: SortKey, categories: Category[]): (p: Project) => string | number | null {
  switch (key) {
    case "name":
      return (p) => p.name;
    case "category":
      return (p) => categories.find((c) => c.id === p.categoryId)?.name ?? null;
    case "created":
      return (p) => p.created;
    case "state":
      return (p) => STATES.findIndex((s) => s.id === p.state);
    case "path":
      return (p) => p.localPath;
    case "repo":
      return (p) => p.repoUrl;
    case "status":
      return (p) => (p.prodUrl ? 0 : 1);
  }
}
