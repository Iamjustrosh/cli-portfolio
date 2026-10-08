// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAudioState, resetAudioState, setMuted, setPlaying, subscribeAudio, toggleMuted } from "@/services/audioStore";
import { readPrefs, writePrefs } from "@/services/preferences";

beforeEach(() => {
  window.localStorage.clear();
  resetAudioState();
});

describe("audio store", () => {
  it("notifies subscribers only when something changed", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeAudio(listener);
    setPlaying(true);
    setPlaying(true);
    expect(listener).toHaveBeenCalledTimes(1);
    toggleMuted();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    setPlaying(false);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("remembers mute between visits, but not playing", () => {
    setMuted(true);
    setPlaying(true);
    expect(readPrefs()).toEqual({ muted: true, pack: null });
    expect(getAudioState()).toEqual({ muted: true, playing: true });
  });

  it("falls back safely when storage is unavailable or corrupt", () => {
    window.localStorage.setItem("rosh:prefs", "{not json");
    expect(readPrefs()).toEqual({ muted: false, pack: null });
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => setMuted(true)).not.toThrow();
    spy.mockRestore();
  });

  it("saving one choice never wipes the other", () => {
    writePrefs({ pack: "bluealps" });
    setMuted(true); // used to be able to overwrite the whole record
    expect(readPrefs()).toEqual({ muted: true, pack: "bluealps" });
    writePrefs({ pack: "mxblack" });
    expect(readPrefs()).toEqual({ muted: true, pack: "mxblack" });
    setMuted(false);
    expect(readPrefs()).toEqual({ muted: false, pack: "mxblack" });
  });

  it("ignores a saved pack that is not a string", () => {
    window.localStorage.setItem("rosh:prefs", JSON.stringify({ muted: true, pack: 42 }));
    expect(readPrefs()).toEqual({ muted: true, pack: null });
  });
});
