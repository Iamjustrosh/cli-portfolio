import { describe, expect, it } from "vitest";
import { addToHistory, HISTORY_LIMIT, NOT_BROWSING, stepHistory, type Browse } from "@/lib/history";

describe("addToHistory", () => {
  it("adds commands in order, trimmed", () => {
    expect(addToHistory(addToHistory([], "  ls projects "), "pwd")).toEqual(["ls projects", "pwd"]);
  });

  it("skips empty input", () => {
    expect(addToHistory(["a"], "")).toEqual(["a"]);
    expect(addToHistory(["a"], "   ")).toEqual(["a"]);
  });

  it("collapses an immediate repeat, but keeps a repeat that is not immediate", () => {
    expect(addToHistory(["pwd"], "pwd")).toEqual(["pwd"]);
    expect(addToHistory(["pwd", "ls"], "pwd")).toEqual(["pwd", "ls", "pwd"]);
  });

  it("remembers the newest HISTORY_LIMIT commands", () => {
    let entries: string[] = [];
    for (let i = 0; i < HISTORY_LIMIT + 10; i++) entries = addToHistory(entries, `cmd ${i}`);
    expect(entries).toHaveLength(HISTORY_LIMIT);
    expect(entries[0]).toBe("cmd 10");
    expect(entries[entries.length - 1]).toBe(`cmd ${HISTORY_LIMIT + 9}`);
  });

  it("never changes the array it was given", () => {
    const original = ["a"];
    addToHistory(original, "b");
    expect(original).toEqual(["a"]);
  });
});

describe("stepHistory", () => {
  const entries = ["one", "two", "three"];
  const up = (browse: Browse, current = "") => stepHistory(entries, browse, "up", current);
  const down = (browse: Browse, current = "") => stepHistory(entries, browse, "down", current);

  it("does nothing without history", () => {
    expect(stepHistory([], NOT_BROWSING, "up", "x")).toBeNull();
    expect(stepHistory([], NOT_BROWSING, "down", "x")).toBeNull();
  });

  it("up from not browsing shows the newest command and remembers the draft", () => {
    expect(up(NOT_BROWSING, "draft")).toEqual({ browse: { index: 2, draft: "draft" }, value: "three" });
  });

  it("up again walks back and stops at the oldest", () => {
    const first = up(NOT_BROWSING)!;
    const second = up(first.browse)!;
    const third = up(second.browse)!;
    const fourth = up(third.browse)!;
    expect([first.value, second.value, third.value, fourth.value]).toEqual(["three", "two", "one", "one"]);
  });

  it("down walks forward, and past the newest restores the draft", () => {
    let step = up(NOT_BROWSING, "draft")!;
    step = up(step.browse)!; // two
    step = up(step.browse)!; // one
    step = down(step.browse)!;
    expect(step.value).toBe("two");
    step = down(step.browse)!;
    expect(step.value).toBe("three");
    step = down(step.browse)!;
    expect(step).toEqual({ browse: NOT_BROWSING, value: "draft" });
  });

  it("down while not browsing does nothing", () => {
    expect(down(NOT_BROWSING, "typing")).toBeNull();
  });

  it("copes with a position left over from a longer history", () => {
    expect(up({ index: 9, draft: "d" })!.value).toBe("two");
  });
});
