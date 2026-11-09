import type { Theme } from "../lib/theme";
import { MoonIcon, SunIcon } from "./Icons";

/** Toggle between dark and light; the knob shows the current theme. */
export function ThemeSwitch({ theme, onChange }: { theme: Theme; onChange: (theme: Theme) => void }) {
  const light = theme === "light";
  return (
    <button
      type="button"
      role="switch"
      className="theme-switch"
      aria-checked={light}
      aria-label="Light mode"
      title={light ? "Switch to dark mode" : "Switch to light mode"}
      onClick={() => onChange(light ? "dark" : "light")}
    >
      <span className="theme-knob">{light ? <SunIcon /> : <MoonIcon />}</span>
    </button>
  );
}
