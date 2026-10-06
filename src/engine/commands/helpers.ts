import type { ExecResult } from "../types";

export const HINT = "use rosh -h or rosh --help to view commands";

/** A real-shell style failure for a known command with a bad target. */
export function fail(message: string): ExecResult {
  return {
    blocks: [
      { type: "error", text: message },
      { type: "text", tone: "muted", text: HINT },
    ],
    actions: [],
  };
}

export function ok(blocks: ExecResult["blocks"], actions: ExecResult["actions"] = []): ExecResult {
  return { blocks, actions };
}
