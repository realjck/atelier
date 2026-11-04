import { describe, expect, it } from "vitest";
import type { Category, Project } from "../types";
import { filterProjects, sortProjects } from "./projectList";

const categories: Category[] = [
  { id: 1, name: "Pro", color: "#3b82f6" },
  { id: 2, name: "Travel", color: "#a855f7" },
];

function project(id: number, patch: Partial<Project>): Project {
  return {
    id,
    name: `P${id}`,
    categoryId: null,
    created: "2025-04-01",
    state: "draft",
    localPath: null,
    repoUrl: null,
    prodUrl: null,
    ...patch,
  };
}

const projects: Project[] = [
  project(1, { name: "Portfolio", state: "in_progress", prodUrl: "https://a.com", categoryId: 1 }),
  project(2, { name: "Old thing", state: "archived", prodUrl: "https://b.com" }),
  project(3, { name: "Japan trip", state: "draft", localPath: "/projects/home-dash", categoryId: 2 }),
  project(4, { name: "api", state: "completed" }),
];

const ids = (list: Project[]) => list.map((p) => p.id);

describe("filterProjects", () => {
  it("all_hides_archived", () => {
    expect(ids(filterProjects(projects, "all", "", categories))).toEqual([1, 3, 4]);
  });
  it("archived_shows_only_archived", () => {
    expect(ids(filterProjects(projects, "archived", "", categories))).toEqual([2]);
  });
  it("online_excludes_archived_and_offline", () => {
    expect(ids(filterProjects(projects, "online", "", categories))).toEqual([1]);
  });
  it("state_filter_matches_state", () => {
    expect(ids(filterProjects(projects, "completed", "", categories))).toEqual([4]);
  });
  it("search_is_case_insensitive_across_fields", () => {
    expect(ids(filterProjects(projects, "all", "PORT", categories))).toEqual([1]);
    expect(ids(filterProjects(projects, "all", "projects/home", categories))).toEqual([3]);
    expect(ids(filterProjects(projects, "all", "travel", categories))).toEqual([3]);
    expect(ids(filterProjects(projects, "all", "  ", categories))).toEqual([1, 3, 4]);
  });
});

describe("sortProjects", () => {
  it("sorts by name ignoring case", () => {
    expect(ids(sortProjects(projects, "name", "asc", categories))).toEqual([4, 3, 2, 1]);
  });
  it("sorts by state in lifecycle order", () => {
    expect(ids(sortProjects(projects, "state", "asc", categories))).toEqual([3, 1, 4, 2]);
  });
  it("desc reverses", () => {
    expect(ids(sortProjects(projects, "name", "desc", categories))).toEqual([1, 2, 3, 4]);
  });
  it("puts projects without a category last", () => {
    expect(ids(sortProjects(projects, "category", "asc", categories))).toEqual([1, 3, 2, 4]);
  });
  it("status puts online first on asc", () => {
    expect(ids(sortProjects(projects, "status", "asc", categories)).slice(0, 2)).toEqual([1, 2]);
  });
});
