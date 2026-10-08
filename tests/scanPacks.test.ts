import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// @ts-expect-error plain .mjs script without type declarations
import { scanPacks } from "../scripts/keyboard-packs.mjs";

let dir: string;

function touch(...parts: string[]) {
  const file = join(dir, ...parts);
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, "");
}

function pack(name: string, opts: { generic?: string[]; press?: string[]; release?: string[] } = {}) {
  const generic = opts.generic ?? ["GENERIC_R0", "GENERIC_R1", "GENERIC_R2"];
  for (const file of [...generic, ...(opts.press ?? ["BACKSPACE", "ENTER", "SPACE"])]) touch(name, "press", `${file}.mp3`);
  for (const file of opts.release ?? ["GENERIC", "BACKSPACE", "ENTER", "SPACE"]) touch(name, "release", `${file}.mp3`);
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "keys-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("scanPacks", () => {
  it("returns nothing for an empty or missing folder", () => {
    expect(scanPacks(dir)).toEqual({ packs: [], skipped: [] });
    expect(scanPacks(join(dir, "does-not-exist"))).toEqual({ packs: [], skipped: [] });
  });

  it("finds complete packs, sorted by name, with their generic files", () => {
    pack("bluealps", { generic: ["GENERIC_R0", "GENERIC_R1"] });
    pack("alpaca");
    const { packs, skipped } = scanPacks(dir);
    expect(skipped).toEqual([]);
    expect(packs).toEqual([
      { name: "alpaca", generic: ["GENERIC_R0", "GENERIC_R1", "GENERIC_R2"], release: true },
      { name: "bluealps", generic: ["GENERIC_R0", "GENERIC_R1"], release: true },
    ]);
  });

  it("sorts generic files numerically and tolerates gaps in the numbering", () => {
    pack("odd", { generic: ["GENERIC_R10", "GENERIC_R2", "GENERIC_R0"] });
    expect(scanPacks(dir).packs[0].generic).toEqual(["GENERIC_R0", "GENERIC_R2", "GENERIC_R10"]);
  });

  it("marks a pack without a full release/ folder as press-only", () => {
    pack("pressonly", { release: ["ENTER"] });
    expect(scanPacks(dir).packs[0]).toMatchObject({ name: "pressonly", release: false });
  });

  it("skips a pack with missing press files and says exactly which", () => {
    pack("broken", { press: ["ENTER"] });
    const { packs, skipped } = scanPacks(dir);
    expect(packs).toEqual([]);
    expect(skipped).toEqual([{ name: "broken", missing: ["press/BACKSPACE.mp3", "press/SPACE.mp3"] }]);
  });

  it("skips a pack with no generic key sounds", () => {
    pack("nogeneric", { generic: [] });
    expect(scanPacks(dir).skipped[0].missing).toEqual(["press/GENERIC_R0.mp3"]);
  });

  it("ignores stray files such as .gitkeep", () => {
    touch(".gitkeep");
    pack("alpaca");
    expect(scanPacks(dir).packs.map((p: { name: string }) => p.name)).toEqual(["alpaca"]);
  });
});
