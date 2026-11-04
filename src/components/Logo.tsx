import { useId } from "react";

/** The Atelier "A": solid geometric letter with a groove cut through the crossbar. */
export function Logo({ size = 48 }: { size?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const gradient = `logo-g-${uid}`;
  const mask = `logo-m-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Atelier logo">
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b6cff" />
          <stop offset="1" stopColor="#5b3df5" />
        </linearGradient>
        <mask id={mask}>
          <rect width="120" height="120" fill="#fff" />
          <rect x="4" y="70" width="90" height="4" fill="#000" />
        </mask>
      </defs>
      <g fill={`url(#${gradient})`} mask={`url(#${mask})`}>
        <path d="M52 14 H68 L106 106 H88 L60 36 L32 106 H14 Z" />
        <rect x="4" y="66" width="90" height="12" />
      </g>
    </svg>
  );
}
