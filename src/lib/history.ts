/** How many commands the session remembers. */
export const HISTORY_LIMIT = 50;

/** Add a command to the history: trimmed, empty ones skipped, an immediate repeat collapsed, oldest dropped past the limit. */
export function addToHistory(entries: readonly string[], raw: string): string[] {
  const text = raw.trim();
  if (!text) return [...entries];
  if (entries[entries.length - 1] === text) return [...entries];
  return [...entries, text].slice(-HISTORY_LIMIT);
}

/** Where the visitor is while pressing up/down. `index` null = not browsing; `draft` is what they had typed. */
export interface Browse {
  index: number | null;
  draft: string;
}

export const NOT_BROWSING: Browse = { index: null, draft: "" };

/**
 * One up/down press. Returns the new browse position and the text to show,
 * or null when nothing should change (no history, or down while not browsing).
 *  - up from "not browsing" remembers what was typed, then shows the newest command
 *  - up again walks back; it stops at the oldest
 *  - down walks forward; past the newest it restores the remembered draft
 */
export function stepHistory(
  entries: readonly string[],
  browse: Browse,
  direction: "up" | "down",
  current: string,
): { browse: Browse; value: string } | null {
  if (entries.length === 0) return null;

  if (direction === "up") {
    if (browse.index === null) {
      const index = entries.length - 1;
      return { browse: { index, draft: current }, value: entries[index] };
    }
    const index = Math.max(0, Math.min(browse.index, entries.length - 1) - 1);
    return { browse: { index, draft: browse.draft }, value: entries[index] };
  }

  if (browse.index === null) return null;
  if (browse.index >= entries.length - 1) return { browse: NOT_BROWSING, value: browse.draft };
  const index = browse.index + 1;
  return { browse: { index, draft: browse.draft }, value: entries[index] };
}
