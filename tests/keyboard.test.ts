import { describe, expect, it, vi } from "vitest";
import type { Block, ExecContext, ListRow } from "@/engine/types";

vi.mock("@/data/keyboardPacks", () => ({
  keyboardPacks: [
    { name: "alpaca", generic: ["GENERIC_R0"], release: true },
    { name: "bluealps", generic: ["GENERIC_R0"], release: true },
    { name: "mxblack", generic: ["GENERIC_R0"], release: false },
  ],
}));

const { execute } = await import("@/engine/execute");

const ctx = (pack: string | null, muted = false): ExecContext => ({
  audio: { playing: false, muted },
  keyboard: { pack },
});
const text = (blocks: Block[]) => JSON.stringify(blocks);
const rows = (blocks: Block[]): ListRow[] => {
  const list = blocks.find((block) => block.type === "list");
  return list && list.type === "list" ? list.rows : [];
};

describe("keyboard", () => {
  it("lists every installed pack, clickable, with the current one marked", () => {
    const list = rows(execute("keyboard", ctx("bluealps")).blocks);
    expect(list.map((row) => row.label)).toEqual(["alpaca", "bluealps", "mxblack"]);
    expect(list.map((row) => row.command)).toEqual(["keyboard alpaca", "keyboard bluealps", "keyboard mxblack"]);
    expect(list.map((row) => row.detail)).toEqual([undefined, "current", undefined]);
  });

  it("switches to a pack and asks the service to load it", () => {
    const result = execute("keyboard mxblack", ctx("alpaca"));
    expect(text(result.blocks)).toContain("keyboard: mxblack");
    expect(result.actions).toEqual([{ type: "keyboard", pack: "mxblack" }]);
  });

  it("accepts any capitalisation and uses the real folder name", () => {
    expect(execute("keyboard BlueAlps", ctx("alpaca")).actions).toEqual([{ type: "keyboard", pack: "bluealps" }]);
  });

  it("does nothing when the pack is already in use", () => {
    const result = execute("keyboard alpaca", ctx("alpaca"));
    expect(text(result.blocks)).toContain("already using alpaca");
    expect(result.actions).toEqual([]);
  });

  it("tells you when sound is off, and still switches", () => {
    const result = execute("keyboard bluealps", ctx("alpaca", true));
    expect(text(result.blocks)).toContain("sound is off");
    expect(result.actions).toEqual([{ type: "keyboard", pack: "bluealps" }]);
  });

  it("fails for unknown packs, pointing to the list", () => {
    const result = execute("keyboard nope", ctx("alpaca"));
    expect(text(result.blocks)).toContain("keyboard: nope: no such keyboard");
    expect(text(result.blocks)).toContain("type keyboard to see the available sounds");
    expect(result.actions).toEqual([]);
    expect(text(execute("keyboard constructor", ctx("alpaca")).blocks)).toContain("no such keyboard");
  });

  it("rejects extra arguments", () => {
    expect(execute("keyboard a b", ctx("alpaca")).blocks[0].type).toBe("error");
  });

  it("appears in help, with the name form non-clickable", () => {
    const help = rows(execute("rosh -h").blocks);
    expect(help.find((row) => row.label === "keyboard")?.command).toBe("keyboard");
    expect(help.find((row) => row.label === "keyboard <name>")?.command).toBeUndefined();
  });
});
