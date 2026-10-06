// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Exercises the REAL keySound module against a fake fetch and a fake Web Audio,
 * so loading, file mapping, picking, throttling and muting are all checked.
 * Each fake "decoded buffer" is just { url }, so a test can see which file played.
 */

interface FakeSource {
  buffer: { url: string };
  playbackRate: { value: number };
  start: ReturnType<typeof vi.fn>;
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  onended: (() => void) | null;
}
interface FakeGain {
  gain: { value: number };
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}

let fetched: string[];
let missing: Set<string>;
let sources: FakeSource[];
let gains: FakeGain[];
let now: number;

function installFakes() {
  fetched = [];
  sources = [];
  gains = [];
  now = 1000;
  vi.spyOn(performance, "now").mockImplementation(() => now);

  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      fetched.push(url);
      return {
        ok: !missing.has(url),
        arrayBuffer: async () => new TextEncoder().encode(url).buffer,
      };
    }),
  );
  vi.stubGlobal(
    "OfflineAudioContext",
    class {
      async decodeAudioData(data: ArrayBuffer) {
        return { url: new TextDecoder().decode(data) };
      }
    },
  );
  vi.stubGlobal(
    "AudioContext",
    class {
      state = "running";
      destination = {};
      resume = vi.fn();
      createBufferSource(): FakeSource {
        const source: FakeSource = {
          buffer: { url: "" },
          playbackRate: { value: 1 },
          start: vi.fn(),
          connect: vi.fn(),
          disconnect: vi.fn(),
          onended: null,
        };
        sources.push(source);
        return source;
      }
      createGain(): FakeGain {
        const gain: FakeGain = { gain: { value: 1 }, connect: vi.fn(), disconnect: vi.fn() };
        gains.push(gain);
        return gain;
      }
    },
  );
}

async function load() {
  vi.resetModules();
  const keySound = await import("@/services/keySound");
  const store = await import("@/services/audioStore");
  const { config } = await import("@/data/config");
  store.resetAudioState();
  return { ...keySound, ...store, config };
}

/** Let the prefetch promises settle. */
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const played = () => sources.map((source) => source.buffer.url.split("/").pop());
const tick = (ms = 100) => {
  now += ms;
};

