import { describe, expect, it, vi } from "vitest";
import type { ExecContext } from "@/engine/types";

vi.mock("@/data/projects", () => ({
  projects: [
    { slug: "alpha-one", name: "Alpha One", tagline: "first", description: "d", url: "https://example.com/1" },
    { slug: "alpha-two", name: "Alpha Two", tagline: "second", description: "d", url: "https://example.com/2" },
    { slug: "beta", name: "Beta", tagline: "third", description: "d", url: "https://example.com/3" },
  ],
}));
vi.mock("@/data/keyboardPacks", () => ({
  keyboardPacks: [
    { name: "alpaca", generic: ["GENERIC_R0"], release: false },
    { name: "bluealps", generic: ["GENERIC_R0"], release: false },
    { name: "blackink", generic: ["GENERIC_R0"], release: false },
  ],
}));

const { complete } = await import("@/engine/complete");
const { execute } = await import("@/engine/execute");

const ctx: ExecContext = { audio: { playing: false, muted: false }, keyboard: { pack: "alpaca" }, history: [] };
const value = (input: string) => complete(input, ctx)?.value;
const candidates = (input: string) => complete(input, ctx)?.candidates;

describe("completing the command", () => {
  it("completes a unique start, adding a space only when the command takes an argument", () => {
    expect(value("l")).toBe("ls ");
    expect(value("ca")).toBe("cat ");
    expect(value("fastf")).toBe("fastfetch"); // takes no argument: no space
    expect(value("re")).toBe("resume");
    expect(value("his")).toBe("history");
  });

  it("completes a command typed in full by adding the space", () => {
    expect(value("ls")).toBe("ls ");
  });

  it("with several matches, leaves the text alone and reports them, sorted", () => {
    expect(value("c")).toBe("c");
    expect(candidates("c")).toEqual(["cat", "clear"]);
  });

  it("completes other unique starts too", () => {
    expect(candidates("k")).toEqual(["keyboard"]);
    expect(value("s")).toBe("stop");
  });

  it("matches ignoring case, and writes the real name", () => {
    expect(value("LS")).toBe("ls ");
    expect(value("  CA")).toBe("  cat ");
  });

  it("offers help but not the ? shortcut", () => {
    expect(value("he")).toBe("help ");
    expect(complete("?", ctx)).toBeNull();
  });

  it("never offers hidden commands, so the easter eggs stay secret", () => {
    for (const hidden of ["fort", "whoam", "pw", "hell", "he", "cd"]) {
      expect(candidates(hidden) ?? []).not.toContain("fortune");
      expect(candidates(hidden) ?? []).not.toContain("whoami");
      expect(candidates(hidden) ?? []).not.toContain("pwd");
      expect(candidates(hidden) ?? []).not.toContain("hello");
      expect(candidates(hidden) ?? []).not.toContain("cd");
    }
    expect(complete("fort", ctx)).toBeNull();
    expect(complete("whoam", ctx)).toBeNull();
  });

  it("finds nothing for a start no command has", () => {
    expect(complete("zzz", ctx)).toBeNull();
  });
});

describe("completing the argument", () => {
  const listedBy = (command: string) =>
    execute(command, ctx).blocks.flatMap((block) => (block.type === "list" ? block.rows.map((row) => row.label) : []));

  it("ls: offers exactly what bare ls lists", () => {
    expect(candidates("ls ")).toEqual([...listedBy("ls")].sort());
    expect(value("ls pro")).toBe("ls projects");
  });

  it("cat: offers files and project files", () => {
    expect(candidates("cat ")).toEqual([...listedBy("cat")].sort());
    expect(value("cat exp")).toBe("cat experience.txt");
    expect(value("cat s")).toBe("cat stack.json");
    expect(value("cat be")).toBe("cat beta.txt");
  });

  it("run: offers project names", () => {
    expect(candidates("run ")).toEqual(["alpha-one", "alpha-two", "beta"]);
    expect(value("run be")).toBe("run beta");
  });

  it("keyboard: offers the installed packs", () => {
    expect(candidates("keyboard ")).toEqual(["alpaca", "blackink", "bluealps"]);
    expect(value("keyboard blu")).toBe("keyboard bluealps");
  });

  it("rosh and help: offer the help flags", () => {
    expect(candidates("rosh -")).toEqual(["--h", "--help", "-h"]);
    expect(value("rosh --he")).toBe("rosh --help");
    expect(value("help --")).toBe("help --h"); // both flags start "--h", so it grows that far
  });

  it("grows to the shared part when several match, without adding a space", () => {
    expect(value("run al")).toBe("run alpha-");
    expect(value("cat alpha")).toBe("cat alpha-");
    expect(candidates("cat alpha")).toEqual(["alpha-one.txt", "alpha-two.txt"]);
    expect(value("run alpha-t")).toBe("run alpha-two");
  });

  it("leaves the text alone when several match and nothing more is shared", () => {
    expect(value("keyboard bl")).toBe("keyboard bl");
    expect(candidates("keyboard bl")).toEqual(["blackink", "bluealps"]);
  });

  it("keeps the command exactly as typed, and the spacing", () => {
    expect(value("LS PRO")).toBe("LS projects");
    expect(value("  ls pro")).toBe("  ls projects");
    expect(value("run ALPHA-T")).toBe("run alpha-two");
  });

  it("completes nothing for commands without arguments, hidden commands and unknown ones", () => {
    for (const input of ["resume ", "fastfetch ", "clear ", "history ", "fortune ", "whoami ", "nope ", "play x"]) {
      expect(complete(input, ctx)).toBeNull();
    }
  });

  it("completes nothing past the first argument", () => {
    expect(complete("ls projects ", ctx)).toBeNull();
    expect(complete("ls projects x", ctx)).toBeNull();
    expect(complete("cat a b c", ctx)).toBeNull();
  });

  it("finds nothing for an argument start nothing has", () => {
    expect(complete("ls zzz", ctx)).toBeNull();
    expect(complete("cat nope", ctx)).toBeNull();
  });

  it("does nothing for empty or blank input", () => {
    expect(complete("", ctx)).toBeNull();
    expect(complete("   ", ctx)).toBeNull();
  });

  it("every suggestion actually runs: no completed command ends in an error", () => {
    for (const verb of ["ls", "cat", "run", "keyboard", "rosh"]) {
      const options = candidates(`${verb} `) ?? [];
      expect(options.length).toBeGreaterThan(0);
      for (const option of options) {
        const blocks = execute(`${verb} ${option}`, ctx).blocks;
        expect(JSON.stringify(blocks), `${verb} ${option}`).not.toContain('"type":"error"');
      }
    }
  });
});
