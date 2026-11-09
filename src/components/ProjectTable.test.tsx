import { fireEvent, render, screen, within } from "@testing-library/react";
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
  const handlers = { onOpen: vi.fn(), onOpenFolder: vi.fn(), onOpenUrl: vi.fn(), onMove: vi.fn() };
  render(<ProjectTable projects={projects} categories={categories} {...handlers} />);
  return handlers;
}

const rowNames = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[1].textContent);

const third: Project = { ...offline, id: 3, name: "Blog", priority: 3 };

const ROW_HEIGHT = 50;

/** Gives each body row a 50px slot, presses the handle of `name` and moves the pointer to `y`. */
function pressAndMove(name: string, y: number) {
  const rows = screen.getAllByRole("row").slice(1);
  rows.forEach((row, i) => {
    row.getBoundingClientRect = () => ({ top: i * ROW_HEIGHT, height: ROW_HEIGHT }) as DOMRect;
  });
  const row = screen.getByText(name).closest("tr")!;
  const center = rows.indexOf(row) * ROW_HEIGHT + ROW_HEIGHT / 2;
  fireEvent.pointerDown(within(row).getByRole("button", { name: /drag to reorder/i }), { button: 0, clientY: center });
  fireEvent.pointerMove(window, { clientY: y });
}

const transformOf = (name: string) => screen.getByText(name).closest("tr")!.style.transform;

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

  it("shows_priority_in_the_first_column", () => {
    setup();
    const cells = within(screen.getByText("Api").closest("tr")!).getAllByRole("cell");
    expect(cells[0]).toHaveTextContent("2");
  });

  it("drag_handles_only_when_sorted_by_priority", async () => {
    setup();
    expect(screen.queryAllByRole("button", { name: /drag to reorder/i })).toHaveLength(0);
    await userEvent.click(screen.getByRole("button", { name: "#" }));
    expect(screen.getAllByRole("button", { name: /drag to reorder/i })).toHaveLength(2);
  });

  it("dragged_row_follows_pointer_and_others_make_room", async () => {
    setup([online, offline, third]);
    await userEvent.click(screen.getByRole("button", { name: "#" }));
    pressAndMove("Blog", 60);
    expect(transformOf("Blog")).toBe("translateY(-65px)");
    expect(transformOf("Api")).toBe("translateY(50px)");
    expect(transformOf("Portfolio site redesign")).toBe("");
  });

  it("drop_above_a_row_places_before_in_ascending_order", async () => {
    const h = setup([online, offline, third]);
    await userEvent.click(screen.getByRole("button", { name: "#" }));
    pressAndMove("Blog", 60);
    fireEvent.pointerUp(window);
    expect(h.onMove).toHaveBeenCalledWith(3, 2, "before");
    expect(transformOf("Api")).toBe("");
    expect(h.onOpen).not.toHaveBeenCalled();
  });

  it("drop_above_a_row_places_after_in_descending_order", async () => {
    const h = setup([online, offline, third]);
    await userEvent.click(screen.getByRole("button", { name: "#" }));
    await userEvent.click(screen.getByRole("button", { name: "#" }));
    expect(rowNames()).toEqual(["Blog", "Api", "Portfolio site redesign"]);
    pressAndMove("Portfolio site redesign", 60);
    fireEvent.pointerUp(window);
    expect(h.onMove).toHaveBeenCalledWith(1, 2, "after");
  });

  it("dropping_in_place_does_not_reorder", async () => {
    const h = setup([online, offline, third]);
    await userEvent.click(screen.getByRole("button", { name: "#" }));
    pressAndMove("Api", 85);
    fireEvent.pointerUp(window);
    expect(h.onMove).not.toHaveBeenCalled();
  });

  it("shows an empty state", () => {
    setup([]);
    expect(screen.getByText("No projects yet")).toBeInTheDocument();
  });
});
