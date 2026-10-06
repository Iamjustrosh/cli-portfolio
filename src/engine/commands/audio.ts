import { config } from "@/data/config";
import type { Block, Command } from "../types";
import { ok } from "./helpers";

const label = () => `${config.lofi.title} by ${config.lofi.artist}`;

export const playCommand: Command = {
  name: "play",
  usages: [{ label: "play", description: "play lofi music", run: "play" }],
  run(args, ctx) {
    if (args.length > 0) return null;
    if (ctx.audio.playing) {
      return ok([{ type: "text", text: `already playing: ${label()}` }]);
    }
    const blocks: Block[] = [];
    if (ctx.audio.muted) {
      blocks.push({ type: "text", tone: "muted", text: "sound was off, turning it on" });
    }
    blocks.push({ type: "text", text: `now playing: ${label()}` });
    const { url } = config.lofi;
    if (url) blocks.push({ type: "list", rows: [{ label: "source", detail: url, href: url }] });
    return ok(blocks, [{ type: "lofi", op: "play" }]);
  },
};

export const stopCommand: Command = {
  name: "stop",
  usages: [{ label: "stop", description: "stop the music", run: "stop" }],
  run(args, ctx) {
    if (args.length > 0) return null;
    if (!ctx.audio.playing) return ok([{ type: "text", tone: "muted", text: "nothing is playing" }]);
    return ok([{ type: "text", tone: "muted", text: "stopped" }], [{ type: "lofi", op: "stop" }]);
  },
};
