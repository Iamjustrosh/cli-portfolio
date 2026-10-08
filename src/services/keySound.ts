import { config } from "@/data/config";
import { keyboardPacks } from "@/data/keyboardPacks";
import type { KeyboardPack } from "@/data/types";
import type { KeyKind } from "@/lib/keys";
import { findPack, resolvePack } from "@/lib/packs";
import { getAudioState } from "./audioStore";
import { readPrefs, writePrefs } from "./preferences";

/**
 * Mechanical keyboard sounds through the Web Audio API: lowest latency, sounds
 * can overlap, and each press gets a tiny random pitch/volume change.
 *
 * The active pack is fetched and decoded at page load (no user gesture needed);
 * other packs are fetched only when the visitor switches to them, then cached.
 * The AudioContext itself is created on the first real key press or click.
 */

type Phase = "press" | "release";

interface Bank {
  generic: AudioBuffer[];
  special: Partial<Record<Exclude<KeyKind, "generic">, AudioBuffer>>;
}
interface Banks {
  press: Bank;
  release: Bank;
}

const MIN_GAP_MS = 25;

const loaded = new Map<string, Banks>();
const loading = new Map<string, Promise<boolean>>();
const lastPlayed: Record<Phase, number> = { press: 0, release: 0 };
let context: AudioContext | null = null;
let lastGeneric = -1;
let switchToken = 0;
let active: string | null = resolvePack(readPrefs().pack, config.keyboard.pack, keyboardPacks);

const emptyBank = (): Bank => ({ generic: [], special: {} });

function url(pack: string, phase: Phase, name: string): string {
  return `${config.keyboard.basePath}/${pack}/${phase}/${name}.mp3`;
}

async function loadPhase(decoder: BaseAudioContext, pack: KeyboardPack, phase: Phase, bank: Bank): Promise<void> {
  const genericNames = phase === "press" ? pack.generic : ["GENERIC"];

  const fetchBuffer = async (name: string): Promise<AudioBuffer | null> => {
    try {
      const response = await fetch(url(pack.name, phase, name));
      if (!response.ok) return null;
      return await decoder.decodeAudioData(await response.arrayBuffer());
    } catch {
      return null; // missing file, wrong type, or no network: just stay quiet
    }
  };

  const [generic, backspace, enter, space] = await Promise.all([
    Promise.all(genericNames.map(fetchBuffer)),
    fetchBuffer("BACKSPACE"),
    fetchBuffer("ENTER"),
    fetchBuffer("SPACE"),
  ]);

  bank.generic = generic.filter((buffer): buffer is AudioBuffer => buffer !== null);
  if (backspace) bank.special.backspace = backspace;
  if (enter) bank.special.enter = enter;
  if (space) bank.special.space = space;
}

/** Fetch and decode one pack (once). Resolves false if it is unknown or its files could not be loaded. */
function loadPack(name: string): Promise<boolean> {
  const existing = loading.get(name);
  if (existing) return existing;

  const pack = findPack(name, keyboardPacks);
  if (!pack || typeof OfflineAudioContext === "undefined" || typeof fetch === "undefined") {
    return Promise.resolve(false);
  }

  // An offline context can decode without any user gesture.
  const decoder = new OfflineAudioContext(1, 1, 44100);
  const banks: Banks = { press: emptyBank(), release: emptyBank() };

  const promise = (async () => {
    await loadPhase(decoder, pack, "press", banks.press);
    if (config.keyboard.playRelease && pack.release) await loadPhase(decoder, pack, "release", banks.release);

    const usable = banks.press.generic.length > 0 || Object.keys(banks.press.special).length > 0;
    if (usable) loaded.set(pack.name, banks);
    else loading.delete(pack.name); // let a later switch try again
    return usable;
  })();

  loading.set(pack.name, promise);
  return promise;
}

/** Start loading the active pack. Safe to call more than once. */
export function prefetchKeySounds(): void {
  if (active) void loadPack(active);
}

/** The pack in use right now (null when no packs are installed). */
export function getActivePack(): string | null {
  return active;
}

function getContext(): AudioContext | null {
  if (!context) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  if (context.state === "suspended") void context.resume();
  return context;
}

/** Call from a user gesture (key press, click, tap) so the browser allows sound. */
export function unlockKeySounds(): void {
  try {
    getContext();
  } catch {
    /* audio unavailable */
  }
}

function pick(kind: KeyKind, phase: Phase): AudioBuffer | undefined {
  const bank = active ? loaded.get(active)?.[phase] : undefined;
  if (!bank) return undefined;
  if (kind !== "generic" && bank.special[kind]) return bank.special[kind];

  const count = bank.generic.length;
  if (count === 0) return undefined;
  if (count === 1) return bank.generic[0];
  let index = Math.floor(Math.random() * count);
  if (index === lastGeneric) index = (index + 1) % count; // never the same clip twice in a row
  lastGeneric = index;
  return bank.generic[index];
}

function play(kind: KeyKind, phase: Phase, ignoreGap: boolean): void {
  try {
    if (getAudioState().muted) return;

    const now = performance.now();
    if (!ignoreGap && now - lastPlayed[phase] < MIN_GAP_MS) return;

    const buffer = pick(kind, phase);
    if (!buffer) return;
    const audio = getContext();
    if (!audio) return;
    lastPlayed[phase] = now;

    const source = audio.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = 1 + (Math.random() - 0.5) * 0.06; // about +/-3% pitch

    const gain = audio.createGain();
    gain.gain.value = config.keyboard.volume * (0.92 + Math.random() * 0.16);

    source.connect(gain);
    gain.connect(audio.destination);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
    };
    source.start();
  } catch {
    /* sound must never break typing */
  }
}

export function playKey(kind: KeyKind, phase: Phase = "press"): void {
  play(kind, phase, false);
}

/**
 * Switch to another installed pack. Loads it first (so there is never a silent gap),
 * remembers the choice, and plays one click so the visitor hears the change.
 * Resolves false, and keeps the current pack, if the pack is unknown, its files
 * fail to load, or a newer switch replaced this one.
 */
export async function setKeyboardPack(name: string): Promise<boolean> {
  const pack = findPack(name, keyboardPacks);
  if (!pack) return false;

  const token = ++switchToken;
  const ok = await loadPack(pack.name);
  if (!ok || token !== switchToken) return false;

  active = pack.name;
  lastGeneric = -1;
  writePrefs({ pack: pack.name });
  play("generic", "press", true); // the Enter that ran the command just clicked, so skip the gap check
  return true;
}
