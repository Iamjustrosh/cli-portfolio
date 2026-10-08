import { afterEach, describe, expect, it, vi } from "vitest";
import { execute } from "@/engine/execute";
import { registry } from "@/engine/commands";
import { fortunes } from "@/data/fortunes";
import type { Block, ListRow } from "@/engine/types";

const text = (blocks: Block[]) => JSON.stringify(blocks);
const helpLabels = () => {
  const list = execute("rosh -h").blocks.find((block) => block.type === "list");
  return (list && list.type === "list" ? list.rows : []).map((row: ListRow) => row.label);
};

afterEach(() => vi.restoreAllMocks());

describe("help aliases", () => {
  it.each(["help", "?", "HELP"])("%s shows the same list as rosh -h", (input) => {
    expect(execute(input)).toEqual(execute("rosh -h"));
  });

  it("are not listed as separate commands in help", () => {
    expect(helpLabels()).not.toContain("help");
    expect(helpLabels()).not.toContain("?");
  });

  it("every command name and alias is unique", () => {
    // building the registry throws on a clash, so reaching this line is the test
    expect(registry.size).toBeGreaterThan(10);
  });
});

describe("whoami", () => {
  it("prints guest and nothing else", () => {
    expect(execute("whoami").blocks).toEqual([{ type: "text", text: "guest" }]);
  });
  it("rejects arguments", () => {
    expect(execute("whoami now").blocks[0].type).toBe("error");
  });
});

describe("greetings", () => {
  it.each(["hi", "hello", "hey", "Hello there"])("%s gets a friendly reply pointing to help", (input) => {
    expect(text(execute(input).blocks)).toContain("hello, guest. type rosh -h to see what you can do.");
  });
});

describe("cd and pwd", () => {
  it.each(["cd", "cd projects", "cd .."])("%s says everything is already here", (input) => {
    expect(text(execute(input).blocks)).toContain("everything is already here. try rosh -h");
  });
  it("pwd prints a home path", () => {
    expect(execute("pwd").blocks).toEqual([{ type: "text", text: "/home/guest/portfolio" }]);
  });
});

describe("fortune", () => {
  it("prints one of your lines", () => {
    const block = execute("fortune").blocks[0];
    expect(block.type).toBe("text");
    if (block.type === "text") expect(fortunes).toContain(block.text);
  });

  it("never repeats the same line twice in a row, even if the dice would", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5); // always picks the same index
    const lines = Array.from({ length: 6 }, () => {
      const block = execute("fortune").blocks[0];
      return block.type === "text" ? block.text : "";
    });
    for (let i = 1; i < lines.length; i++) expect(lines[i]).not.toBe(lines[i - 1]);
  });

  it("eventually shows every line", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) {
      const block = execute("fortune").blocks[0];
      if (block.type === "text") seen.add(block.text);
    }
    expect(seen.size).toBe(fortunes.length);
  });
});

describe("hidden commands", () => {
  it("work but are left out of the help list", () => {
    const labels = helpLabels();
    for (const hidden of ["whoami", "hi", "cd", "pwd", "fortune"]) {
      expect(labels).not.toContain(hidden);
      expect(execute(hidden).blocks[0].type).not.toBe("error");
    }
  });
});
