// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import App from "@/App";
import Terminal from "@/components/terminal/Terminal";
import { projects } from "@/data/projects";
import { playKey } from "@/services/keySound";
import { getAudioState, resetAudioState } from "@/services/audioStore";

// Key sounds are checked through this spy: real audio cannot run in a test.
vi.mock("@/services/keySound", () => ({
  playKey: vi.fn(),
  prefetchKeySounds: vi.fn(),
  unlockKeySounds: vi.fn(),
}));

class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const log = () => screen.getByRole("log").textContent ?? "";
const input = () => screen.getByLabelText("Terminal command input") as HTMLInputElement;

async function wait(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

async function typeAndEnter(text: string) {
  fireEvent.change(input(), { target: { value: text } });
  fireEvent.keyDown(input(), { key: "Enter" });
  await wait(0);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  vi.mocked(playKey).mockClear();
  resetAudioState();
  window.localStorage.clear();
  render(<Terminal />);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("terminal core loop", () => {
  it("auto-types and runs `rosh --help` on load", async () => {
    expect(log()).not.toContain("rosh --help");
    await wait(5000);
    expect(log()).toContain("rosh --help");
    expect(log()).toContain("type a command, or click one:");
    expect(log()).toContain("clear the screen");
  });

  it("runs a typed command on Enter and shows the output above a fresh prompt", async () => {
    await wait(5000);
    await typeAndEnter("foo");
    await wait(2000);
    expect(log()).toContain("command not found: foo");
    expect(log()).toContain("use rosh -h or rosh --help to view commands");
    expect(input().value).toBe("");
  });

  it("locks input while output is showing, and any key skips to the end", async () => {
    await wait(5000);
    await typeAndEnter("foo");
    // mid-reveal: the first line is out, the hint line is not yet
    await wait(80);
    expect(log()).toContain("command not found: foo");
    expect(log()).not.toContain("use rosh -h");
    // typing while busy is ignored
    fireEvent.change(input(), { target: { value: "ignored" } });
    expect(input().value).toBe("");
    // any key finishes the reveal
    fireEvent.keyDown(input(), { key: "x" });
    await wait(0);
    expect(log()).toContain("use rosh -h or rosh --help to view commands");
  });

  it("ignores Enter on an empty line except for adding a blank prompt line", async () => {
    await wait(5000);
    await typeAndEnter("   ");
    await wait(500);
    expect(log()).not.toContain("command not found");
  });

  it("types and runs a command when it is clicked in the output", async () => {
    await wait(5000);
    fireEvent.click(screen.getByRole("button", { name: "clear" }));
    await wait(5000);
    // `clear` empties the screen entirely
    expect(log()).not.toContain("clear the screen");
  });

  it("does not run the boot command if the visitor already acted", async () => {
    fireEvent.change(input(), { target: { value: "foo" } });
    await wait(5000);
    expect(log()).not.toContain("type a command, or click one:");
  });

  it("click a project in `ls projects`, read it, then click run to open it", async () => {
    const open = vi.fn();
    vi.stubGlobal("open", open);
    const project = projects[0];

    await wait(5000);
    await typeAndEnter("ls projects");
    await wait(2000);
    expect(log()).toContain(project.tagline);

    fireEvent.click(screen.getByRole("button", { name: project.slug }));
    await wait(5000);
    expect(log()).toContain(`cat ${project.slug}.txt`);
    expect(log()).toContain(project.description.split("\n")[0]);
    expect(open).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: `run ${project.slug}` }));
    await wait(5000);
    expect(open).toHaveBeenCalledWith(project.url, "_blank", "noopener,noreferrer");
  });

  it("renders fastfetch with the logo image and details", async () => {
    await wait(5000);
    await typeAndEnter("fastfetch");
    await wait(2000);
    const logo = screen.getByRole("img");
    expect(logo.getAttribute("src")).toBe("/logo.svg");
    expect(log()).toContain("Age:");
    expect(log()).toContain("About:");
  });

  it("shows stack.json line by line and keeps the links external", async () => {
    await wait(5000);
    await typeAndEnter("cat stack.json");
    await wait(3000);
    expect(log()).toContain('"frontend"');
    await typeAndEnter("cat connect.txt");
    await wait(3000);
    const github = screen.getByRole("link", { name: /github\.com/ });
    expect(github.getAttribute("target")).toBe("_blank");
    expect(github.getAttribute("rel")).toContain("noopener");
  });
});

