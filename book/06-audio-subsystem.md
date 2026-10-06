# Chapter 06 — Audio Subsystem

> **What you'll be able to answer after this chapter:**
> How do keyboard sounds work? Why can't audio start immediately? What is the lofi player and how does it fade? What is audioStore and why is it outside React? How is mute state persisted?

---

## Architecture

The audio subsystem has three distinct layers:

```mermaid
flowchart TD
    User -->|key press / click| useKeySound
    User -->|play command| AudioCommand
    useKeySound -->|playKey()| KeySound["keySound.ts\n(Web Audio API)"]
    AudioCommand -->|lofi action| Actions["actions.ts"]
    Actions -->|playLofi()/stopLofi()| Lofi["lofi.ts\n(HTML Audio)"]
    KeySound -->|reads muted| AudioStore["audioStore.ts\n(shared state)"]
    Lofi -->|setPlaying()| AudioStore
    Lofi -->|setMuted(false)| AudioStore
    Prefs["preferences.ts\n(localStorage)"] -->|initial muted| AudioStore
    AudioStore -->|writePrefs()| Prefs
    StatusBar -->|useAudio()| AudioStore
    AudioInit["audio.ts\n(init + unlock)"] -->|prefetchKeySounds()| KeySound
    AudioInit -->|primeLofi()| Lofi
    App -->|initAudio()| AudioInit
```

---

## audio.ts — Startup & Gesture Unlock

```ts
// src/services/audio.ts
const GESTURES = ["click", "touchend", "keydown"] as const;

export function initAudio(): () => void {
  prefetchKeySounds();  // start loading key sound files (no gesture needed)

  const remove = () => GESTURES.forEach((type) => window.removeEventListener(type, unlock, true));
  function unlock() {
    unlockKeySounds();  // creates / resumes AudioContext
    primeLofi();        // primes the <audio> element
    remove();           // fire once, then unregister
  }
  GESTURES.forEach((type) => window.addEventListener(type, unlock, true));
  return remove;  // cleanup for App useEffect
}
```

**Why gesture unlock?** Web browsers block audio from starting without a user gesture (click, keydown, touchend). `AudioContext` creation will succeed but start in `"suspended"` state. The first user interaction calls `unlock()` which:
1. Creates/resumes the `AudioContext` for key sounds.
2. Calls `primeLofi()` to pre-start the `<audio>` element (also needs a gesture on some browsers).

**Capture phase (`true`):** The listeners use the capture phase so they fire before React's synthetic events. This ensures audio is unlocked even if the first interaction goes through React's event system.

**`remove()` is idempotent:** Called after the first gesture, and again as the `App.useEffect` cleanup. Calling `removeEventListener` for a listener that's already removed is a no-op.

---

## audioStore.ts — The Shared State

```ts
// src/services/audioStore.ts
export interface AudioState { muted: boolean; playing: boolean; }

let state: AudioState = { muted: readPrefs().muted, playing: false };
const listeners = new Set<() => void>();

export function getAudioState(): AudioState { return state; }

export function subscribeAudio(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);  // returns unsubscribe
}

function update(patch: Partial<AudioState>): void {
  const next = { ...state, ...patch };
  if (next.muted === state.muted && next.playing === state.playing) return;  // no-op if unchanged
  state = next;
  listeners.forEach((listener) => listener());
}

export function setMuted(muted: boolean): void { update({ muted }); writePrefs({ muted }); }
export function toggleMuted(): void { setMuted(!state.muted); }
export function setPlaying(playing: boolean): void { update({ playing }); }
export function resetAudioState(): void { state = { muted: false, playing: false }; listeners.forEach(l => l()); }
```

**Why not React Context?** The audio state is read by:
1. The command engine (via `getAudioState()` in `execute()`) — no React available.
2. `keySound.ts` (checks `muted` before playing) — no React available.
3. `lofi.ts` (checks `muted` at init) — no React available.
4. `StatusBar` via `useAudio` hook — React.

Using React Context would require the engine and services to somehow access React state, which violates the engine-purity constraint. The module-level singleton with a pub/sub API solves this cleanly.

**`useSyncExternalStore` in `useAudio`:**

```ts
// src/hooks/useAudio.ts
export function useAudio() {
  const { muted, playing } = useSyncExternalStore(subscribeAudio, getAudioState);
  return { muted, playing, trackLabel: `${config.lofi.title} by ${config.lofi.artist}`, toggleMuted };
}
```

