const NAME_EMPHASIS_KEY = "atelier.nameEmphasis";

/** Whether names are styled by priority; on until switched off. */
export function loadNameEmphasis(): boolean {
  return localStorage.getItem(NAME_EMPHASIS_KEY) !== "off";
}

export function saveNameEmphasis(on: boolean) {
  localStorage.setItem(NAME_EMPHASIS_KEY, on ? "on" : "off");
}
