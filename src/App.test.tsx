import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn().mockResolvedValue([]) }));

describe("App", () => {
  it("renders the app name", () => {
    render(<App />);
    expect(screen.getByText("Atelier")).toBeInTheDocument();
  });
});