`useSyncExternalStore` is React 18's built-in hook for subscribing to external stores. It handles tearing (consistency between render passes) correctly. `subscribeAudio` and `getAudioState` are the subscribe/getSnapshot pair it needs.

**Initial muted state:** `readPrefs().muted` is called at module initialization time (when the file is first imported). This means the mute preference is applied before any React renders, preventing a flash of "sound on" for users who had it muted.

---

## keySound.ts — Web Audio Keyboard Sounds

This is the most complex service. It uses the Web Audio API to play mechanical keyboard sounds with low latency.

### Loading

```ts
// src/services/keySound.ts:36-64
async function load(decoder: BaseAudioContext, phase: Phase): Promise<void> {
  const genericNames = phase === "press"
    ? Array.from({ length: genericVariants }, (_, i) => `GENERIC_R${i}`)
    : ["GENERIC"];

  const fetchBuffer = async (name: string): Promise<AudioBuffer | null> => {
    try {
      const response = await fetch(url(phase, name));
      if (!response.ok) return null;
      return await decoder.decodeAudioData(await response.arrayBuffer());
    } catch { return null; }  // missing file or network error: silently skip
  };

  const [generic, backspace, enter, space] = await Promise.all([
    Promise.all(genericNames.map(fetchBuffer)),
    fetchBuffer("BACKSPACE"), fetchBuffer("ENTER"), fetchBuffer("SPACE"),
  ]);

  banks[phase].generic = generic.filter((b): b is AudioBuffer => b !== null);
  if (backspace) banks[phase].special.backspace = backspace;
  if (enter)    banks[phase].special.enter = enter;
  if (space)    banks[phase].special.space = space;
}
```

