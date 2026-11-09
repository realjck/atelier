import { afterEach, describe, expect, it, vi } from "vitest";
import { initialTheme, saveTheme, systemTheme } from "./theme";

function preferLight(matches: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query) => ({ matches: matches && query === "(prefers-color-scheme: light)" }) as MediaQueryList,
  );
}

afterEach(() => vi.restoreAllMocks());

describe("systemTheme", () => {
  it("follows_a_light_os_preference", () => {
    preferLight(true);
    expect(systemTheme()).toBe("light");
  });
  it("defaults_to_dark", () => {
    preferLight(false);
    expect(systemTheme()).toBe("dark");
  });
});

describe("initialTheme", () => {
  afterEach(() => localStorage.clear());

  it("follows_the_os_until_a_theme_is_saved", () => {
    preferLight(true);
    expect(initialTheme()).toBe("light");
    saveTheme("dark");
    expect(initialTheme()).toBe("dark");
  });

  it("ignores_an_unknown_saved_value", () => {
    preferLight(true);
    localStorage.setItem("atelier.theme", "sepia");
    expect(initialTheme()).toBe("light");
  });
});
