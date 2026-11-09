import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Header } from "./Header";

describe("Header", () => {
  it("shows the wordmark and New Project button, without counters", () => {
    render(<Header query="" onQueryChange={() => {}} onNewProject={() => {}} emphasis onEmphasisChange={() => {}} />);
    expect(screen.getByText("Atelier")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /new project/i })).toBeInTheDocument();
    expect(screen.queryByText(/total|online/i)).toBeNull();
  });

  it("reports search input and New Project clicks", async () => {
    const onQueryChange = vi.fn();
    const onNewProject = vi.fn();
    render(<Header query="" onQueryChange={onQueryChange} onNewProject={onNewProject} emphasis onEmphasisChange={() => {}} />);
    await userEvent.type(screen.getByRole("searchbox"), "a");
    expect(onQueryChange).toHaveBeenCalledWith("a");
    await userEvent.click(screen.getByRole("button", { name: /new project/i }));
    expect(onNewProject).toHaveBeenCalled();
  });
});
