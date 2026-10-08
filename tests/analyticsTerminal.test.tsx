// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import Terminal from "@/components/terminal/Terminal";
import { projects } from "@/data/projects";

/** Which terminal actions reach analytics: typed commands and clicks yes, the automatic intro no. */

class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const makeTrack = () => vi.fn<(event: string, data?: Record<string, string | number>) => void>();
let track: ReturnType<typeof makeTrack>;
const input = () => screen.getByLabelText("Terminal command input") as HTMLInputElement;
const log = () => screen.getByRole("log").textContent ?? "";
const names = () => track.mock.calls.filter((call) => call[0] === "command").map((call) => call[1]?.name);

async function wait(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}
async function typeAndEnter(text: string) {
  fireEvent.change(input(), { target: { value: text } });
  fireEvent.keyDown(input(), { key: "Enter" });
  await wait(3000);
}

beforeEach(async () => {
  vi.useFakeTimers();
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  track = makeTrack();
  window.umami = { track };
  render(<Terminal />);
});
afterEach(() => {
  cleanup();
  delete window.umami;
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("analytics in the terminal", () => {
  it("does not count the automatic intro (rosh --help on load)", async () => {
    await wait(6000);
    expect(log()).toContain("type a command, or click one:");
    expect(track).not.toHaveBeenCalled();
  });

  it("counts a command the visitor types", async () => {
    await wait(6000);
    await typeAndEnter("whoami");
    expect(names()).toEqual(["whoami"]);
  });

  it("counts a command the visitor clicks, even though it types itself", async () => {
    await wait(6000);
    fireEvent.click(screen.getByRole("button", { name: "ls projects" }));
    await wait(5000);
    expect(names()).toEqual(["ls"]);
  });

  it("counts reading and opening a project through the clicks", async () => {
    vi.stubGlobal("open", vi.fn());
    const { slug } = projects[0];
    await wait(6000);
    await typeAndEnter("ls projects");
    fireEvent.click(screen.getByRole("button", { name: slug }));
    await wait(5000);
    fireEvent.click(screen.getByRole("button", { name: `run ${slug}` }));
    await wait(5000);
    expect(track.mock.calls.map((call) => call[0])).toEqual([
      "command", // ls projects
      "command", // cat <slug>.txt
      "project-view",
      "command", // run <slug>
      "project-open",
    ]);
  });

  it("counts an unknown command as just 'unknown'", async () => {
    await wait(6000);
    await typeAndEnter("please-do-not-record-this");
    expect(track.mock.calls).toEqual([["command", { name: "unknown" }]]);
    expect(JSON.stringify(track.mock.calls)).not.toContain("record");
  });

  it("does not count an empty Enter", async () => {
    await wait(6000);
    await typeAndEnter("   ");
    expect(track).not.toHaveBeenCalled();
  });

  it("keeps working when analytics is not loaded at all", async () => {
    delete window.umami;
    await wait(6000);
    await typeAndEnter("whoami");
    expect(log()).toContain("guest");
  });
});
