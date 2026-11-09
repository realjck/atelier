import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmphasisSwitch } from "./EmphasisSwitch";

describe("EmphasisSwitch", () => {
  it("reflects_the_setting_as_a_switch", () => {
    const { rerender } = render(<EmphasisSwitch on onChange={vi.fn()} />);
    expect(screen.getByRole("switch", { name: "Priority emphasis" })).toHaveAttribute("aria-checked", "true");
    rerender(<EmphasisSwitch on={false} onChange={vi.fn()} />);
    expect(screen.getByRole("switch", { name: "Priority emphasis" })).toHaveAttribute("aria-checked", "false");
  });

  it("asks_for_the_opposite_setting_on_click", async () => {
    const onChange = vi.fn();
    render(<EmphasisSwitch on onChange={onChange} />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(false);
  });
});
