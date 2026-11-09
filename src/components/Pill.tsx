import type { CSSProperties } from "react";

/** Rounded badge tinted with `color`, with a matching dot; the tint per theme lives in app.css. */
export function Pill({ color, label }: { color: string; label: string }) {
  return (
    <span className="pill" title={label} style={{ "--pill": color } as CSSProperties}>
      <span className="dot" style={{ background: color }} />
      <span className="pill-label">{label}</span>
    </span>
  );
}
