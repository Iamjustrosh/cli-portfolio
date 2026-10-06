import { describe, expect, it } from "vitest";
import { execute } from "@/engine/execute";
import { unitCount } from "@/engine/blocks";
import { projects } from "@/data/projects";
import { config } from "@/data/config";
import type { Block, ListRow } from "@/engine/types";

const first = projects[0];

function listRows(blocks: Block[]): ListRow[] {
  const list = blocks.find((block) => block.type === "list");
  return list && list.type === "list" ? list.rows : [];
}
const text = (blocks: Block[]) => JSON.stringify(blocks);

describe("ls", () => {
  it("lists projects as clickable rows that run cat", () => {
    const rows = listRows(execute("ls projects").blocks);
    expect(rows).toHaveLength(projects.length);
    expect(rows[0]).toEqual({
      label: first.slug,
      command: `cat ${first.slug}.txt`,
      detail: first.tagline,
    });
  });

  it("lists games and books", () => {
    expect(listRows(execute("ls games").blocks).length).toBeGreaterThan(0);
    expect(listRows(execute("ls books").blocks).length).toBeGreaterThan(0);
  });

  it("fails like a shell for bad targets, with the help hint", () => {
    expect(text(execute("ls nope").blocks)).toContain("ls: nope: no such directory");
    expect(text(execute("ls constructor").blocks)).toContain("no such directory");
    expect(text(execute("ls").blocks)).toContain("ls: missing directory");
    expect(text(execute("ls nope").blocks)).toContain("use rosh -h or rosh --help");
  });
});

describe("cat", () => {
  it("shows a project description ending in a clickable run row", () => {
    const { blocks } = execute(`cat ${first.slug}.txt`);
    expect(text(blocks)).toContain(first.name);
    const rows = listRows(blocks);
    expect(rows).toEqual([{ label: `run ${first.slug}`, command: `run ${first.slug}`, detail: first.url }]);
  });

  it("shows experience, gears and connect links", () => {
    expect(text(execute("cat experience.txt").blocks)).toContain("Company Name");
    expect(listRows(execute("cat gears.txt").blocks).length).toBeGreaterThan(0);
    const links = listRows(execute("cat connect.txt").blocks);
    expect(links.map((row) => row.label)).toEqual(["mail", "instagram", "github", "linkedin", "behance"]);
    expect(links.every((row) => row.href)).toBe(true);
  });

  it("returns stack.json as valid, pretty-printed JSON", () => {
    const block = execute("cat stack.json").blocks[0];
    expect(block.type).toBe("json");
    if (block.type === "json") {
      expect(() => JSON.parse(block.lines.join("\n"))).not.toThrow();
      expect(unitCount(block)).toBe(block.lines.length);
    }
  });

  it("fails for missing files", () => {
    expect(text(execute("cat nope.txt").blocks)).toContain("cat: nope.txt: no such file");
    expect(text(execute("cat constructor").blocks)).toContain("no such file");
    expect(text(execute("cat").blocks)).toContain("cat: missing file name");
  });
});

describe("run", () => {
  it("opens a project in a new tab via an action", () => {
    const result = execute(`run ${first.slug}`);
    expect(result.actions).toEqual([{ type: "open", url: first.url }]);
  });

  it("downloads the resume", () => {
    expect(execute("run resume").actions).toEqual([
      { type: "download", href: config.resume.href, filename: config.resume.filename },
    ]);
  });

  it("fails for unknown targets", () => {
    expect(text(execute("run nope").blocks)).toContain("run: nope: not found");
    expect(execute("run nope").actions).toEqual([]);
  });
});

describe("fastfetch and exit", () => {
  it("builds the fastfetch block with a computed age and the logo", () => {
    const block = execute("fastfetch").blocks[0];
    expect(block.type).toBe("fastfetch");
    if (block.type === "fastfetch") {
      expect(block.logo).toEqual(config.logo);
      const labels = block.rows.map((row) => row.label);
      expect(labels[0]).toBe("Age");
      expect(labels[labels.length - 1]).toBe("About");
      expect(block.rows[0].value).toMatch(/^\d+ years$/);
    }
  });

  it("redirects to the main site after a short delay", () => {
    expect(execute("exit").actions).toEqual([
      { type: "redirect", url: config.mainSiteUrl, delayMs: 900 },
    ]);
  });
});

describe("help", () => {
  it("lists every command, with placeholders non-clickable", () => {
    const rows = listRows(execute("rosh -h").blocks);
    const labels = rows.map((row) => row.label);
    for (const expected of [
      "rosh -h", "ls projects", "ls games", "ls books", "cat <project>.txt", "cat experience.txt",
      "cat stack.json", "cat connect.txt", "cat gears.txt", "run <project>", "run resume",
      "fastfetch", "play", "stop", "clear", "exit",
    ]) {
      expect(labels).toContain(expected);
    }
    expect(rows.find((row) => row.label === "cat <project>.txt")?.command).toBeUndefined();
    expect(rows.find((row) => row.label === "run <project>")?.command).toBeUndefined();
  });

  it("every clickable help row runs without an error", () => {
    for (const row of listRows(execute("rosh -h").blocks)) {
      if (!row.command || row.command === "exit") continue;
      expect(text(execute(row.command).blocks)).not.toContain('"type":"error"');
    }
  });
});

describe("play and stop", () => {
  const idle = { audio: { playing: false, muted: false } };
  const playing = { audio: { playing: true, muted: false } };
  const mutedCtx = { audio: { playing: false, muted: true } };

  it("play announces the track and asks the player to start", () => {
    const result = execute("play", idle);
    expect(text(result.blocks)).toContain("now playing: Honey Jam by Massobeats");
    expect(result.actions).toEqual([{ type: "lofi", op: "play" }]);
  });

  it("play says so when sound was off, and still starts", () => {
    const result = execute("play", mutedCtx);
    expect(text(result.blocks)).toContain("sound was off, turning it on");
    expect(result.actions).toEqual([{ type: "lofi", op: "play" }]);
  });

  it("play while already playing does nothing", () => {
    const result = execute("play", playing);
    expect(text(result.blocks)).toContain("already playing: Honey Jam by Massobeats");
    expect(result.actions).toEqual([]);
  });

  it("stop stops, or says nothing is playing", () => {
    expect(execute("stop", playing).actions).toEqual([{ type: "lofi", op: "stop" }]);
    const none = execute("stop", idle);
    expect(text(none.blocks)).toContain("nothing is playing");
    expect(none.actions).toEqual([]);
  });

  it("rejects extra arguments", () => {
    expect(execute("play now", idle).blocks[0].type).toBe("error");
    expect(execute("stop now", playing).blocks[0].type).toBe("error");
  });
});
