export type Theme = "light" | "dark";

/** The OS color preference; dark unless the OS asks for light. */
export function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

const STORAGE_KEY = "atelier.theme";

/** The theme last chosen with the switch, or the OS preference if none was ever chosen. */
export function initialTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "light" || saved === "dark" ? saved : systemTheme();
}

/** Remembers an explicit choice; from then on it wins over the OS preference. */
export function saveTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme);
}

/** Switches the CSS tokens (see tokens.css). */
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}
