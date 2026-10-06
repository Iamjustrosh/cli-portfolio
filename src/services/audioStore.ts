import { readPrefs, writePrefs } from "./preferences";

/**
 * Tiny shared store for audio state. Lives outside React so the key sounds,
 * the lofi player, the status bar and the commands all see the same truth
 * without Context. Components subscribe through hooks/useAudio.
 */
export interface AudioState {
  muted: boolean;
  playing: boolean;
}

let state: AudioState = { muted: readPrefs().muted, playing: false };
const listeners = new Set<() => void>();

export function getAudioState(): AudioState {
  return state;
}

export function subscribeAudio(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function update(patch: Partial<AudioState>): void {
  const next = { ...state, ...patch };
  if (next.muted === state.muted && next.playing === state.playing) return;
  state = next;
  listeners.forEach((listener) => listener());
}

export function setMuted(muted: boolean): void {
  update({ muted });
  writePrefs({ muted });
}

export function toggleMuted(): void {
  setMuted(!state.muted);
}

export function setPlaying(playing: boolean): void {
  update({ playing });
}

/** Test helper. */
export function resetAudioState(): void {
  state = { muted: false, playing: false };
  listeners.forEach((listener) => listener());
}
