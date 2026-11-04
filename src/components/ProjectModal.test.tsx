import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Category, Project } from "../types";
import { ProjectModal, todayIso } from "./ProjectModal";

const dialogOpen = vi.fn();
vi.mock("@tauri-apps/plugin-dialog", () => ({ open: (...args: unknown[]) => dialogOpen(...args) }));

const categories: Category[] = [{ id: 1, name: "Pro", color: "#3b82f6" }];

const existing: Project = {
  id: 7,
  name: "Portfolio",
  categoryId: 1,
  created: "2025-04-12",
  state: "completed",
  localPath: "E:\\projects\\portfolio",
  repoUrl: "https://github.com/me/portfolio",
  prodUrl: "https://example.com",
};

function setup(project: Project | null = null) {
  const handlers = { onSave: vi.fn(), onDelete: vi.fn(), onClose: vi.fn() };
  render(<ProjectModal project={project} categories={categories} {...handlers} />);
  return handlers;
}

const save = () => screen.getByRole("button", { name: "Save" });

describe("ProjectModal", () => {
  it("save_disabled_until_name_filled", async () => {
    setup();
    expect(save()).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Project name"), "   ");
    expect(save()).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Project name"), "A");
    expect(save()).toBeEnabled();
  });

  it("create_submits_input", async () => {
    const h = setup();
    expect(screen.getByRole("heading", { name: "New Project" })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Project name"), "Atelier");
    await userEvent.click(screen.getByRole("button", { name: "In Progress" }));
    await userEvent.click(save());
    expect(h.onSave).toHaveBeenCalledWith({
      name: "Atelier",
      state: "in_progress",
      created: todayIso(),
      categoryId: null,
      localPath: null,
      repoUrl: null,
      prodUrl: null,
    });
  });

  it("edit_prefills_and_shows_delete", () => {
    setup(existing);
    expect(screen.getByRole("heading", { name: "Edit Project" })).toBeInTheDocument();
    expect(screen.getByLabelText("Project name")).toHaveValue("Portfolio");
    expect(screen.getByLabelText("Category")).toHaveValue("1");
    expect(screen.getByLabelText("Created")).toHaveValue("2025-04-12");
    expect(screen.getByRole("button", { name: "Completed" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Production URL")).toHaveValue("https://example.com");
    expect(screen.getByRole("button", { name: "Delete project" })).toBeInTheDocument();
  });

  it("hides delete when creating", () => {
    setup();
    expect(screen.queryByRole("button", { name: "Delete project" })).toBeNull();
  });

  it("delete_requires_confirmation", async () => {
    const h = setup(existing);
    await userEvent.click(screen.getByRole("button", { name: "Delete project" }));
    expect(h.onDelete).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Yes, delete" }));
    expect(h.onDelete).toHaveBeenCalled();
  });

  it("browse_fills_path", async () => {
    dialogOpen.mockResolvedValueOnce("E:\\projects\\x");
    setup();
    await userEvent.click(screen.getByRole("button", { name: "Browse" }));
    expect(dialogOpen).toHaveBeenCalledWith({ directory: true, multiple: false });
    expect(await screen.findByDisplayValue("E:\\projects\\x")).toBeInTheDocument();
  });

  it("repo_icon_follows_url", async () => {
    setup();
    await userEvent.type(screen.getByLabelText("Repository URL"), "https://gitlab.com/me/x");
    expect(screen.getByRole("img", { name: "GitLab" })).toBeInTheDocument();
  });

  it("escape_closes", async () => {
    const h = setup();
    await userEvent.keyboard("{Escape}");
    expect(h.onClose).toHaveBeenCalled();
  });
});
