import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Category } from "../types";
import { CategoryPanel } from "./CategoryPanel";

const categories: Category[] = [
  { id: 1, name: "Pro", color: "#3b82f6" },
  { id: 2, name: "Dev", color: "#8b5cf6" },
  { id: 3, name: "Mobile", color: "#ec4899" },
];

function setup() {
  const handlers = { onSave: vi.fn(), onClose: vi.fn() };
  const utils = render(<CategoryPanel categories={categories} {...handlers} />);
  return { ...handlers, ...utils };
}

const names = () => screen.getAllByLabelText("Category name").map((i) => (i as HTMLInputElement).value);

describe("CategoryPanel", () => {
  it("lists categories with editable names", () => {
    setup();
    expect(names()).toEqual(["Pro", "Dev", "Mobile"]);
  });

  it("cancel_discards_changes", async () => {
    const h = setup();
    await userEvent.clear(screen.getAllByLabelText("Category name")[0]);
    await userEvent.type(screen.getAllByLabelText("Category name")[0], "Work");
    await userEvent.click(screen.getByRole("button", { name: "Delete Dev" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(h.onSave).not.toHaveBeenCalled();
    expect(h.onClose).toHaveBeenCalled();

    h.unmount();
    setup();
    expect(names()).toEqual(["Pro", "Dev", "Mobile"]);
  });

  it("save_sends_staged_changes", async () => {
    const h = setup();
    const [pro] = screen.getAllByLabelText("Category name");
    await userEvent.clear(pro);
    await userEvent.type(pro, "Work");
    await userEvent.click(screen.getByRole("button", { name: "Delete Dev" }));
    await userEvent.click(screen.getByRole("button", { name: "Add a Category" }));
    await userEvent.type(screen.getAllByLabelText("Category name")[2], "Music");
    await userEvent.click(screen.getByRole("button", { name: "Color for Music" }));
    await userEvent.click(screen.getByRole("button", { name: "#14b8a6" }));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(h.onSave).toHaveBeenCalledWith(
      [
        { id: 1, name: "Work", color: "#3b82f6" },
        { id: 3, name: "Mobile", color: "#ec4899" },
        { id: null, name: "Music", color: "#14b8a6" },
      ],
      [2],
    );
  });

  it("ignores blank new rows on save", async () => {
    const h = setup();
    await userEvent.click(screen.getByRole("button", { name: "Add a Category" }));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(h.onSave).toHaveBeenCalledWith(categories.map((c) => ({ ...c })), []);
  });

  it("duplicate_name_blocks_save", async () => {
    setup();
    const dev = screen.getAllByLabelText("Category name")[1];
    await userEvent.clear(dev);
    await userEvent.type(dev, "pro");
    expect(screen.getAllByText("Name already used")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
