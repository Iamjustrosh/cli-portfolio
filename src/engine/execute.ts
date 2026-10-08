import { registry } from "./commands";
import type { ExecContext, ExecResult } from "./types";

const DEFAULT_CONTEXT: ExecContext = {
  audio: { playing: false, muted: false },
  keyboard: { pack: null },
};

/**
 * Clean the raw input: trim, collapse spaces, lowercase, and turn the long
 * dashes that phone keyboards auto-insert ("--" becomes an em dash) back into "--".
 */
export function normalize(raw: string): string {
  return raw
    .replace(/[\u2013\u2014]/g, "--")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function execute(raw: string, ctx: ExecContext = DEFAULT_CONTEXT): ExecResult {
  const line = normalize(raw);
  if (!line) return { blocks: [], actions: [] };

  const [name, ...args] = line.split(" ");
  const result = registry.get(name)?.run(args, ctx);
  return result ?? unknown(raw);
}

function unknown(raw: string): ExecResult {
  const typed = raw.trim().replace(/\s+/g, " ");
  const shown = typed.length > 60 ? `${typed.slice(0, 60)}...` : typed;
  return {
    blocks: [
      { type: "error", text: `command not found: ${shown}` },
      { type: "text", tone: "muted", text: "use rosh -h or rosh --help to view commands" },
    ],
    actions: [],
  };
}
