import { keyboardPacks } from "@/data/keyboardPacks";
import { findPack } from "@/lib/packs";
import type { Block, Command } from "../types";
import { fail, ok } from "./helpers";

const SEE_LIST = "type keyboard to see the available sounds";

export const keyboardCommand: Command = {
  name: "keyboard",
  usages: [
    { label: "keyboard", description: "list keyboard sounds", run: "keyboard" },
    { label: "keyboard <name>", description: "change the keyboard sound" },
  ],
  run(args, ctx) {
    if (args.length > 1) return fail("keyboard: too many arguments", SEE_LIST);

    if (args.length === 0) {
      if (keyboardPacks.length === 0) {
        return ok([{ type: "text", tone: "muted", text: "no keyboard sounds installed" }]);
      }
      return ok([
        { type: "text", tone: "muted", text: "keyboard sounds, click one to switch:" },
        {
          type: "list",
          rows: keyboardPacks.map((pack) => ({
            label: pack.name,
            command: `keyboard ${pack.name}`,
            detail: pack.name === ctx.keyboard.pack ? "current" : undefined,
          })),
        },
      ]);
    }

    const pack = findPack(args[0], keyboardPacks);
    if (!pack) return fail(`keyboard: ${args[0]}: no such keyboard`, SEE_LIST);
    if (pack.name === ctx.keyboard.pack) {
      return ok([{ type: "text", tone: "muted", text: `already using ${pack.name}` }]);
    }

    const blocks: Block[] = [{ type: "text", text: `keyboard: ${pack.name}` }];
    if (ctx.audio.muted) {
      blocks.push({ type: "text", tone: "muted", text: "sound is off, you will hear it when you turn it on" });
    }
    return ok(blocks, [{ type: "keyboard", pack: pack.name }]);
  },
};
