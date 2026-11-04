import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FilterBar } from "./FilterBar";

describe("FilterBar", () => {
  it("shows All, Online and one chip per state", () => {
    render(<FilterBar value="all" onChange={() => {}} />);
    const labels = screen.getAllByRole("button").map((b) => b.textContent);
    expect(labels).toEqual(["All", "Online", "Idea", "Draft", "In Progress", "On Hold", "Completed", "Archived"]);
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
  });

  it("reports the clicked filter", async () => {
    const onChange = vi.fn();
    render(<FilterBar value="all" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Archived" }));
    expect(onChange).toHaveBeenCalledWith("archived");
  });
});
