import { describe, expect, it } from "vitest";
import { execute, normalize } from "@/engine/execute";

describe("normalize", () => {
  it("trims, collapses spaces and lowercases", () => {
    expect(normalize("  ROSH    --Help ")).toBe("rosh --help");
  });

  it("turns phone-keyboard long dashes back into --", () => {
    expect(normalize("rosh \u2014help")).toBe("rosh --help");
    expect(normalize("rosh \u2013h")).toBe("rosh --h");
  });
});

describe("execute", () => {
  it("does nothing for empty input", () => {
    expect(execute("   ")).toEqual({ blocks: [], actions: [] });
  });

  it.each(["rosh", "rosh -h", "rosh --h", "rosh --help", "ROSH --HELP", "rosh \u2014help"])(
    "shows help for %s",
    (input) => {
      const { blocks } = execute(input);
      expect(blocks.some((block) => block.type === "list")).toBe(true);
    },
  );

  it("generates help from the commands' own usages", () => {
    const list = execute("rosh -h").blocks.find((block) => block.type === "list");
    const labels = list && list.type === "list" ? list.rows.map((row) => row.label) : [];
    expect(labels).toContain("rosh -h");
    expect(labels).toContain("clear");
  });

  it("asks the terminal to clear", () => {
    expect(execute("clear").actions).toEqual([{ type: "clear" }]);
  });

  it("shows the error pointing to rosh -h for unknown commands", () => {
    const { blocks } = execute("foo bar");
    expect(blocks[0]).toEqual({ type: "error", text: "command not found: foo bar" });
    expect(JSON.stringify(blocks)).toContain("use rosh -h or rosh --help to view commands");
  });

  it("treats a known command with bad arguments as unknown", () => {
    expect(execute("rosh nope").blocks[0].type).toBe("error");
    expect(execute("clear now").blocks[0].type).toBe("error");
  });
});
