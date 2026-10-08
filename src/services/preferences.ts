const KEY = "rosh:prefs";

export interface Prefs {
  muted: boolean;
  /** Last keyboard sound pack the visitor picked (validated against the installed packs on load). */
  pack: string | null;
}

/** Saved choices survive reloads. Storage can be blocked or full, so never let it throw. */
export function readPrefs(): Prefs {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Prefs>) : {};
    return {
      muted: parsed.muted === true,
      pack: typeof parsed.pack === "string" ? parsed.pack : null,
    };
  } catch {
    return { muted: false, pack: null };
  }
}

/** Merges into what is already saved, so changing one choice never wipes another. */
export function writePrefs(patch: Partial<Prefs>): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...readPrefs(), ...patch }));
  } catch {
    /* ignore */
  }
}
