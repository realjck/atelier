export type Theme = "light" | "dark";

/** The OS color preference; dark unless the OS asks for light. */
export function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/** Switches the CSS tokens (see tokens.css). */
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}
