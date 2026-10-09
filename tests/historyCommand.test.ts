import { describe, expect, it } from "vitest";
import { execute } from "@/engine/execute";
import type { Block, ExecContext, ListRow } from "@/engine/types";

const ctx = (history?: string[]): ExecContext => ({
  audio: { playing: false, muted: false },
  keyboard: { pack: null },
  history,
});
const rows = (blocks: Block[]): ListRow[] => {
  const list = blocks.find((block) => block.type === "list");
  return list && list.type === "list" ? list.rows : [];
};

describe("history command", () => {
  it("lists the session's commands, numbered, each clickable to run again", () => {
    const list = rows(execute("history", ctx(["ls projects", "cat stack.json", "history"])).blocks);
    expect(list.map((row) => row.label)).toEqual(["1  ls projects", "2  cat stack.json", "3  history"]);
    expect(list.map((row) => row.command)).toEqual(["ls projects", "cat stack.json", "history"]);
  });

  it("right-aligns the numbers once there are ten or more", () => {
    const entries = Array.from({ length: 12 }, (_, i) => `cmd${i + 1}`);
    const list = rows(execute("history", ctx(entries)).blocks);
    expect(list[0].label).toBe(" 1  cmd1");
    expect(list[11].label).toBe("12  cmd12");
  });

  it("says so when there is nothing yet, or no history was supplied", () => {
    expect(JSON.stringify(execute("history", ctx([])).blocks)).toContain("no commands yet");
    expect(JSON.stringify(execute("history", ctx()).blocks)).toContain("no commands yet");
  });

  it("rejects arguments", () => {
    expect(execute("history now", ctx(["a"])).blocks[0].type).toBe("error");
  });

  it("is listed in rosh -h, as a clickable command", () => {
    const help = rows(execute("rosh -h").blocks);
    expect(help.find((row) => row.label === "history")?.command).toBe("history");
  });
});
