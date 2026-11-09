import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { api } from "./api";
import type { Project } from "./types";

vi.mock("./api", () => ({
  api: {
    listProjects: vi.fn(),
    listCategories: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    reorderProjects: vi.fn(),
    saveCategories: vi.fn(),
    openFolder: vi.fn(),
    openUrl: vi.fn(),
    openDbFolder: vi.fn(),
  },
}));

const base: Omit<Project, "id" | "name" | "priority"> = {
  categoryId: null,
  created: "2025-04-12",
  state: "draft",
  localPath: null,
  repoUrl: null,
  prodUrl: null,
};
const alpha: Project = { ...base, id: 1, name: "Alpha", priority: 1 };
const beta: Project = { ...base, id: 2, name: "Beta", priority: 2 };

beforeEach(() => {
  vi.mocked(api.listProjects).mockResolvedValue([alpha, beta]);
  vi.mocked(api.listCategories).mockResolvedValue([]);
  vi.mocked(api.updateProject).mockResolvedValue(alpha);
});

describe("App", () => {
  it("renders the app name", async () => {
    render(<App />);
    expect(screen.getByText("Atelier")).toBeInTheDocument();
    expect(await screen.findByText("Alpha")).toBeInTheDocument();
  });

  it("makes the page behind an open modal inert", async () => {
    render(<App />);
    await userEvent.click(await screen.findByText("Alpha"));
    expect(screen.getByRole("heading", { name: "Edit Project" })).toBeInTheDocument();
    expect(screen.getByText("Beta").closest("[inert]")).not.toBeNull();
  });

  it("saves edits to the project that was opened, then reloads", async () => {
    render(<App />);
    await userEvent.click(await screen.findByText("Alpha"));
    const name = screen.getByLabelText("Project name");
    await userEvent.clear(name);
    await userEvent.type(name, "Alpha 2");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(api.updateProject).toHaveBeenCalledWith(1, expect.objectContaining({ name: "Alpha 2" }));
    expect(screen.queryByRole("heading", { name: "Edit Project" })).toBeNull();
    expect(api.listProjects).toHaveBeenCalledTimes(2);
  });

  it("keeps the modal open and shows the error when saving fails", async () => {
    vi.mocked(api.updateProject).mockRejectedValueOnce("Project name is required");
    render(<App />);
    await userEvent.click(await screen.findByText("Alpha"));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Project name is required");
    expect(screen.getByRole("heading", { name: "Edit Project" })).toBeInTheDocument();
  });

  it("persists a drag reorder and renumbers rows right away", async () => {
    const archived: Project = { ...base, id: 3, name: "Gamma", state: "archived", priority: 3 };
    vi.mocked(api.listProjects).mockResolvedValue([alpha, beta, archived]);
    vi.mocked(api.reorderProjects).mockReturnValue(new Promise(() => {}));
    render(<App />);
    await userEvent.click(await screen.findByRole("button", { name: "#" }));
    const alphaRow = screen.getByText("Alpha").closest("tr")!;
    alphaRow.getBoundingClientRect = () => ({ top: 100, height: 50 }) as DOMRect;
    document.elementFromPoint = () => alphaRow;
    const betaRow = screen.getByText("Beta").closest("tr")!;
    fireEvent.pointerDown(within(betaRow).getByRole("button", { name: /drag to reorder/i }), { button: 0 });
    fireEvent.pointerMove(window, { clientY: 110 });
    fireEvent.pointerUp(window);

    // Hidden (archived) projects must be part of the new order too.
    expect(api.reorderProjects).toHaveBeenCalledWith([2, 1, 3]);
    expect(within(screen.getByText("Beta").closest("tr")!).getAllByRole("cell")[0]).toHaveTextContent("1");
  });
});
