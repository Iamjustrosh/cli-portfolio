// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { performAction } from "@/services/actions";
import { cancelLeaving, watchPageShow } from "@/services/leave";
import { navigate } from "@/services/navigate";

vi.mock("@/services/navigate", () => ({ navigate: vi.fn() }));

const leaving = () => document.documentElement.dataset.leaving;

function reducedMotion(on: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: on && query.includes("reduce") }));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(navigate).mockClear();
  cancelLeaving();
  reducedMotion(false);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("exit redirect", () => {
  it("fades the page out so the fade ends as the redirect happens", () => {
    performAction({ type: "redirect", url: "https://example.com", delayMs: 900 });
    vi.advanceTimersByTime(340);
    expect(leaving()).toBeUndefined();
    vi.advanceTimersByTime(20); // 360 ms = 900 - 550 fade, rounded up by the 20 ms step
    expect(leaving()).toBe("true");
    expect(navigate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(540);
    expect(navigate).toHaveBeenCalledWith("https://example.com");
  });

  it("redirects without any fade when the visitor prefers reduced motion", () => {
    reducedMotion(true);
    performAction({ type: "redirect", url: "https://example.com", delayMs: 900 });
    vi.advanceTimersByTime(900);
    expect(leaving()).toBeUndefined();
    expect(navigate).toHaveBeenCalledWith("https://example.com");
  });

  it("redirects immediately when there is no delay", () => {
    performAction({ type: "redirect", url: "https://example.com" });
    expect(navigate).toHaveBeenCalledWith("https://example.com");
    expect(leaving()).toBeUndefined();
  });

  it("undoes the fade when the page comes back from the browser cache (Back button)", () => {
    const stop = watchPageShow();
    document.documentElement.dataset.leaving = "true";
    window.dispatchEvent(Object.assign(new Event("pageshow"), { persisted: false }));
    expect(leaving()).toBe("true");
    window.dispatchEvent(Object.assign(new Event("pageshow"), { persisted: true }));
    expect(leaving()).toBeUndefined();
    stop();
  });
});
