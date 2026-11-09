import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Testing Library only auto-cleans when test globals are enabled.
afterEach(cleanup);

// jsdom has no matchMedia; report no OS preference, which means the dark theme.
window.matchMedia = vi.fn((query: string) => ({ matches: false, media: query }) as MediaQueryList);