**`OfflineAudioContext` for decoding:** Decoding is done in an `OfflineAudioContext` (which doesn't require a user gesture). The decoded `AudioBuffer`s are stored in the `banks` object. When a key is pressed, they are played through the real `AudioContext`.

**File paths:** `${basePath}/${pack}/${phase}/${name}.mp3`
- `basePath`: `/audio/keys`
- `pack`: `bluealps` (configurable in `config.keyboard.pack`)
- `phase`: `press` or `release`
- `name`: `GENERIC_R0`, `GENERIC_R1`, …, `BACKSPACE`, `ENTER`, `SPACE`

**Graceful degradation:** Any missing file returns `null` and is filtered out. If no files load (wrong pack name, no network), the terminal is silent but fully functional.

### Playback

```ts
// src/services/keySound.ts:111-141
export function playKey(kind: KeyKind, phase: Phase = "press"): void {
  try {
    if (getAudioState().muted) return;

    const now = performance.now();
    if (now - lastPlayed[phase] < MIN_GAP_MS) return;  // de-bounce (25ms minimum gap)

    const buffer = pick(kind, phase);
    if (!buffer) return;
    const audio = getContext();
    if (!audio) return;
    lastPlayed[phase] = now;

    const source = audio.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = 1 + (Math.random() - 0.5) * 0.06;  // ±3% pitch randomization

    const gain = audio.createGain();
    gain.gain.value = config.keyboard.volume * (0.92 + Math.random() * 0.16);  // ±8% volume

    source.connect(gain);
    gain.connect(audio.destination);
    source.onended = () => { source.disconnect(); gain.disconnect(); };
    source.start();
  } catch { /* sound must never break typing */ }
}
```

**Why Web Audio API (not `<audio>`):** Web Audio API buffers are pre-loaded in memory. Playback is near-instant with no seek delay. `<audio>` elements have ~100ms+ latency that makes key sounds feel disconnected from typing. Web Audio also allows overlapping sounds (multiple rapid keypresses) and the pitch/volume randomization.

**Per-press randomization:** `playbackRate ± 3%` and `gain ± 8%` make each key press sound slightly different, simulating the natural variation of real mechanical keys.

**De-bounce (25ms):** Prevents double-playing on bounce events (some keyboards send multiple keydown events for one physical press).

**`pick(kind, phase)`:** For `generic` keys, rotates through the available GENERIC samples, never repeating the same sample twice in a row. For special keys (Enter, Backspace, Space), uses the dedicated sample if loaded.

---

## lofi.ts — The Music Player

```ts
// src/services/lofi.ts — simplified
const SILENT = "data:audio/wav;base64,…"; // 0.05s of silence

let audio: HTMLAudioElement | null = null;
let trackLoaded = false;
let primed = false;

function element(): HTMLAudioElement {
  if (audio) return audio;
  const el = new Audio();
  el.loop = true;
  el.preload = "none";
  el.src = SILENT;  // start with silence
  el.volume = 0;
  el.muted = getAudioState().muted;
  subscribeAudio(() => { el.muted = getAudioState().muted; });
  audio = el;
  return el;
}
```

**The priming trick:** Browsers (especially Safari) block `audio.play()` from code unless the `<audio>` element was ever started during a user gesture. `primeLofi()` calls `el.play()` on the **silent** track during the first gesture. Later, when the user types `play`, `playLofi()` swaps in the real MP3 — by which point the element is already "started" and the browser allows it.

**`el.src = SILENT` first:** The silent WAV is a base64 data URI — no network request needed. This ensures the element is always in a playable state even offline.

```ts
export function playLofi(): void {
  try {
    if (getAudioState().muted) setMuted(false);  // playing music turns sound on
    const el = element();
    el.muted = false;
    if (!trackLoaded) {
      el.src = config.lofi.src;  // swap in real MP3 on first play
      trackLoaded = true;
    }
    setPlaying(true);
    Promise.resolve(el.play()).catch(() => setPlaying(false));
    fadeTo(config.lofi.volume, FADE_IN_MS);  // 1.2s fade in
  } catch { setPlaying(false); }
}

export function stopLofi(): void {
  setPlaying(false);
  if (!audio) return;
  const el = audio;
  fadeTo(0, FADE_OUT_MS, () => el.pause());  // 0.7s fade out, then pause
}
```

**Fade implementation:** `fadeTo(target, ms)` runs a `setInterval` at 40ms steps, linearly interpolating `el.volume` from current to target. iOS ignores `element.volume` entirely (audio always plays at system volume), so fades are a no-op on iOS — but the music still plays.

**`play()` returns a Promise:** `el.play()` is async and can fail (e.g., blocked by browser autoplay policy even after priming). The `.catch(() => setPlaying(false))` ensures the `playing` state stays correct if play is rejected.

---

## useKeySound — Physical vs. Virtual Keyboard

```ts
// src/hooks/useKeySound.ts
export function useKeySound() {
  const virtual = useRef(false);

  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (isVirtualKey(event.key, event.nativeEvent.keyCode)) {
      virtual.current = true;
      return;
    }
    virtual.current = false;
    const kind = classifyKey(event.key);
    if (kind) playKey(kind, "press");
  };

  const keyUp = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!config.keyboard.playRelease || virtual.current) return;
    const kind = classifyKey(event.key);
    if (kind) playKey(kind, "release");
  };

  const inputChange = (previous: string, next: string) => {
    if (!virtual.current) return;
    const kind = classifyInputChange(previous, next);
    if (kind) playKey(kind, "press");
  };

  return { keyDown, keyUp, inputChange };
}
```

**Virtual keyboard detection:** Android virtual keyboards report `key === "Unidentified"` and `keyCode === 229` for every keydown. On such devices, `virtual.current` is set to `true`, and sounds are triggered via `inputChange` instead (which compares the previous and next input value to determine what changed).

**Physical keyboard flow:** `keyDown` → `classifyKey(event.key)` → `playKey("press")`. Optionally `keyUp` → `playKey("release")` if `config.keyboard.playRelease` is true.

**Virtual keyboard flow:** `keyDown` fires with `"Unidentified"` → `virtual = true`. `inputChange(previous, next)` fires when the `<input>` value changes → `classifyInputChange()` → `playKey("press")`.

---

## preferences.ts — Mute Persistence

```ts
// src/services/preferences.ts
const KEY = "rosh:prefs";

export function readPrefs(): Prefs {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Prefs>) : {};
    return { muted: parsed.muted === true };  // strict: only true is muted
  } catch { return { muted: false }; }  // blocked or parse error
}

export function writePrefs(prefs: Prefs): void {
  try { window.localStorage.setItem(KEY, JSON.stringify(prefs)); }
  catch { /* ignore — storage full or blocked in private mode */ }
}
```

**`parsed.muted === true` (strict equality):** Prevents truthy-but-not-boolean values from being interpreted as muted. If the stored JSON is corrupt or has a different type for `muted`, the default is `false`.

**Try/catch everywhere:** `localStorage` can throw in private browsing mode (Safari), when storage is full, or when blocked by Content Security Policy. Errors are silently swallowed.

---

**→ Check your understanding:** [quizzes/06-audio-quiz.md](quizzes/06-audio-quiz.md)
