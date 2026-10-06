export type KeyKind = "generic" | "backspace" | "enter" | "space";

const MODIFIERS = new Set(["Shift", "Control", "Alt", "Meta", "CapsLock", "Fn", "AltGraph"]);

/** Which sound a physical key should make. null = silent (modifier keys on their own). */
export function classifyKey(key: string): KeyKind | null {
  if (MODIFIERS.has(key)) return null;
  if (key === " " || key === "Spacebar") return "space";
  if (key === "Enter") return "enter";
  if (key === "Backspace") return "backspace";
  return "generic";
}

/**
 * Virtual keyboards (Android) report every keydown as "Unidentified", so the
 * sound has to be chosen from what changed in the text instead.
 */
export function classifyInputChange(previous: string, next: string): KeyKind | null {
  if (next.length < previous.length) return "backspace";
  if (next.length > previous.length) return next.endsWith(" ") ? "space" : "generic";
  return null;
}

/** keydown events from a virtual keyboard or an IME carry no usable key name. */
export function isVirtualKey(key: string, keyCode: number): boolean {
  return key === "Unidentified" || keyCode === 229;
}
