import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Stroke({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const SearchIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Stroke>
);

export const PlusIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 5v14M5 12h14" />
  </Stroke>
);

export const CloseIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Stroke>
);

export const PencilIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
    <path d="m13.5 6.5 4 4" />
  </Stroke>
);

export const TrashIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Stroke>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m6 9 6 6 6-6" />
  </Stroke>
);

export const SortIcon = (p: IconProps) => (
  <Stroke width="12" height="12" {...p}>
    <path d="m7 9 5-5 5 5M7 15l5 5 5-5" />
  </Stroke>
);

/** Single chevron for the sorted column: up for ascending, down for descending. */
export const SortDirIcon = ({ dir, ...p }: IconProps & { dir: "asc" | "desc" }) => (
  <Stroke width="14" height="14" strokeWidth="2.2" data-dir={dir} {...p}>
    <path d={dir === "asc" ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"} />
  </Stroke>
);

export const GripIcon = (p: IconProps) => (
  <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true" {...p}>
    <circle cx="2.5" cy="3" r="1.5" />
    <circle cx="7.5" cy="3" r="1.5" />
    <circle cx="2.5" cy="8" r="1.5" />
    <circle cx="7.5" cy="8" r="1.5" />
    <circle cx="2.5" cy="13" r="1.5" />
    <circle cx="7.5" cy="13" r="1.5" />
  </svg>
);

export const GridIcon = (p: IconProps) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" {...p}>
    <rect x="1" y="1" width="6" height="6" rx="1.5" />
    <rect x="9" y="1" width="6" height="6" rx="1.5" />
    <rect x="1" y="9" width="6" height="6" rx="1.5" />
    <rect x="9" y="9" width="6" height="6" rx="1.5" />
  </svg>
);

export const FolderIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
  </Stroke>
);

export const GlobeIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" />
  </Stroke>
);

/** Gear next to a small folder: opens the database folder. */
export const GearFolderIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M2.5 10a1.5 1.5 0 0 1 1.5-1.5h3l1.5 1.5H13a1.5 1.5 0 0 1 1.5 1.5V17a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 17v-7Z" />
    <circle cx="17.5" cy="7" r="2" />
    <path d="M17.5 2.5V4M17.5 10v1.5M13 7h1.5M20.5 7H22M14.3 3.8l1 1M19.7 9.2l1 1M14.3 10.2l1-1M19.7 4.8l1-1" />
  </Stroke>
);

export const GithubIcon = (p: IconProps) => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" role="img" aria-label="GitHub" {...p}>
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
  </svg>
);

export const GitlabIcon = (p: IconProps) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" role="img" aria-label="GitLab" {...p}>
    <path d="m12 21.4 3.7-11.3H8.3L12 21.4Z" />
    <path d="M12 21.4 8.3 10.1H3.1L12 21.4Z" opacity=".8" />
    <path d="M3.1 10.1 2 13.5c-.1.3 0 .7.3.9L12 21.4 3.1 10.1Z" opacity=".6" />
    <path d="M3.1 10.1h5.2L6.1 3.2c-.1-.4-.6-.4-.7 0L3.1 10.1Z" />
    <path d="m12 21.4 3.7-11.3h5.2L12 21.4Z" opacity=".8" />
    <path d="M20.9 10.1 22 13.5c.1.3 0 .7-.3.9L12 21.4l8.9-11.3Z" opacity=".6" />
    <path d="M20.9 10.1h-5.2l2.2-6.9c.1-.4.6-.4.7 0l2.3 6.9Z" />
  </svg>
);

export const GitIcon = (p: IconProps) => (
  <Stroke width="20" height="20" role="img" aria-label="Git repository" aria-hidden={undefined} {...p}>
    <circle cx="6" cy="5" r="2" />
    <circle cx="6" cy="19" r="2" />
    <circle cx="18" cy="8" r="2" />
    <path d="M6 7v10M18 10c0 4-6 3-11.2 7.4" />
  </Stroke>
);
