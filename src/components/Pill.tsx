/** Rounded badge tinted with `color`, with a matching dot. */
export function Pill({ color, label }: { color: string; label: string }) {
  return (
    <span className="pill" title={label} style={{ color, background: `${color}24` }}>
      <span className="dot" style={{ background: color }} />
      <span className="pill-label">{label}</span>
    </span>
  );
}
