import { GearFolderIcon } from "./Icons";

export function DbFolderButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="db-btn"
      title="Open database folder"
      aria-label="Open database folder"
      onClick={onClick}
    >
      <GearFolderIcon width={20} height={20} />
    </button>
  );
}
