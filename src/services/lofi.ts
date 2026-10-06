import { config } from "@/data/config";
import { getAudioState, setMuted, setPlaying, subscribeAudio } from "./audioStore";

/**
 * One looping, streamed track in a plain <audio> element, with short fades.
 * (iOS ignores element volume, so fades are a no-op there; playback still works.)
 */

// 0.05 s of silence. Browsers like Safari only let an <audio> element play later
// from code if it was started once during a user gesture, so we "prime" it with
// this first and swap in the real track when `play` runs.
const SILENT =
  "data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA";

const FADE_IN_MS = 1200;
const FADE_OUT_MS = 700;
const FADE_STEP_MS = 40;

let audio: HTMLAudioElement | null = null;
let trackLoaded = false;
let primed = false;
let fadeTimer: number | undefined;

function element(): HTMLAudioElement {
  if (audio) return audio;
  const el = new Audio();
  el.loop = true;
  el.preload = "none";
  el.src = SILENT;
  el.volume = 0;
  el.muted = getAudioState().muted;
  el.addEventListener("error", () => {
    if (trackLoaded) setPlaying(false); // e.g. the mp3 is missing
  });
  subscribeAudio(() => {
    el.muted = getAudioState().muted;
  });
  audio = el;
  return el;
}

function fadeTo(target: number, ms: number, done?: () => void): void {
  window.clearInterval(fadeTimer);
  const el = element();
  const start = el.volume;
  const steps = Math.max(1, Math.round(ms / FADE_STEP_MS));
  let step = 0;
  fadeTimer = window.setInterval(() => {
    step += 1;
    el.volume = Math.min(1, Math.max(0, start + ((target - start) * step) / steps));
    if (step >= steps) {
      window.clearInterval(fadeTimer);
      done?.();
    }
  }, FADE_STEP_MS);
}

/** Call from the first user gesture so a later `play` command is allowed to start sound. */
export function primeLofi(): void {
  if (primed) return;
  primed = true;
  try {
    const el = element();
    el.muted = true;
    Promise.resolve(el.play())
      .then(() => {
        if (!trackLoaded) el.pause(); // `play` may already have taken over
        el.muted = getAudioState().muted;
      })
      .catch(() => {
        primed = false;
        el.muted = getAudioState().muted;
      });
  } catch {
    primed = false;
  }
}

export function playLofi(): void {
  try {
    if (getAudioState().muted) setMuted(false); // asking for music turns sound on
    const el = element();
    el.muted = false;
    if (!trackLoaded) {
      el.src = config.lofi.src;
      trackLoaded = true;
    }
    setPlaying(true);
    Promise.resolve(el.play()).catch(() => setPlaying(false)); // blocked or failed
    fadeTo(config.lofi.volume, FADE_IN_MS);
  } catch {
    setPlaying(false);
  }
}

export function stopLofi(): void {
  setPlaying(false);
  if (!audio) return;
  const el = audio;
  fadeTo(0, FADE_OUT_MS, () => el.pause());
}
