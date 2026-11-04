import type { StateId } from "../types";

export interface StateMeta {
  id: StateId;
  label: string;
  color: string;
}

/** Project states in lifecycle order. */
export const STATES: StateMeta[] = [
  { id: "idea", label: "Idea", color: "#9ca3af" },
  { id: "draft", label: "Draft", color: "#a89cf0" },
  { id: "in_progress", label: "In Progress", color: "#3b82f6" },
  { id: "on_hold", label: "On Hold", color: "#f59e0b" },
  { id: "completed", label: "Completed", color: "#22c55e" },
  { id: "archived", label: "Archived", color: "#4b5563" },
];

export function stateMeta(id: StateId): StateMeta {
  return STATES.find((s) => s.id === id) ?? STATES[0];
}
