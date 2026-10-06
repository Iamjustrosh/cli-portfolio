const KEY = "rosh:prefs";

export interface Prefs {
  muted: boolean;
}

/** Saved choices survive reloads. Storage can be blocked or full, so never let it throw. */
export function readPrefs(): Prefs {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Prefs>) : {};
    return { muted: parsed.muted === true };
  } catch {
    return { muted: false };
  }
}

export function writePrefs(prefs: Prefs): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}
