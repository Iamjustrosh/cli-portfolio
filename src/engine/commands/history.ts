import type { Command } from "../types";
import { ok } from "./helpers";

/** The commands the visitor ran this session. Each row is clickable to run it again. */
export const historyCommand: Command = {
  name: "history",
  usages: [{ label: "history", description: "commands you ran this session", run: "history" }],
  run(args, ctx) {
    if (args.length > 0) return null;
    const entries = ctx.history ?? [];
    if (entries.length === 0) return ok([{ type: "text", tone: "muted", text: "no commands yet" }]);

    const width = String(entries.length).length;
    return ok([
      {
        type: "list",
        rows: entries.map((entry, index) => ({
          label: `${String(index + 1).padStart(width, " ")}  ${entry}`,
          command: entry,
        })),
      },
    ]);
  },
};
