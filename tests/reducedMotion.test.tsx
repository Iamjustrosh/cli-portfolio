// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * With "reduce motion" switched on, nothing animates: the boot command appears at
 * once instead of being typed, and its output shows all at once instead of line
 * by line. Motion reads the preference once when it loads, so this file only
 * covers the "reduce" case and normalMotion.test.tsx covers the other.
 */

class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function setReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) => ({
      matches: reduce && query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }),
  );
}

async function renderTerminal() {
  vi.resetModules();
  const { render, act, screen } = await import("@testing-library/react");
  const { default: Terminal } = await import("@/components/terminal/Terminal");
  render(<Terminal />);
  const wait = (ms: number) =>
    act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  const log = () => screen.getByRole("log").textContent ?? "";
  return { wait, log };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
});

afterEach(async () => {
  const { cleanup } = await import("@testing-library/react");
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("reduced motion", () => {
  it("shows the boot command's whole output almost at once", async () => {
    setReducedMotion(true);
    const { wait, log } = await renderTerminal();
    await wait(900); // with normal motion this is still mid-typing (see normalMotion.test.tsx)
    expect(log()).toContain("rosh --help");
    expect(log()).toContain("clear the screen"); // the last row of the list
  });
});
