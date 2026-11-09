import { describe, expect, it } from "vitest";
import { loadNameEmphasis, saveNameEmphasis } from "./settings";

describe("name emphasis setting", () => {
  it("is_on_by_default", () => {
    expect(loadNameEmphasis()).toBe(true);
  });
  it("remembers_the_last_choice", () => {
    saveNameEmphasis(false);
    expect(loadNameEmphasis()).toBe(false);
    saveNameEmphasis(true);
    expect(loadNameEmphasis()).toBe(true);
  });
  it("ignores_an_unknown_saved_value", () => {
    localStorage.setItem("atelier.nameEmphasis", "maybe");
    expect(loadNameEmphasis()).toBe(true);
  });
});
