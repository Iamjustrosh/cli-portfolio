import type { Command } from "../types";

export const clearCommand: Command = {
  name: "clear",
  usages: [{ label: "clear", description: "clear the screen", run: "clear" }],
  run(args) {
    if (args.length > 0) return null;
    return { blocks: [], actions: [{ type: "clear" }] };
  },
};
