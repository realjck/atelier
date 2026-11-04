import { describe, expect, it } from "vitest";
import { detectProvider } from "./repo";

describe("detectProvider", () => {
  it("detects GitHub", () => {
    expect(detectProvider("https://github.com/a/b")).toBe("github");
  });
  it("detects GitLab from SSH and self-hosted URLs", () => {
    expect(detectProvider("git@gitlab.com:a/b.git")).toBe("gitlab");
    expect(detectProvider("https://gitlab.mycorp.io/x")).toBe("gitlab");
  });
  it("falls back to generic git", () => {
    expect(detectProvider("https://bitbucket.org/x")).toBe("git");
  });
  it("returns null when empty", () => {
    expect(detectProvider(null)).toBeNull();
    expect(detectProvider("  ")).toBeNull();
  });
});
