import { afterEach, describe, expect, it, vi } from "vitest";
import { systemTheme } from "./theme";

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
