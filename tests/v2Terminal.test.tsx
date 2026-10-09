// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import Terminal from "@/components/terminal/Terminal";

/** Arrow-key history and Tab completion, through the real Terminal. */

class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const log = () => screen.getByRole("log").textContent ?? "";
const input = () => screen.getByLabelText("Terminal command input") as HTMLInputElement;
const count = (text: string) => log().split(text).length - 1;

async function wait(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}
const key = (name: string, init: Partial<KeyboardEventInit> = {}) => fireEvent.keyDown(input(), { key: name, ...init });
const type = (text: string) => fireEvent.change(input(), { target: { value: text } });
async function run(text: string) {
  type(text);
  key("Enter");
  await wait(3000);
}

beforeEach(async () => {
  vi.useFakeTimers();
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  render(<Terminal />);
  await wait(6000); // the automatic rosh --help intro
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("arrow-key history", () => {
  it("starts empty: the automatic intro is not the visitor's command", () => {
    key("ArrowUp");
    expect(input().value).toBe("");
  });

  it("up walks back through what you ran, down walks forward and restores your draft", async () => {
    await run("whoami");
    await run("pwd");
    type("dra");
    key("ArrowUp");
    expect(input().value).toBe("pwd");
    key("ArrowUp");
    expect(input().value).toBe("whoami");
    key("ArrowUp");
    expect(input().value).toBe("whoami"); // stops at the oldest
    key("ArrowDown");
    expect(input().value).toBe("pwd");
    key("ArrowDown");
    expect(input().value).toBe("dra"); // your draft is back
    key("ArrowDown");
    expect(input().value).toBe("dra");
  });

  it("a recalled command can be run again with Enter", async () => {
    await run("whoami");
    key("ArrowUp");
    key("Enter");
    await wait(3000);
    expect(count("guest")).toBe(2);
  });

  it("a repeat in a row is remembered once", async () => {
    await run("whoami");
    await run("pwd");
    await run("pwd");
    key("ArrowUp");
    expect(input().value).toBe("pwd");
    key("ArrowUp");
    expect(input().value).toBe("whoami");
  });

  it("editing a recalled command starts browsing over from the newest", async () => {
    await run("whoami");
    await run("pwd");
    key("ArrowUp");
    type("pwdx");
    key("ArrowUp");
    expect(input().value).toBe("pwd");
    key("ArrowDown");
    expect(input().value).toBe("pwdx");
  });

  it("the arrow keys do not also move the text caret", async () => {
    await run("whoami");
    expect(key("ArrowUp")).toBe(false); // false = default prevented
    expect(key("ArrowDown")).toBe(false);
  });

  it("clicked commands are remembered too", async () => {
    await run("ls");
    fireEvent.click(screen.getByRole("button", { name: "games" }));
    await wait(5000);
    key("ArrowUp");
    expect(input().value).toBe("ls games");
  });

  it("while output is showing, arrows only skip the animation", async () => {
    await run("whoami");
    type("ls projects");
    key("Enter");
    await wait(80); // mid-reveal
    key("ArrowUp");
    await wait(0);
    expect(input().value).toBe("");
  });

  it("clearing the screen keeps your history", async () => {
    await run("whoami");
    await run("clear");
    key("ArrowUp");
    expect(input().value).toBe("clear");
    key("ArrowUp");
    expect(input().value).toBe("whoami");
  });
});

describe("history command", () => {
  it("lists what you ran, numbered, including itself and not the automatic intro", async () => {
    await run("whoami");
    await run("pwd");
    await run("history");
    expect(log()).toContain("1  whoami");
    expect(log()).toContain("2  pwd");
    expect(log()).toContain("3  history");
    expect(log()).not.toMatch(/\d+ {2}rosh --help/);
  });

  it("with nothing else run yet, lists just itself", async () => {
    await run("history");
    expect(log()).toContain("1  history");
  });

  it("clicking a row runs that command again", async () => {
    await run("whoami");
    await run("history");
    fireEvent.click(screen.getByRole("button", { name: /whoami/ }));
    await wait(5000);
    expect(count("guest")).toBe(2);
  });
});

describe("Tab completion", () => {
  it("completes a command, adding a space only when it takes an argument", async () => {
    type("fastf");
    key("Tab");
    expect(input().value).toBe("fastfetch");
    type("l");
    key("Tab");
    expect(input().value).toBe("ls ");
  });

  it("completes an argument", async () => {
    type("ls pro");
    key("Tab");
    expect(input().value).toBe("ls projects");
    type("cat exp");
    key("Tab");
    expect(input().value).toBe("cat experience.txt");
  });

  it("a completed line runs", async () => {
    type("whoam"); // hidden: not completed
    key("Tab");
    expect(input().value).toBe("whoam");
    type("ls pro");
    key("Tab");
    key("Enter");
    await wait(3000);
    expect(log()).toContain("projects");
  });

  it("with several options and nothing more to add, the first Tab does nothing and the second lists them", async () => {
    type("c");
    key("Tab");
    expect(input().value).toBe("c");
    expect(log()).not.toContain("cat  clear");
    key("Tab");
    expect(log()).toContain("cat  clear");
    expect(input().value).toBe("c"); // what you typed is still there
  });

  it("after the options are listed you can keep typing and run normally", async () => {
    type("c");
    key("Tab");
    key("Tab");
    type("cat");
    key("Enter");
    await wait(3000);
    expect(log()).toContain("files:");
  });

  it("listing options is not a command: it stays out of the history", async () => {
    await run("whoami");
    type("c");
    key("Tab");
    key("Tab");
    type("");
    key("ArrowUp");
    expect(input().value).toBe("whoami");
  });

  it("never completes or lists hidden commands", async () => {
    for (const start of ["fort", "whoam", "pw", "hell"]) {
      type(start);
      key("Tab");
      key("Tab");
      expect(input().value).toBe(start);
    }
    expect(log()).not.toContain("fortune");
  });

  it("does nothing when there is nothing to complete", async () => {
    type("zzz");
    expect(key("Tab")).toBe(false); // still handled, so focus does not jump away
    expect(input().value).toBe("zzz");
  });

  it("keeps Tab for moving focus when the prompt is empty or blank, and for Shift+Tab", async () => {
    expect(key("Tab")).toBe(true); // true = not prevented: the browser moves focus
    type("   ");
    expect(key("Tab")).toBe(true);
    type("ls");
    expect(key("Tab", { shiftKey: true })).toBe(true);
    expect(key("Tab", { ctrlKey: true })).toBe(true);
    expect(key("Tab")).toBe(false); // with text typed, Tab completes
  });

  it("while output is showing, Tab only skips the animation", async () => {
    type("ls projects");
    key("Enter");
    await wait(80);
    key("Tab");
    await wait(0);
    expect(input().value).toBe("");
  });
});
