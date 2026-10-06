// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The other half of reducedMotion.test.tsx: with normal motion, the same moment in
 * time is still mid-typing, so the reduced-motion test proves something real.
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

describe("normal motion", () => {
  it("is still typing the boot command at 900 ms, and finishes later", async () => {
    setReducedMotion(false);
    const { wait, log } = await renderTerminal();
    await wait(900);
    expect(log()).not.toContain("clear the screen");
    await wait(5000);
    expect(log()).toContain("clear the screen");
  });
});
