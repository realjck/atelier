/**
 * Toggles name styling by priority. Left: uniform "AAA" (off); right: "AAA"
 * from large to small (on). The knob sits behind the active side.
 */
export function EmphasisSwitch({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      className="emphasis-switch"
      aria-checked={on}
      aria-label="Priority emphasis"
      title={on ? "Names sized by priority" : "Uniform names"}
      onClick={() => onChange(!on)}
    >
      <span className="emphasis-knob" aria-hidden="true" />
      <span className="aaa aaa-flat" aria-hidden="true">
        AAA
      </span>
      <span className="aaa aaa-graded" aria-hidden="true">
        <span>A</span>
        <span>A</span>
        <span>A</span>
      </span>
    </button>
  );
}
