import { describe, expect, it } from "vitest";
import { findPack, resolvePack } from "@/lib/packs";

const packs = [{ name: "alpaca" }, { name: "bluealps" }, { name: "mxblack" }];

describe("findPack", () => {
  it("matches case-insensitively and returns the real folder name", () => {
    expect(findPack("BlueAlps", packs)?.name).toBe("bluealps");
  });
  it("returns nothing for unknown, empty or missing names", () => {
    expect(findPack("nope", packs)).toBeUndefined();
    expect(findPack("", packs)).toBeUndefined();
    expect(findPack(null, packs)).toBeUndefined();
    expect(findPack("constructor", packs)).toBeUndefined();
  });
});

describe("resolvePack", () => {
  it("prefers the visitor's saved choice", () => {
    expect(resolvePack("mxblack", "alpaca", packs)).toBe("mxblack");
  });
  it("falls back to the configured default when the saved pack is gone", () => {
    expect(resolvePack("removed", "bluealps", packs)).toBe("bluealps");
    expect(resolvePack(null, "bluealps", packs)).toBe("bluealps");
  });
  it("falls back to the first installed pack when the default is not installed", () => {
    expect(resolvePack(null, "topre", packs)).toBe("alpaca");
  });
  it("returns null when nothing is installed", () => {
    expect(resolvePack("alpaca", "alpaca", [])).toBeNull();
  });
});
