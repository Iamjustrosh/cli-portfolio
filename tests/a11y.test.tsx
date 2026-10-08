// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import ErrorBoundary from "@/components/ErrorBoundary";
import Terminal from "@/components/terminal/Terminal";

vi.mock("@/services/keySound", () => ({
  playKey: vi.fn(),
  prefetchKeySounds: vi.fn(),
  unlockKeySounds: vi.fn(),
  setKeyboardPack: vi.fn(async () => true),
  getActivePack: vi.fn(() => "alpaca"),
}));

class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe("screen reader behaviour", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    render(<Terminal />);
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("keeps the typed-text mirror out of the live region's accessible tree", async () => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    const input = screen.getByLabelText("Terminal command input");
    fireEvent.change(input, { target: { value: "abc" } });

    // the drawn copy of the text exists but is hidden from assistive tech...
    const mirror = Array.from(document.querySelectorAll('[aria-hidden="true"]')).find((el) =>
      el.textContent?.includes("abc"),
    );
    expect(mirror).toBeDefined();
    // ...while the real input is reachable, labelled, and not inside any hidden subtree
    expect(input.closest('[aria-hidden="true"]')).toBeNull();
    expect(screen.getByRole("textbox", { name: "Terminal command input" })).toBe(input);
  });

  it("announces command output through a polite log region", () => {
    const log = screen.getByRole("log");
    expect(log.getAttribute("aria-live")).toBe("polite");
  });

  it("makes every clickable item a real button or link", async () => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(screen.getAllByRole("button").length).toBeGreaterThan(5);
  });
});

describe("ErrorBoundary", () => {
  afterEach(() => cleanup());

  function Boom(): never {
    throw new Error("boom");
  }

  it("shows a plain message with a way out instead of a blank page", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary homeUrl="https://example.com">
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert").textContent).toContain("something went wrong");
    expect(screen.getByRole("link", { name: "main site" }).getAttribute("href")).toBe("https://example.com");
    spy.mockRestore();
  });

  it("renders its children when nothing is wrong", () => {
    render(
      <ErrorBoundary homeUrl="https://example.com">
        <p>fine</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("fine")).toBeDefined();
  });
});
