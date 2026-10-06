export function rand(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta", "CapsLock", "Fn"]);

/** True for keys that should not count as "any key" (skip animation). */
export function isModifierKey(key: string): boolean {
  return MODIFIER_KEYS.has(key);
}
