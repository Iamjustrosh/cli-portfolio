import { config } from "@/data/config";
import type { KeyKind } from "@/lib/keys";
import { getAudioState } from "./audioStore";

/**
 * Mechanical keyboard sounds through the Web Audio API: lowest latency, sounds
 * can overlap, and each press gets a tiny random pitch/volume change.
 *
 * Files are fetched and decoded at page load (no user gesture needed), and the
 * AudioContext itself is created on the first real key press or click.
 */

type Phase = "press" | "release";

interface Bank {
  generic: AudioBuffer[];
  special: Partial<Record<Exclude<KeyKind, "generic">, AudioBuffer>>;
}

const banks: Record<Phase, Bank> = {
  press: { generic: [], special: {} },
  release: { generic: [], special: {} },
};

const MIN_GAP_MS = 25;
let context: AudioContext | null = null;
let loading: Promise<void> | null = null;
const lastPlayed: Record<Phase, number> = { press: 0, release: 0 };
let lastGeneric = -1;

function url(phase: Phase, name: string): string {
  const { basePath, pack } = config.keyboard;
  return `${basePath}/${pack}/${phase}/${name}.mp3`;
}

async function load(decoder: BaseAudioContext, phase: Phase): Promise<void> {
  const { genericVariants } = config.keyboard;
  const genericNames =
    phase === "press"
      ? Array.from({ length: genericVariants }, (_, i) => `GENERIC_R${i}`)
      : ["GENERIC"];

  const fetchBuffer = async (name: string): Promise<AudioBuffer | null> => {
    try {
      const response = await fetch(url(phase, name));
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

  banks[phase].generic = generic.filter((buffer): buffer is AudioBuffer => buffer !== null);
  if (backspace) banks[phase].special.backspace = backspace;
  if (enter) banks[phase].special.enter = enter;
  if (space) banks[phase].special.space = space;
}

/** Start fetching and decoding. Safe to call more than once. */
export function prefetchKeySounds(): void {
  if (loading || typeof OfflineAudioContext === "undefined" || typeof fetch === "undefined") return;
  // An offline context can decode without any user gesture.
  const decoder = new OfflineAudioContext(1, 1, 44100);
  loading = Promise.all([
    load(decoder, "press"),
    config.keyboard.playRelease ? load(decoder, "release") : Promise.resolve(),
  ]).then(() => undefined);
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
  const bank = banks[phase];
  if (kind !== "generic" && bank.special[kind]) return bank.special[kind];

  const count = bank.generic.length;
  if (count === 0) return undefined;
  if (count === 1) return bank.generic[0];
  let index = Math.floor(Math.random() * count);
  if (index === lastGeneric) index = (index + 1) % count; // never the same clip twice in a row
  lastGeneric = index;
  return bank.generic[index];
}

export function playKey(kind: KeyKind, phase: Phase = "press"): void {
  try {
    if (getAudioState().muted) return;

    const now = performance.now();
    if (now - lastPlayed[phase] < MIN_GAP_MS) return;

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