describe("keyboard sound", () => {
  it("is silent for the auto-run on load and for everything the terminal prints", async () => {
    await wait(6000);
    expect(log()).toContain("type a command, or click one:");
    expect(playKey).not.toHaveBeenCalled();
  });

  it("is silent while a clicked command types itself and while its output shows", async () => {
    await wait(5000);
    fireEvent.click(screen.getByRole("button", { name: "ls projects" }));
    await wait(5000);
    expect(log()).toContain(projects[0].tagline);
    expect(playKey).not.toHaveBeenCalled();
  });

  it("plays the right sound for each real key press", async () => {
    await wait(5000);
    fireEvent.keyDown(input(), { key: "a" });
    fireEvent.keyDown(input(), { key: " " });
    fireEvent.keyDown(input(), { key: "Backspace" });
    fireEvent.keyDown(input(), { key: "Enter" });
    expect(vi.mocked(playKey).mock.calls).toEqual([
      ["generic", "press"],
      ["space", "press"],
      ["backspace", "press"],
      ["enter", "press"],
    ]);
  });

  it("ignores modifier keys on their own", async () => {
    await wait(5000);
    fireEvent.keyDown(input(), { key: "Shift" });
    fireEvent.keyDown(input(), { key: "Control" });
    expect(playKey).not.toHaveBeenCalled();
  });

  it("does not play release sounds unless they are switched on", async () => {
    await wait(5000);
    fireEvent.keyUp(input(), { key: "a" });
    expect(playKey).not.toHaveBeenCalled();
  });

  it("still plays on the key that skips an animation, but not for the output it reveals", async () => {
    await wait(5000);
    await typeAndEnter("foo");
    vi.mocked(playKey).mockClear();
    await wait(80); // mid-reveal
    expect(playKey).not.toHaveBeenCalled();
    fireEvent.keyDown(input(), { key: "x" });
    expect(playKey).toHaveBeenCalledTimes(1);
  });

  it("uses the text change on virtual keyboards, where key events say nothing", async () => {
    await wait(5000);
    fireEvent.keyDown(input(), { key: "Unidentified", keyCode: 229 });
    expect(playKey).not.toHaveBeenCalled(); // decided from the text instead
    fireEvent.change(input(), { target: { value: "a" } });
    fireEvent.keyDown(input(), { key: "Unidentified", keyCode: 229 });
    fireEvent.change(input(), { target: { value: "a " } });
    fireEvent.keyDown(input(), { key: "Unidentified", keyCode: 229 });
    fireEvent.change(input(), { target: { value: "a" } });
    expect(vi.mocked(playKey).mock.calls).toEqual([
      ["generic", "press"],
      ["space", "press"],
      ["backspace", "press"],
    ]);
  });
});

describe("lofi and the status bar", () => {
  beforeEach(() => {
    cleanup(); // replace the Terminal rendered above with the full app
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    render(<App />);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the sound toggle and flips it", async () => {
    const toggle = screen.getByRole("button", { name: "Toggle sound" });
    expect(toggle.textContent).toBe("[sound: on]");
    fireEvent.click(toggle);
    expect(toggle.textContent).toBe("[sound: off]");
    expect(getAudioState().muted).toBe(true);
    expect(window.localStorage.getItem("rosh:prefs")).toContain('"muted":true');
  });

  it("play starts the track and shows it in the status bar; stop clears it", async () => {
    await wait(5000);
    await typeAndEnter("play");
    await wait(3000);
    expect(log()).toContain("now playing: Honey Jam by Massobeats");
    expect(getAudioState().playing).toBe(true);
    expect(screen.getByRole("banner").textContent).toContain("now playing: Honey Jam by Massobeats");
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();

    await typeAndEnter("stop");
    await wait(3000);
    expect(log()).toContain("stopped");
    expect(getAudioState().playing).toBe(false);
    expect(screen.getByRole("banner").textContent).not.toContain("now playing");
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });

  it("play turns sound back on if it was off", async () => {
    fireEvent.click(screen.getByRole("button", { name: "Toggle sound" }));
    expect(getAudioState().muted).toBe(true);
    await wait(5000);
    await typeAndEnter("play");
    await wait(3000);
    expect(log()).toContain("sound was off, turning it on");
    expect(getAudioState().muted).toBe(false);
  });

  it("a missing or broken track clears the now-playing text instead of lying", async () => {
    await wait(5000);
    await typeAndEnter("play");
    await wait(3000);
    expect(getAudioState().playing).toBe(true);
    const audio = document.querySelector("audio") ?? undefined;
    // the lofi element is created in memory; find it through the spied play() call
    const element = vi.mocked(HTMLMediaElement.prototype.play).mock.contexts.at(-1) as HTMLAudioElement | undefined;
    expect(audio ?? element).toBeDefined();
    act(() => {
      element?.dispatchEvent(new Event("error"));
    });
    expect(getAudioState().playing).toBe(false);
  });
});
