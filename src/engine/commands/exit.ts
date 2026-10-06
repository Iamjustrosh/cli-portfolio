import { config } from "@/data/config";
import type { Command } from "../types";
import { ok } from "./helpers";

export const exitCommand: Command = {
  name: "exit",
  usages: [{ label: "exit", description: "back to the main site", run: "exit" }],
  run(args) {
    if (args.length > 0) return null;
    return ok(
      [{ type: "text", tone: "muted", text: `redirecting to ${config.mainSiteUrl}...` }],
      [{ type: "redirect", url: config.mainSiteUrl, delayMs: 900 }],
    );
  },
};
