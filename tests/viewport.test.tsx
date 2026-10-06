// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useViewportHeight } from "@/hooks/useViewportHeight";

class FakeViewport extends EventTarget {
  height = 800;
  offsetTop = 0;
  scale = 1;
}

const root = document.documentElement;
const height = () => root.style.getPropertyValue("--app-height");
const top = () => root.style.getPropertyValue("--app-top");

afterEach(() => {
  vi.unstubAllGlobals();
  root.removeAttribute("style");
});

describe("useViewportHeight", () => {
  it("does nothing where visualViewport is unsupported", () => {
    vi.stubGlobal("visualViewport", undefined);
    expect(() => renderHook(() => useViewportHeight())).not.toThrow();
    expect(height()).toBe("");
  });

  it("sizes the app to the visible area, and follows the on-screen keyboard", () => {
    const viewport = new FakeViewport();
    vi.stubGlobal("visualViewport", viewport);
    renderHook(() => useViewportHeight());
    expect(height()).toBe("800px");
    expect(top()).toBe("0px");

    viewport.height = 460; // keyboard opens
    viewport.offsetTop = 12; // and the page pans a little
    viewport.dispatchEvent(new Event("resize"));
    expect(height()).toBe("460px");
    expect(top()).toBe("12px");

    viewport.dispatchEvent(new Event("scroll"));
    expect(height()).toBe("460px");
  });

  it("steps aside while pinch-zoomed", () => {
    const viewport = new FakeViewport();
    vi.stubGlobal("visualViewport", viewport);
    renderHook(() => useViewportHeight());
    viewport.scale = 2.5;
    viewport.dispatchEvent(new Event("resize"));
    expect(height()).toBe("");
    expect(top()).toBe("");
  });

  it("cleans up on unmount", () => {
    const viewport = new FakeViewport();
    vi.stubGlobal("visualViewport", viewport);
    const { unmount } = renderHook(() => useViewportHeight());
    unmount();
    expect(height()).toBe("");
    viewport.height = 300;
    viewport.dispatchEvent(new Event("resize"));
    expect(height()).toBe(""); // listener removed
  });
});