beforeEach(() => {
  missing = new Set();
  installFakes();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("loading", () => {
  it("fetches the press files of the chosen pack, and nothing else", async () => {
    const { prefetchKeySounds, config } = await load();
    prefetchKeySounds();
    await settle();
    const base = `${config.keyboard.basePath}/${config.keyboard.pack}/press`;
    expect(new Set(fetched)).toEqual(
      new Set([
        `${base}/GENERIC_R0.mp3`,
        `${base}/GENERIC_R1.mp3`,
        `${base}/GENERIC_R2.mp3`,
        `${base}/GENERIC_R3.mp3`,
        `${base}/GENERIC_R4.mp3`,
        `${base}/BACKSPACE.mp3`,
        `${base}/ENTER.mp3`,
        `${base}/SPACE.mp3`,
      ]),
    );
  });

  it("loads the release files too when playRelease is on", async () => {
    const { prefetchKeySounds, config } = await load();
    config.keyboard.playRelease = true;
    prefetchKeySounds();
    await settle();
    const release = fetched.filter((url) => url.includes("/release/")).map((url) => url.split("/").pop());
    expect(new Set(release)).toEqual(new Set(["GENERIC.mp3", "BACKSPACE.mp3", "ENTER.mp3", "SPACE.mp3"]));
    config.keyboard.playRelease = false;
  });

  it("only loads once, however many times it is called", async () => {
    const { prefetchKeySounds } = await load();
    prefetchKeySounds();
    prefetchKeySounds();
    await settle();
    expect(fetched).toHaveLength(8);
  });

  it("survives missing files and a missing Web Audio API", async () => {
    const { prefetchKeySounds, playKey } = await load();
    vi.stubGlobal("OfflineAudioContext", undefined);
    expect(() => prefetchKeySounds()).not.toThrow();
    expect(() => playKey("generic")).not.toThrow();
  });
});

describe("playing", () => {
  it("plays the file that matches each special key", async () => {
    const { prefetchKeySounds, playKey } = await load();
    prefetchKeySounds();
    await settle();
    playKey("space");
    tick();
    playKey("enter");
    tick();
    playKey("backspace");
    expect(played()).toEqual(["SPACE.mp3", "ENTER.mp3", "BACKSPACE.mp3"]);
    expect(sources.every((source) => source.start.mock.calls.length === 1)).toBe(true);
  });

  it("uses a random generic clip for other keys, never the same one twice in a row", async () => {
    const { prefetchKeySounds, playKey } = await load();
    prefetchKeySounds();
    await settle();
    for (let i = 0; i < 80; i++) {
      playKey("generic");
      tick();
    }
    const names = played();
    expect(names.every((name) => /^GENERIC_R[0-4]\.mp3$/.test(name ?? ""))).toBe(true);
    expect(new Set(names).size).toBeGreaterThan(1);
    for (let i = 1; i < names.length; i++) expect(names[i]).not.toBe(names[i - 1]);
  });

  it("falls back to a generic clip when a special file is missing", async () => {
    missing.add("/audio/keys/alpaca/press/BACKSPACE.mp3");
    const { prefetchKeySounds, playKey } = await load();
    prefetchKeySounds();
    await settle();
    playKey("backspace");
    expect(played()[0]).toMatch(/^GENERIC_R\d\.mp3$/);
  });

  it("varies pitch (about +/-3%) and volume a little on every press", async () => {
    const { prefetchKeySounds, playKey, config } = await load();
    prefetchKeySounds();
    await settle();
    for (let i = 0; i < 40; i++) {
      playKey("generic");
      tick();
    }
    for (const source of sources) {
      expect(source.playbackRate.value).toBeGreaterThanOrEqual(0.97);
      expect(source.playbackRate.value).toBeLessThanOrEqual(1.03);
    }
    for (const gain of gains) {
      expect(gain.gain.value).toBeGreaterThanOrEqual(config.keyboard.volume * 0.92 - 1e-9);
      expect(gain.gain.value).toBeLessThanOrEqual(config.keyboard.volume * 1.08 + 1e-9);
    }
    expect(new Set(sources.map((source) => source.playbackRate.value)).size).toBeGreaterThan(1);
  });

  it("lets sounds overlap: a new press never cuts the previous one off", async () => {
    const { prefetchKeySounds, playKey } = await load();
    prefetchKeySounds();
    await settle();
    playKey("generic");
    tick(40);
    playKey("generic");
    expect(sources).toHaveLength(2);
    expect(sources[0].start).toHaveBeenCalledTimes(1);
  });

  it("skips a press that arrives within 25 ms of the last one", async () => {
    const { prefetchKeySounds, playKey } = await load();
    prefetchKeySounds();
    await settle();
    playKey("generic");
    tick(10);
    playKey("generic");
    expect(sources).toHaveLength(1);
    tick(30);
    playKey("generic");
    expect(sources).toHaveLength(2);
  });

  it("is silent while sound is off, and works again when it is back on", async () => {
    const { prefetchKeySounds, playKey, setMuted } = await load();
    prefetchKeySounds();
    await settle();
    setMuted(true);
    playKey("generic");
    expect(sources).toHaveLength(0);
    setMuted(false);
    tick();
    playKey("generic");
    expect(sources).toHaveLength(1);
  });

  it("is silent (no error) before the files have loaded", async () => {
    const { playKey } = await load();
    expect(() => playKey("generic")).not.toThrow();
    expect(sources).toHaveLength(0);
  });

  it("cleans up each sound when it ends", async () => {
    const { prefetchKeySounds, playKey } = await load();
    prefetchKeySounds();
    await settle();
    playKey("generic");
    sources[0].onended?.();
    expect(sources[0].disconnect).toHaveBeenCalled();
    expect(gains[0].disconnect).toHaveBeenCalled();
  });

  it("plays release sounds from the release bank only", async () => {
    const { prefetchKeySounds, playKey, config } = await load();
    config.keyboard.playRelease = true;
    prefetchKeySounds();
    await settle();
    playKey("enter", "release");
    tick();
    playKey("generic", "release");
    expect(sources.map((source) => source.buffer.url)).toEqual([
      "/audio/keys/alpaca/release/ENTER.mp3",
      "/audio/keys/alpaca/release/GENERIC.mp3",
    ]);
    config.keyboard.playRelease = false;
  });
});
