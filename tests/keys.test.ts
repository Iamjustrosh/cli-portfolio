import { describe, expect, it } from "vitest";
import { classifyInputChange, classifyKey, isVirtualKey } from "@/lib/keys";

describe("classifyKey", () => {
  it("maps the special keys", () => {
    expect(classifyKey(" ")).toBe("space");
    expect(classifyKey("Enter")).toBe("enter");
    expect(classifyKey("Backspace")).toBe("backspace");
  });
  it("uses the generic sound for everything else", () => {
    for (const key of ["a", "Z", "7", "-", "Tab", "ArrowLeft", "Escape", "F5"]) {
      expect(classifyKey(key)).toBe("generic");
    }
  });
  it("is silent for modifier keys on their own", () => {
    for (const key of ["Shift", "Control", "Alt", "Meta", "CapsLock"]) {
      expect(classifyKey(key)).toBeNull();
    }
  });
});

describe("classifyInputChange (virtual keyboards)", () => {
  it("detects typing, space and backspace from the text change", () => {
    expect(classifyInputChange("ab", "abc")).toBe("generic");
    expect(classifyInputChange("ab", "ab ")).toBe("space");
    expect(classifyInputChange("abc", "ab")).toBe("backspace");
    expect(classifyInputChange("abc", "abd")).toBeNull();
  });
});

describe("isVirtualKey", () => {
  it("flags Unidentified and IME key codes", () => {
    expect(isVirtualKey("Unidentified", 0)).toBe(true);
    expect(isVirtualKey("Process", 229)).toBe(true);
    expect(isVirtualKey("a", 65)).toBe(false);
  });
});
