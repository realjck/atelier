import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Category, Project } from "../types";
import { ProjectTable } from "./ProjectTable";

const categories: Category[] = [{ id: 1, name: "Pro", color: "#3b82f6" }];

const online: Project = {
  id: 1,
  name: "Portfolio site redesign",
  categoryId: 1,
  created: "2025-04-12",
  state: "in_progress",
  localPath: "/projects/portfolio",
  repoUrl: "https://github.com/me/portfolio",
  prodUrl: "https://example.com",
  priority: 1,
};

const offline: Project = {
  ...online,
  id: 2,
  name: "Api",
  categoryId: null,
  created: "2025-04-10",
  state: "draft",
  localPath: null,
  repoUrl: null,
  prodUrl: null,
  priority: 2,
};

function setup(projects: Project[] = [online, offline]) {
  const handlers = { onOpen: vi.fn(), onOpenFolder: vi.fn(), onOpenUrl: vi.fn() };
  render(<ProjectTable projects={projects} categories={categories} {...handlers} />);
  return handlers;
}

const rowNames = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0].textContent);

describe("ProjectTable", () => {
  it("renders the formatted date, category and state pills", () => {
    setup();
    expect(screen.getByText("Apr 12, 2025")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("link_clicks_do_not_open_modal", async () => {
    const h = setup();
    await userEvent.click(screen.getByRole("button", { name: "/projects/portfolio" }));
    expect(h.onOpenFolder).toHaveBeenCalledWith("/projects/portfolio");
    await userEvent.click(screen.getByRole("button", { name: /open repository/i }));
    expect(h.onOpenUrl).toHaveBeenCalledWith("https://github.com/me/portfolio");
    await userEvent.click(screen.getByRole("button", { name: /online/i }));
    expect(h.onOpenUrl).toHaveBeenCalledWith("https://example.com");
    expect(h.onOpen).not.toHaveBeenCalled();

    await userEvent.click(screen.getByText("Portfolio site redesign"));
    expect(h.onOpen).toHaveBeenCalledWith(online);
  });

  it("offline_status_is_not_a_link", () => {
    setup([offline]);
    expect(screen.getByText("Offline")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /offline/i })).toBeNull();
  });

  it("header_click_sorts", async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: "Name" }));
    expect(rowNames()).toEqual(["Api", "Portfolio site redesign"]);
    await userEvent.click(screen.getByRole("button", { name: "Name" }));
    expect(rowNames()).toEqual(["Portfolio site redesign", "Api"]);
  });

  it("shows an empty state", () => {
    setup([]);
    expect(screen.getByText("No projects yet")).toBeInTheDocument();
  });
});
