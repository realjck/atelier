import { describe, expect, it } from "vitest";
import type { Category, Project } from "../types";
import { dropIndex, edgeScrollSpeed, filterProjects, moveProject, nameEmphasis, sortProjects } from "./projectList";

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
    priority: id,
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

describe("moveProject", () => {
  // Priorities 1..4 in id order, shuffled to check the input order does not matter.
  const all = [projects[2], projects[0], projects[3], projects[1]];

  it("moves_before_the_target", () => {
    expect(moveProject(all, 4, 2, "before")).toEqual([1, 4, 2, 3]);
  });
  it("moves_after_the_target", () => {
    expect(moveProject(all, 1, 3, "after")).toEqual([2, 3, 1, 4]);
  });
  it("keeps_hidden_projects_in_their_relative_order", () => {
    // Dropping 4 just after 1 when 2 and 3 are filtered out.
    expect(moveProject(all, 4, 1, "after")).toEqual([1, 4, 2, 3]);
  });
});

describe("sortProjects by priority", () => {
  it("sorts_by_priority_both_ways", () => {
    const shuffled = [projects[2], projects[0], projects[3], projects[1]];
    expect(ids(sortProjects(shuffled, "priority", "asc", categories))).toEqual([1, 2, 3, 4]);
    expect(ids(sortProjects(shuffled, "priority", "desc", categories))).toEqual([4, 3, 2, 1]);
  });
});

describe("dropIndex", () => {
  const centers = [25, 75, 125, 175];
  it("stays_in_place_for_small_moves", () => {
    expect(dropIndex(centers, 1, 90)).toBe(1);
  });
  it("moves_up_once_past_a_row_center", () => {
    expect(dropIndex(centers, 2, 70)).toBe(1);
    expect(dropIndex(centers, 2, -40)).toBe(0);
  });
  it("moves_down_once_past_a_row_center", () => {
    expect(dropIndex(centers, 0, 80)).toBe(1);
    expect(dropIndex(centers, 0, 500)).toBe(3);
  });
});

describe("edgeScrollSpeed", () => {
  // Visible list area from y=100 to y=600.
  it("is_zero_away_from_the_edges", () => {
    expect(edgeScrollSpeed(350, 100, 600)).toBe(0);
  });
  it("scrolls_up_near_the_top_and_down_near_the_bottom", () => {
    expect(edgeScrollSpeed(110, 100, 600)).toBeLessThan(0);
    expect(edgeScrollSpeed(590, 100, 600)).toBeGreaterThan(0);
  });
  it("is_faster_closer_to_the_edge_and_capped_beyond_it", () => {
    expect(edgeScrollSpeed(590, 100, 600)).toBeGreaterThan(edgeScrollSpeed(570, 100, 600));
    expect(edgeScrollSpeed(700, 100, 600)).toBe(edgeScrollSpeed(600, 100, 600));
  });
});

describe("nameEmphasis", () => {
  it("is_largest_and_boldest_for_priority_one", () => {
    expect(nameEmphasis(1)).toEqual({ fontSize: 20, fontWeight: 700 });
  });
  it("decreases_with_priority", () => {
    for (let p = 1; p < 30; p++) {
      expect(nameEmphasis(p + 1).fontSize).toBeLessThanOrEqual(nameEmphasis(p).fontSize);
      expect(nameEmphasis(p + 1).fontWeight).toBeLessThanOrEqual(nameEmphasis(p).fontWeight);
    }
    expect(nameEmphasis(2).fontSize).toBeLessThan(nameEmphasis(1).fontSize);
  });
  it("never_goes_below_a_readable_floor", () => {
    expect(nameEmphasis(500)).toEqual({ fontSize: 14, fontWeight: 400 });
  });
});
