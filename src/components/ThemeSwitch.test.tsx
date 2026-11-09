import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ThemeSwitch } from "./ThemeSwitch";

describe("ThemeSwitch", () => {
  it("reflects_the_theme_as_a_switch", () => {
    const { rerender } = render(<ThemeSwitch theme="dark" onChange={vi.fn()} />);
    expect(screen.getByRole("switch", { name: "Light mode" })).toHaveAttribute("aria-checked", "false");
    rerender(<ThemeSwitch theme="light" onChange={vi.fn()} />);
    expect(screen.getByRole("switch", { name: "Light mode" })).toHaveAttribute("aria-checked", "true");
  });

  it("asks_for_the_other_theme_on_click", async () => {
    const onChange = vi.fn();
    render(<ThemeSwitch theme="dark" onChange={onChange} />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith("light");
  });
});
